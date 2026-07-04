const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAction } = require('../services/auditService');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const items = db.prepare('SELECT * FROM items ORDER BY category, name').all();
  res.json(items);
});

router.post('/', authenticate, authorize('admin', 'manager'), (req, res) => {
  const { name, category, default_unit_cost } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'name is required.' });
  }
  const id = uuid();
  db.prepare(
    'INSERT INTO items (id, name, category, default_unit_cost) VALUES (?, ?, ?, ?)'
  ).run(id, name, category || null, default_unit_cost || 0);
  logAction({ user: req.user, action: 'item.create', entityType: 'item', entityId: id, details: { name } });
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  res.status(201).json(item);
});

router.put('/:id', authenticate, authorize('admin', 'manager'), (req, res) => {
  const { name, category, default_unit_cost } = req.body;
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Item not found.' });
  }
  db.prepare(
    'UPDATE items SET name = ?, category = ?, default_unit_cost = ? WHERE id = ?'
  ).run(
    name ?? existing.name,
    category ?? existing.category,
    default_unit_cost ?? existing.default_unit_cost,
    req.params.id
  );
  logAction({ user: req.user, action: 'item.update', entityType: 'item', entityId: req.params.id });
  res.json(db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  const result = db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Item not found.' });
  }
  logAction({
    user: req.user,
    action: 'item.delete',
    entityType: 'item',
    entityId: req.params.id,
    details: { name: existing?.name },
  });
  res.status(204).send();
});

module.exports = router;
