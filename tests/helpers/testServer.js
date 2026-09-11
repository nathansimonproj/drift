// Starts the real Express app (server/server.js) on an ephemeral port
// against DATABASE_URL, for integration tests that talk to it over HTTP
// exactly like a real client would. Requires DATABASE_URL to point at a
// throwaway Postgres database — never run tests against the production
// Neon database.
//
// Locally: `createdb drift_test && DATABASE_URL=postgresql://localhost/drift_test npm test`
// CI: a postgres service container provisions this (see .github/workflows/web-tests.yml).
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Point it at a throwaway test database before running tests ' +
    '(e.g. `createdb drift_test && DATABASE_URL=postgresql://localhost/drift_test npm test`).'
  );
}
if (!process.env.DATABASE_URL.includes('localhost') && !process.env.CI) {
  throw new Error('DATABASE_URL does not look like a local test database — refusing to run tests against it.');
}

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret';
// Force the mailer's no-API-key fallback (console.warn instead of a real
// SendGrid send) regardless of what .env has, since dotenv.config() (called
// by server/server.js) only fills in vars that aren't already set.
process.env.SENDGRID_API_KEY = '';
process.env.EMAIL_FROM = '';

const { app, init, pool } = (() => {
  const server = require('../../server/server');
  const { pool } = require('../../server/db');
  return { ...server, pool };
})();

async function startTestServer() {
  await init();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  return {
    baseUrl: `http://localhost:${port}`,
    async close() {
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

// Wipes all app data between tests. `users` cascades to profiles/events/
// api_tokens/password_reset_tokens via FK; `session` has no FK to users so
// it's truncated separately.
async function resetDb() {
  await pool.query('TRUNCATE TABLE users CASCADE');
  await pool.query('TRUNCATE TABLE session').catch(() => {
    // session table is created lazily by connect-pg-simple on first use.
  });
}

async function closePool() {
  await pool.end();
}

module.exports = { startTestServer, resetDb, closePool };
