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

describe('GET /profile', () => {
  test('is empty for a brand-new account (no row yet)', async () => {
    const token = await registerAndLogin('a@example.com');
    const res = await client.get('/profile', { token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, {});
  });

  test('requires authentication', async () => {
    const res = await client.get('/profile');
    assert.equal(res.status, 401);
  });
});

describe('PUT /profile', () => {
  test('creates a profile row, then GET reflects it', async () => {
    const token = await registerAndLogin('a@example.com');
    const payload = {
      name: 'Nathan', sex: 'male', height: '180', heightUnit: 'cm',
      weight: '75', weightUnit: 'kg', targetBedtime: '23:30',
    };
    const put = await client.put('/profile', payload, { token });
    assert.equal(put.status, 200);

    const get = await client.get('/profile', { token });
    assert.equal(get.json.name, 'Nathan');
    assert.equal(get.json.sex, 'male');
    assert.equal(get.json.height, 180);
    assert.equal(get.json.height_unit, 'cm');
    assert.equal(get.json.weight, 75);
    assert.equal(get.json.weight_unit, 'kg');
    assert.equal(get.json.target_bedtime, '23:30');
  });

  test('upserts on a second save rather than erroring', async () => {
    const token = await registerAndLogin('a@example.com');
    await client.put('/profile', { name: 'First', targetBedtime: '22:00' }, { token });
    await client.put('/profile', { name: 'Second', targetBedtime: '23:00' }, { token });

    const get = await client.get('/profile', { token });
    assert.equal(get.json.name, 'Second');
    assert.equal(get.json.target_bedtime, '23:00');
  });

  test('defaults missing fields sensibly (empty strings, 22:00 bedtime)', async () => {
    const token = await registerAndLogin('a@example.com');
    await client.put('/profile', {}, { token });

    const get = await client.get('/profile', { token });
    assert.equal(get.json.name, '');
    assert.equal(get.json.height_unit, 'cm');
    assert.equal(get.json.weight_unit, 'kg');
    assert.equal(get.json.target_bedtime, '22:00');
  });

  test('each user has their own independent profile', async () => {
    const tokenA = await registerAndLogin('a@example.com');
    const tokenB = await registerAndLogin('b@example.com');
    await client.put('/profile', { name: 'Alice', targetBedtime: '21:00' }, { token: tokenA });
    await client.put('/profile', { name: 'Bob', targetBedtime: '23:00' }, { token: tokenB });

    const getA = await client.get('/profile', { token: tokenA });
    const getB = await client.get('/profile', { token: tokenB });
    assert.equal(getA.json.name, 'Alice');
    assert.equal(getB.json.name, 'Bob');
  });

  test('requires authentication', async () => {
    const res = await client.put('/profile', { name: 'Nobody' });
    assert.equal(res.status, 401);
  });
});
