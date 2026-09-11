const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, resetDb, closePool } = require('./helpers/testServer');
const { api } = require('./helpers/api');

let server;
let client;

before(async () => {
  server = await startTestServer();
  client = api(server.baseUrl);
});

after(async () => {
  await server.close();
  await closePool();
});

beforeEach(resetDb);

const credentials = { email: 'tester@example.com', password: 'password123' };

describe('POST /auth/register', () => {
  test('creates an account and returns ok + a bearer token', async () => {
    const res = await client.post('/auth/register', credentials);
    assert.equal(res.status, 200);
    assert.equal(res.json.ok, true);
    assert.equal(typeof res.json.token, 'string');
    assert.ok(res.json.token.length > 20);
  });

  test('also sets a session cookie for the web client', async () => {
    const res = await client.post('/auth/register', credentials);
    assert.ok(res.setCookie, 'expected a Set-Cookie header');
  });

  test('rejects a duplicate email with 409', async () => {
    await client.post('/auth/register', credentials);
    const res = await client.post('/auth/register', credentials);
    assert.equal(res.status, 409);
  });

  test('rejects an invalid email', async () => {
    const res = await client.post('/auth/register', { email: 'not-an-email', password: 'password123' });
    assert.equal(res.status, 400);
  });

  test('rejects a password under 8 characters', async () => {
    const res = await client.post('/auth/register', { email: 'short@example.com', password: 'short' });
    assert.equal(res.status, 400);
  });

  test('rejects a missing email or password', async () => {
    const res = await client.post('/auth/register', { email: 'nopass@example.com' });
    assert.equal(res.status, 400);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await client.post('/auth/register', credentials);
  });

  test('succeeds with correct credentials and returns a token', async () => {
    const res = await client.post('/auth/login', credentials);
    assert.equal(res.status, 200);
    assert.equal(typeof res.json.token, 'string');
  });

  test('fails with the wrong password', async () => {
    const res = await client.post('/auth/login', { email: credentials.email, password: 'wrongpassword' });
    assert.equal(res.status, 401);
  });

  test('fails for an email that was never registered', async () => {
    const res = await client.post('/auth/login', { email: 'nobody@example.com', password: 'password123' });
    assert.equal(res.status, 401);
  });

  test('a token from login authenticates subsequent requests', async () => {
    const login = await client.post('/auth/login', credentials);
    const events = await client.get('/events', { token: login.json.token });
    assert.equal(events.status, 200);
    assert.deepEqual(events.json, []);
  });

  test('a cookie from login authenticates subsequent requests too', async () => {
    const login = await client.post('/auth/login', credentials);
    const cookie = login.setCookie.split(';')[0];
    const events = await client.get('/events', { cookie });
    assert.equal(events.status, 200);
  });
});

describe('auth-gated routes', () => {
  test('reject an unauthenticated JSON request with 401', async () => {
    const res = await client.get('/events');
    assert.equal(res.status, 401);
    assert.equal(res.json.error, 'Unauthorized');
  });

  test('reject a bearer token from a different (nonexistent) session', async () => {
    const res = await client.get('/events', { token: 'not-a-real-token' });
    assert.equal(res.status, 401);
  });
});

describe('POST /auth/logout', () => {
  test('revokes the bearer token used to log out', async () => {
    await client.post('/auth/register', credentials);
    const login = await client.post('/auth/login', credentials);
    const token = login.json.token;

    await client.post('/auth/logout', undefined, { token });

    const res = await client.get('/events', { token });
    assert.equal(res.status, 401, 'token should be revoked after logout');
  });

  test('does not affect a cookie session that logs out independently', async () => {
    await client.post('/auth/register', credentials);
    const login = await client.post('/auth/login', credentials);
    const cookie = login.setCookie.split(';')[0];

    // Log out via bearer only; the cookie session should still work.
    await client.post('/auth/logout', undefined, { token: login.json.token });
    const res = await client.get('/events', { cookie });
    assert.equal(res.status, 200);
  });
});

describe('password reset flow', () => {
  test('forgot-password always returns the generic response, known email or not', async () => {
    await client.post('/auth/register', credentials);
    const known = await client.post('/auth/forgot-password', { email: credentials.email });
    const unknown = await client.post('/auth/forgot-password', { email: 'nobody@example.com' });
    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.equal(known.json.message, unknown.json.message);
  });

  test('reset-password rejects an invalid token', async () => {
    const res = await client.post('/auth/reset-password', { token: 'bogus-token', password: 'newpassword123' });
    assert.equal(res.status, 400);
  });

  test('reset-password rejects a short password', async () => {
    const res = await client.post('/auth/reset-password', { token: 'bogus-token', password: 'short' });
    assert.equal(res.status, 400);
  });
});

describe('DELETE /auth/account', () => {
  test('requires authentication', async () => {
    const res = await client.del('/auth/account');
    assert.equal(res.status, 401);
  });

  test('deletes the account and its data, and the token stops working', async () => {
    await client.post('/auth/register', credentials);
    const login = await client.post('/auth/login', credentials);
    const token = login.json.token;

    await client.post('/events', { id: 'e1', type: 'coffee', amount: 135, time: new Date().toISOString() }, { token });

    const del = await client.del('/auth/account', { token });
    assert.equal(del.status, 200);

    const after = await client.get('/events', { token });
    assert.equal(after.status, 401);

    // The email is free again since the row is really gone.
    const reregister = await client.post('/auth/register', credentials);
    assert.equal(reregister.status, 200);
  });
});
