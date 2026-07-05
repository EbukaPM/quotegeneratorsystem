const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const quoteService = require('../services/quoteService');
const { renderQuotationPdf } = require('../services/pdfService');
const { logAction } = require('../services/auditService');

const router = express.Router();

// GET /quotes/:jobId -> list all quotation options for a job
router.get('/:jobId', authenticate, (req, res) => {
  const quotations = db
    .prepare('SELECT * FROM quotations WHERE job_id = ? ORDER BY option_number')
    .all(req.params.jobId);
  const withItems = quotations.map((q) => quoteService.getQuotationWithItems(q.id));
  res.json(withItems);
});

// GET /quotes/detail/:id -> single quotation with items
router.get('/detail/:id', authenticate, (req, res) => {
  const quotation = quoteService.getQuotationWithItems(req.params.id);
  if (!quotation) {
    return res.status(404).json({ error: 'Quotation not found.' });
  }
  res.json(quotation);
});

// GET /quotes/:id/versions -> version/history list
router.get('/:id/versions', authenticate, (req, res) => {
  const versions = db
    .prepare(
      `SELECT v.id, v.version_number, v.change_type, v.created_at, u.name AS changed_by_name
       FROM quotation_versions v
       LEFT JOIN users u ON u.id = v.changed_by
       WHERE v.quotation_id = ?
       ORDER BY v.version_number DESC`
    )
    .all(req.params.id);
  res.json(versions);
});

// GET /quotes/:id/pdf -> generate and stream PDF
router.get('/:id/pdf', authenticate, async (req, res) => {
  const quotation = quoteService.getQuotationWithItems(req.params.id);
  if (!quotation) {
    return res.status(404).json({ error: 'Quotation not found.' });
  }
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(quotation.job_id);
  try {
    const pdfBuffer = await renderQuotationPdf(quotation, job);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="quotation-${quotation.option_number}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation failed:', err);
    res.status(500).json({ error: 'Failed to generate PDF.', detail: err.message });
  }
});

// POST /quotes -> create a new quotation option for a job
router.post('/', authenticate, authorize('admin', 'manager', 'staff'), (req, res) => {
  const { job_id, option_number, title, power_description, markup_percent, items } = req.body;

  if (!job_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'job_id and a non-empty items array are required.' });
  }

  const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(job_id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const quotation = quoteService.createQuotation({
    jobId: job_id,
    optionNumber: option_number || 1,
    title,
    powerDescription: power_description,
    markupPercent: markup_percent || 0,
    items,
    userId: req.user.id,
  });

  logAction({
    user: req.user,
    action: 'quote.create',
    entityType: 'quotation',
    entityId: quotation.id,
    details: { job_id, option_number: quotation.option_number },
  });
  res.status(201).json(quotation);
});

// PUT /quotes/:id/select -> mark this option as the one the client picked (or unmark it)
router.put('/:id/select', authenticate, authorize('admin'), (req, res) => {
  const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
  if (!quotation) {
    return res.status(404).json({ error: 'Quotation not found.' });
  }

  const selected = req.body.selected !== false;

  if (selected) {
    db.prepare(
      "UPDATE quotations SET is_selected = 0, selected_at = NULL, selected_by = NULL WHERE job_id = ?"
    ).run(quotation.job_id);
    db.prepare(
      "UPDATE quotations SET is_selected = 1, selected_at = datetime('now'), selected_by = ? WHERE id = ?"
    ).run(req.user.id, req.params.id);
  } else {
    db.prepare(
      "UPDATE quotations SET is_selected = 0, selected_at = NULL, selected_by = NULL WHERE id = ?"
    ).run(req.params.id);
  }

  logAction({
    user: req.user,
    action: selected ? 'quote.select' : 'quote.unselect',
    entityType: 'quotation',
    entityId: req.params.id,
    details: { job_id: quotation.job_id, option_number: quotation.option_number },
  });

  res.json(quoteService.getQuotationWithItems(req.params.id));
});

// PUT /quotes/:id/confirm-payment -> confirm the selected option has been paid, capturing markup as income
router.put('/:id/confirm-payment', authenticate, authorize('admin'), (req, res) => {
  const quotation = db.prepare('SELECT * FROM quotations WHERE id = ?').get(req.params.id);
  if (!quotation) {
    return res.status(404).json({ error: 'Quotation not found.' });
  }
  if (!quotation.is_selected) {
    return res.status(400).json({ error: 'Only the option selected by the client can be marked as paid.' });
  }
  if (quotation.payment_status === 'paid') {
    return res.json(quoteService.getQuotationWithItems(req.params.id));
  }

  db.prepare(
    "UPDATE quotations SET payment_status = 'paid', paid_at = datetime('now'), paid_by = ? WHERE id = ?"
  ).run(req.user.id, req.params.id);

  const markupAmount = quotation.grand_total - quotation.subtotal;
  const incomeId = uuid();
  db.prepare(
    `INSERT INTO income_records (id, quotation_id, job_id, amount, recorded_by)
     VALUES (?, ?, ?, ?, ?)`
  ).run(incomeId, quotation.id, quotation.job_id, markupAmount, req.user.id);

  logAction({
    user: req.user,
    action: 'quote.payment_confirm',
    entityType: 'quotation',
    entityId: req.params.id,
    details: { job_id: quotation.job_id, amount: markupAmount },
  });

  res.json(quoteService.getQuotationWithItems(req.params.id));
});

// PUT /quotes/:id -> edit quotation (items, markup, description, status)
router.put('/:id', authenticate, authorize('admin', 'manager'), (req, res) => {
  const { title, power_description, markup_percent, items, status } = req.body;

  const updated = quoteService.updateQuotation(req.params.id, {
    title,
    powerDescription: power_description,
    markupPercent: markup_percent,
    items,
    status,
    userId: req.user.id,
  });

  if (!updated) {
    return res.status(404).json({ error: 'Quotation not found.' });
  }
  logAction({ user: req.user, action: 'quote.update', entityType: 'quotation', entityId: req.params.id });
  res.json(updated);
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const result = db.prepare('DELETE FROM quotations WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Quotation not found.' });
  }
  logAction({ user: req.user, action: 'quote.delete', entityType: 'quotation', entityId: req.params.id });
  res.status(204).send();
});

module.exports = router;
