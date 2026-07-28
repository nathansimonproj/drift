const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false,
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
      target_bedtime TEXT NOT NULL DEFAULT '23:00',
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
}

module.exports = { pool, init };
