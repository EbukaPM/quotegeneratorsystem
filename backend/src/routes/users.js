const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { logAction } = require('../services/auditService');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), (req, res) => {
  const users = db
    .prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC')
    .all();
  res.json(users);
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'User not found.' });
  }
  if (target.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot remove your own account.' });
  }
  if (target.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last remaining admin.' });
    }
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  logAction({
    user: req.user,
    action: 'user.delete',
    entityType: 'user',
    entityId: target.id,
    details: { name: target.name, email: target.email, role: target.role },
  });
  res.status(204).send();
});

module.exports = router;
