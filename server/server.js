require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const { pool, init } = require('./db');
const authRoutes = require('./auth');
const profileRoutes = require('./profile');

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

function requireAuth(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/pages/login.html');
}

// Public: auth API and login page
app.use('/auth', authRoutes);

// Protected API routes
app.use('/profile', requireAuth, profileRoutes);
app.get('/pages/login.html', (_req, res) =>
  res.sendFile(path.join(ROOT, 'pages', 'login.html'))
);

// Root redirects to home page
app.get('/', (_req, res) => res.redirect('/pages/home.html'));

// Everything else requires a valid session
app.use(requireAuth, express.static(ROOT));

const PORT = process.env.PORT || 3000;
init()
  .then(() => {
    app.listen(PORT, () => console.log(`Drift running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
