const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticate, (req, res) => {
  const totalJobs = db.prepare('SELECT COUNT(*) AS c FROM jobs').get().c;
  const totalQuotes = db.prepare('SELECT COUNT(*) AS c FROM quotations').get().c;
  const totalRevenueProjection = db
    .prepare("SELECT COALESCE(SUM(grand_total), 0) AS total FROM quotations WHERE status = 'final'")
    .get().total;
  const pendingRevenueProjection = db
    .prepare("SELECT COALESCE(SUM(grand_total), 0) AS total FROM quotations WHERE status = 'draft'")
    .get().total;
  const confirmedIncome = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM income_records').get().total;
  const selectedQuotesCount = db.prepare('SELECT COUNT(*) AS c FROM quotations WHERE is_selected = 1').get().c;

  const revenueByMonth = db
    .prepare(
      `SELECT strftime('%Y-%m', created_at) AS month, SUM(grand_total) AS total
       FROM quotations
       GROUP BY month
       ORDER BY month ASC
       LIMIT 12`
    )
    .all();

  const recentActivity = db
    .prepare(
      `SELECT v.id, v.change_type, v.created_at, u.name AS changed_by_name,
              q.option_number, q.title, j.name AS job_name, j.id AS job_id, q.id AS quotation_id
       FROM quotation_versions v
       LEFT JOIN users u ON u.id = v.changed_by
       LEFT JOIN quotations q ON q.id = v.quotation_id
       LEFT JOIN jobs j ON j.id = q.job_id
       ORDER BY v.created_at DESC
       LIMIT 15`
    )
    .all();

  res.json({
    totalJobs,
    totalQuotes,
    totalRevenueProjection,
    pendingRevenueProjection,
    confirmedIncome,
    selectedQuotesCount,
    revenueByMonth,
    recentActivity,
  });
});

module.exports = router;
