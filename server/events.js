const express = require('express');
const { pool } = require('./db');

const router = express.Router();

router.get('/', async (req, res) => {
  const userId = req.session.userId;
  // Mirror the client's 30h retention window server-side too.
  await pool.query(
    "DELETE FROM events WHERE user_id = $1 AND occurred_at < now() - interval '30 hours'",
    [userId]
  );
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
    [id, req.session.userId, type, String(amount), time]
  );
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await pool.query(
    'DELETE FROM events WHERE id = $1 AND user_id = $2',
    [req.params.id, req.session.userId]
  );
  res.json({ ok: true });
});

module.exports = router;
