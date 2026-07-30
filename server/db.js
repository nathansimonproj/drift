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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

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
