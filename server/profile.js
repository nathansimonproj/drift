const express = require('express');
const db = require('./db');

const router = express.Router();

router.get('/', (req, res) => {
  const profile = db
    .prepare('SELECT * FROM profiles WHERE user_id = ?')
    .get(req.session.userId);
  res.json(profile || {});
});

router.put('/', (req, res) => {
  const { name, sex, height, heightUnit, weight, weightUnit, targetBedtime } = req.body;
  db.prepare(`
    INSERT INTO profiles (user_id, name, sex, height, height_unit, weight, weight_unit, target_bedtime, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      name            = excluded.name,
      sex             = excluded.sex,
      height          = excluded.height,
      height_unit     = excluded.height_unit,
      weight          = excluded.weight,
      weight_unit     = excluded.weight_unit,
      target_bedtime  = excluded.target_bedtime,
      updated_at      = CURRENT_TIMESTAMP
  `).run(
    req.session.userId,
    name        || '',
    sex         || '',
    height      ? parseFloat(height) : null,
    heightUnit  || 'cm',
    weight      ? parseFloat(weight) : null,
    weightUnit  || 'kg',
    targetBedtime || '23:00'
  );
  res.json({ ok: true });
});

module.exports = router;
