const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { pool } = require('./db');
const { sendPasswordResetEmail } = require('./mailer');
const { issueApiToken, revokeApiToken, revokeAllApiTokens } = require('./tokens');

const router = express.Router();
const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

router.post('/register', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });
  if (!EMAIL_RE.test(email))
    return res.status(400).json({ error: 'Enter a valid email address' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hash]
    );
    req.session.userId = result.rows[0].id;
    const token = await issueApiToken(result.rows[0].id, req.body.deviceLabel);
    res.json({ ok: true, token });
  } catch (err) {
    if (err.code === '23505') // unique_violation
      return res.status(409).json({ error: 'An account with that email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  const user = result.rows[0];

  // Always run bcrypt compare to avoid timing attacks even when user not found.
  const hash = user?.password_hash ?? '$2b$12$invalidhashfortimingprotection000000000000000000000000';
  const match = await bcrypt.compare(password, hash);

  if (!user || !match)
    return res.status(401).json({ error: 'Invalid email or password' });

  req.session.userId = user.id;
  const token = await issueApiToken(user.id, req.body.deviceLabel);
  res.json({ ok: true, token });
});

router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (match) await revokeApiToken(match[1]);
  req.session.destroy(() => res.json({ ok: true }));
});

// Always responds with the same generic message regardless of whether the
// email exists, so this endpoint can't be used to enumerate registered users.
router.post('/forgot-password', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const genericResponse = { ok: true, message: 'If an account exists for that email, a reset link has been sent.' };
  if (!email || !EMAIL_RE.test(email))
    return res.json(genericResponse);

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await pool.query(
        'INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
        [token, user.id, expiresAt]
      );
      await sendPasswordResetEmail(email, token);
    }
  } catch (err) {
    console.error('forgot-password error', err);
    // Fall through to the generic response either way.
  }

  res.json(genericResponse);
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ error: 'Missing token or password' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const result = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token = $1',
    [token]
  );
  const record = result.rows[0];

  if (!record || record.used_at || record.expires_at < new Date())
    return res.status(400).json({ error: 'This reset link is invalid or has expired' });

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, record.user_id]);
  await pool.query('UPDATE password_reset_tokens SET used_at = now() WHERE token = $1', [token]);
  // A stolen device's bearer token shouldn't survive a password reset.
  await revokeAllApiTokens(record.user_id);

  res.json({ ok: true });
});

// Requires an authenticated request (cookie or bearer) — mounted with
// requireAuth in server.js. Apple requires in-app account deletion for any
// app with account creation (App Review Guideline 5.1.1(v)).
router.delete('/account', async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.userId]);
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
