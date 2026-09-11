const express = require('express');
const { pool } = require('./db');

const router = express.Router();

router.get('/', async (req, res) => {
  const userId = req.userId;
  // Full history is kept (no retention prune) so the calendar/history view
  // has past days to show — see docs/ROADMAP.md §2. (This used to run a 30h
  // prune here on every request, silently deleting anything older — fixed
  // 2026-08-14, but anything it already deleted is gone for good.)
  const result = await pool.query(
    'SELECT id, type, amount, occurred_at FROM events WHERE user_id = $1 ORDER BY occurred_at ASC',
    [userId]
  );
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { id, type, amount, time } = req.body;
  if (!id || !type || amount === undefined || amount === null || !time)
    return res.status(400).json({ error: 'Missing event fields' });

  await pool.query(
    'INSERT INTO events (id, user_id, type, amount, occurred_at) VALUES ($1, $2, $3, $4, $5)',
    [id, req.userId, type, String(amount), time]
  );
  res.json({ ok: true });
});

router.put('/:id', async (req, res) => {
  const { type, amount, time } = req.body;
  if (!type || amount === undefined || amount === null || !time)
    return res.status(400).json({ error: 'Missing event fields' });

  await pool.query(
    'UPDATE events SET type = $1, amount = $2, occurred_at = $3 WHERE id = $4 AND user_id = $5',
    [type, String(amount), time, req.params.id, req.userId]
  );
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query(
    'DELETE FROM events WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  res.json({ ok: true });
});

module.exports = router;
