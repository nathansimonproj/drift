require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const { pool, init } = require('./db');
const authRoutes = require('./auth');
const profileRoutes = require('./profile');
const eventsRoutes = require('./events');
const { requireAuth } = require('./middleware');

const app = express();
const ROOT = path.join(__dirname, '..');

app.use(express.json());

app.use(session({
  store: new pgSession({ pool, tableName: 'session', createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-before-deploying',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// Public: auth API and login page (DELETE /auth/account is individually
// gated below since it needs an authenticated user).
app.delete('/auth/account', requireAuth);
app.use('/auth', authRoutes);

// Protected API routes
app.use('/profile', requireAuth, profileRoutes);
app.use('/events', requireAuth, eventsRoutes);
app.get('/pages/login.html', (_req, res) =>
  res.sendFile(path.join(ROOT, 'pages', 'login.html'))
);
app.get('/pages/forgot-password.html', (_req, res) =>
  res.sendFile(path.join(ROOT, 'pages', 'forgot-password.html'))
);
app.get('/pages/reset-password.html', (_req, res) =>
  res.sendFile(path.join(ROOT, 'pages', 'reset-password.html'))
);
app.get('/pages/privacy.html', (_req, res) =>
  res.sendFile(path.join(ROOT, 'pages', 'privacy.html'))
);

// Root redirects to home page
app.get('/', (_req, res) => res.redirect('/pages/home.html'));

// Everything else requires a valid session
app.use(requireAuth, express.static(ROOT));

async function start() {
  const PORT = process.env.PORT || 3000;
  await init();
  return app.listen(PORT, () => console.log(`Drift running at http://localhost:${PORT}`));
}

// Only auto-start when run directly (`node server/server.js` / `npm start`).
// When required by the test suite, the caller controls init()/listen() so it
// can point at a throwaway test database and an ephemeral port.
if (require.main === module) {
  start().catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
}

module.exports = { app, init, start };
