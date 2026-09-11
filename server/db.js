const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
});

// Neon (and most serverless Postgres) can drop idle connections in the pool.
// Without this listener, that error is unhandled and crashes the whole process.
pool.on('error', (err) => {
  console.error('Unexpected idle Postgres client error', err);
});

async function init() {
  // One-time migration for pre-existing databases: rename username -> email.
  // No-op on a fresh database (users table doesn't exist yet) and no-op once
  // already migrated (email column already present).
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'username'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email'
      ) THEN
        ALTER TABLE users RENAME COLUMN username TO email;
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);

    -- Long-lived bearer tokens for the native (iOS) client, issued alongside
    -- the existing cookie session on login/register. Only a hash is stored,
    -- same principle as the password hash, so a DB leak doesn't leak usable
    -- tokens. Revocable (unlike a stateless JWT) so logout/"forgot password"
    -- can actually invalidate a lost device.
    CREATE TABLE IF NOT EXISTS api_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      last_used_at TIMESTAMPTZ,
      device_label TEXT,
      expires_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS api_tokens_user_id_idx ON api_tokens(user_id);

    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT '',
      sex TEXT NOT NULL DEFAULT '',
      height REAL,
      height_unit TEXT NOT NULL DEFAULT 'cm',
      weight REAL,
      weight_unit TEXT NOT NULL DEFAULT 'kg',
      target_bedtime TEXT NOT NULL DEFAULT '22:00',
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- amount is stored as text since it's either a number (mg, drinks, minutes)
    -- or a variant/intensity/size key (e.g. "diet", "medium") depending on type.
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount TEXT NOT NULL,
      occurred_at TIMESTAMPTZ NOT NULL
    );
    CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);
  `);
}

module.exports = { pool, init };
