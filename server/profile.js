const express = require('express');
const { pool } = require('./db');

const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM profiles WHERE user_id = $1',
    [req.session.userId]
  );
  res.json(result.rows[0] || {});
});

router.put('/', async (req, res) => {
  const { name, sex, height, heightUnit, weight, weightUnit, targetBedtime } = req.body;
  await pool.query(`
    INSERT INTO profiles (user_id, name, sex, height, height_unit, weight, weight_unit, target_bedtime, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
    ON CONFLICT (user_id) DO UPDATE SET
      name            = excluded.name,
      sex             = excluded.sex,
      height          = excluded.height,
      height_unit     = excluded.height_unit,
      weight          = excluded.weight,
      weight_unit     = excluded.weight_unit,
      target_bedtime  = excluded.target_bedtime,
      updated_at      = now()
  `, [
    req.session.userId,
    name        || '',
    sex         || '',
    height      ? parseFloat(height) : null,
    heightUnit  || 'cm',
    weight      ? parseFloat(weight) : null,
    weightUnit  || 'kg',
    targetBedtime || '22:00',
  ]);
  res.json({ ok: true });
});

module.exports = router;
