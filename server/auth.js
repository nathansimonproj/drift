const express = require('express');
const bcrypt = require('bcrypt');
const db = require('./db');

const router = express.Router();
const SALT_ROUNDS = 12;

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = db
      .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
      .run(username.toLowerCase().trim(), hash);
    req.session.userId = result.lastInsertRowid;
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE')
      return res.status(409).json({ error: 'Username already taken' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password are required' });

  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username.toLowerCase().trim());

  // Always run bcrypt compare to avoid timing attacks even when user not found.
  const hash = user?.password_hash ?? '$2b$12$invalidhashfortimingprotection000000000000000000000000';
  const match = await bcrypt.compare(password, hash);

  if (!user || !match)
    return res.status(401).json({ error: 'Invalid username or password' });

  req.session.userId = user.id;
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
