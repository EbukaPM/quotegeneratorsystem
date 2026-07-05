const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const quoteService = require('../services/quoteService');
const { renderProposalPdf } = require('../services/pdfService');
const { logAction } = require('../services/auditService');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const jobs = db
    .prepare(
      `SELECT j.*, u.name AS created_by_name,
              (SELECT COUNT(*) FROM quotations q WHERE q.job_id = j.id) AS quotation_count
       FROM jobs j
       LEFT JOIN users u ON u.id = j.created_by
       ORDER BY j.created_at DESC`
    )
    .all();
  res.json(jobs);
});

router.get('/:id', authenticate, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }
  res.json(job);
});

// GET /jobs/:id/proposal/pdf -> combined cover + profile + all quotation options for the job
router.get('/:id/proposal/pdf', authenticate, async (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }
  const quotationRows = db
    .prepare('SELECT id FROM quotations WHERE job_id = ? ORDER BY option_number')
    .all(job.id);
  if (quotationRows.length === 0) {
    return res.status(400).json({ error: 'This job has no quotations yet.' });
  }
  const quotations = quotationRows.map((q) => quoteService.getQuotationWithItems(q.id));

  try {
    const pdfBuffer = await renderProposalPdf(job, quotations);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="proposal-${job.id}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Proposal PDF generation failed:', err);
    res.status(500).json({ error: 'Failed to generate proposal PDF.', detail: err.message });
  }
});

router.post('/', authenticate, authorize('admin', 'manager', 'staff'), (req, res) => {
  const { name, client_name, client_address, client_contact, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required.' });
  }
  const id = uuid();
  db.prepare(
    `INSERT INTO jobs (id, name, client_name, client_address, client_contact, description, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, name, client_name || null, client_address || null, client_contact || null, description || null, req.user.id);
  logAction({ user: req.user, action: 'job.create', entityType: 'job', entityId: id, details: { name } });
  res.status(201).json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(id));
});

router.put('/:id', authenticate, authorize('admin', 'manager'), (req, res) => {
  const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Job not found.' });
  }
  const { name, client_name, client_address, client_contact, description } = req.body;
  db.prepare(
    `UPDATE jobs SET name = ?, client_name = ?, client_address = ?, client_contact = ?, description = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    name ?? existing.name,
    client_name ?? existing.client_name,
    client_address ?? existing.client_address,
    client_contact ?? existing.client_contact,
    description ?? existing.description,
    req.params.id
  );
  logAction({ user: req.user, action: 'job.update', entityType: 'job', entityId: req.params.id });
  res.json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Job not found.' });
  }
  logAction({
    user: req.user,
    action: 'job.delete',
    entityType: 'job',
    entityId: req.params.id,
    details: { name: existing?.name },
  });
  res.status(204).send();
});

module.exports = router;
