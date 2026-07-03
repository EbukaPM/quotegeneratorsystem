const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const quoteService = require('../services/quoteService');
const { renderQuotationPdf } = require('../services/pdfService');

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
    res.status(500).json({ error: 'Failed to generate PDF.' });
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

  res.status(201).json(quotation);
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
  res.json(updated);
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const result = db.prepare('DELETE FROM quotations WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Quotation not found.' });
  }
  res.status(204).send();
});

module.exports = router;
