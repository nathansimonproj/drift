const { resolveApiToken } = require('./tokens');

// Accepts either the existing cookie session or a bearer token (used by the
// native iOS client), normalizing identity onto req.userId either way so
// route handlers don't need to know which auth path was used.
async function requireAuth(req, res, next) {
  if (req.session.userId) {
    req.userId = req.session.userId;
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  if (match) {
    const userId = await resolveApiToken(match[1]);
    if (userId) {
      req.userId = userId;
      return next();
    }
  }

  // Native/API clients want a JSON 401, not a redirect to an HTML login page.
  if (req.accepts(['html', 'json']) === 'json') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.redirect('/pages/login.html');
}

module.exports = { requireAuth };
