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

async function registerAndLogin(email) {
  const res = await client.post('/auth/register', { email, password: 'password123' });
  return res.json.token;
}

describe('events CRUD', () => {
  test('GET /events starts empty for a new account', async () => {
    const token = await registerAndLogin('a@example.com');
    const res = await client.get('/events', { token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, []);
  });

  test('POST /events creates an event, visible on GET', async () => {
    const token = await registerAndLogin('a@example.com');
    const time = new Date('2026-01-01T08:00:00.000Z').toISOString();
    const create = await client.post('/events', { id: 'e1', type: 'coffee', amount: 135, time }, { token });
    assert.equal(create.status, 200);

    const list = await client.get('/events', { token });
    assert.equal(list.status, 200);
    assert.equal(list.json.length, 1);
    assert.equal(list.json[0].id, 'e1');
    assert.equal(list.json[0].type, 'coffee');
    // Postgres TEXT column round-trips whatever was sent, stringified.
    assert.equal(list.json[0].amount, '135');
    assert.equal(new Date(list.json[0].occurred_at).toISOString(), time);
  });

  test('POST /events rejects a missing required field', async () => {
    const token = await registerAndLogin('a@example.com');
    const res = await client.post('/events', { id: 'e1', type: 'coffee' }, { token });
    assert.equal(res.status, 400);
  });

  test('accepts a string or numeric amount, both stored as text', async () => {
    const token = await registerAndLogin('a@example.com');
    const time = new Date().toISOString();
    await client.post('/events', { id: 'e1', type: 'alcohol', amount: 'beer', time }, { token });
    await client.post('/events', { id: 'e2', type: 'coffee', amount: 135, time }, { token });

    const list = await client.get('/events', { token });
    const byId = Object.fromEntries(list.json.map((e) => [e.id, e]));
    assert.equal(byId.e1.amount, 'beer');
    assert.equal(byId.e2.amount, '135');
  });

  test('PUT /events/:id updates type/amount/time', async () => {
    const token = await registerAndLogin('a@example.com');
    const time = new Date('2026-01-01T08:00:00.000Z').toISOString();
    await client.post('/events', { id: 'e1', type: 'coffee', amount: 135, time }, { token });

    const newTime = new Date('2026-01-01T09:30:00.000Z').toISOString();
    const update = await client.put('/events/e1', { type: 'coffee', amount: 200, time: newTime }, { token });
    assert.equal(update.status, 200);

    const list = await client.get('/events', { token });
    assert.equal(list.json[0].amount, '200');
    assert.equal(new Date(list.json[0].occurred_at).toISOString(), newTime);
  });

  test('DELETE /events/:id removes it', async () => {
    const token = await registerAndLogin('a@example.com');
    const time = new Date().toISOString();
    await client.post('/events', { id: 'e1', type: 'coffee', amount: 135, time }, { token });

    const del = await client.del('/events/e1', { token });
    assert.equal(del.status, 200);

    const list = await client.get('/events', { token });
    assert.deepEqual(list.json, []);
  });

  test('events are ordered by occurred_at ascending', async () => {
    const token = await registerAndLogin('a@example.com');
    const late = new Date('2026-01-01T20:00:00.000Z').toISOString();
    const early = new Date('2026-01-01T06:00:00.000Z').toISOString();
    await client.post('/events', { id: 'late', type: 'coffee', amount: 135, time: late }, { token });
    await client.post('/events', { id: 'early', type: 'coffee', amount: 135, time: early }, { token });

    const list = await client.get('/events', { token });
    assert.deepEqual(list.json.map((e) => e.id), ['early', 'late']);
  });
});

describe('events ownership isolation', () => {
  test('one user cannot see another user\'s events', async () => {
    const tokenA = await registerAndLogin('a@example.com');
    const tokenB = await registerAndLogin('b@example.com');
    await client.post('/events', { id: 'a1', type: 'coffee', amount: 135, time: new Date().toISOString() }, { token: tokenA });

    const listB = await client.get('/events', { token: tokenB });
    assert.deepEqual(listB.json, []);
  });

  test('one user cannot update another user\'s event', async () => {
    const tokenA = await registerAndLogin('a@example.com');
    const tokenB = await registerAndLogin('b@example.com');
    await client.post('/events', { id: 'a1', type: 'coffee', amount: 135, time: new Date().toISOString() }, { token: tokenA });

    // The route reports 200 either way (WHERE id AND user_id matched 0 rows),
    // so assert on the actual data rather than the response status.
    await client.put('/events/a1', { type: 'coffee', amount: 999, time: new Date().toISOString() }, { token: tokenB });

    const listA = await client.get('/events', { token: tokenA });
    assert.equal(listA.json[0].amount, '135', "user B's update must not have applied to user A's event");
  });

  test('one user cannot delete another user\'s event', async () => {
    const tokenA = await registerAndLogin('a@example.com');
    const tokenB = await registerAndLogin('b@example.com');
    await client.post('/events', { id: 'a1', type: 'coffee', amount: 135, time: new Date().toISOString() }, { token: tokenA });

    await client.del('/events/a1', { token: tokenB });

    const listA = await client.get('/events', { token: tokenA });
    assert.equal(listA.json.length, 1, "user B's delete must not have removed user A's event");
  });
});
