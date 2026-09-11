const crypto = require('crypto');
const { pool } = require('./db');

const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Issues a new bearer token for the native client, alongside the existing
// cookie session (callers still set req.session.userId as before).
async function issueApiToken(userId, deviceLabel) {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await pool.query(
    'INSERT INTO api_tokens (token_hash, user_id, device_label, expires_at) VALUES ($1, $2, $3, $4)',
    [hashToken(rawToken), userId, deviceLabel || null, expiresAt]
  );
  return rawToken;
}

async function revokeApiToken(rawToken) {
  await pool.query(
    'UPDATE api_tokens SET revoked_at = now() WHERE token_hash = $1',
    [hashToken(rawToken)]
  );
}

async function revokeAllApiTokens(userId) {
  await pool.query(
    'UPDATE api_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
}

// Resolves a raw bearer token to a user id, or null if invalid/expired/revoked.
async function resolveApiToken(rawToken) {
  const result = await pool.query(
    `SELECT user_id FROM api_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())`,
    [hashToken(rawToken)]
  );
  const row = result.rows[0];
  if (!row) return null;
  pool.query('UPDATE api_tokens SET last_used_at = now() WHERE token_hash = $1', [hashToken(rawToken)])
    .catch((err) => console.error('failed to update api_token last_used_at', err));
  return row.user_id;
}

module.exports = { issueApiToken, revokeApiToken, revokeAllApiTokens, resolveApiToken };
