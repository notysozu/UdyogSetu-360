const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const { getGatewayConfig } = require('../src/config/gateway.config');
const { IdempotencyRecord } = require('../src/services/idempotency.service');

const config = getGatewayConfig();
const originalIdempotencyMethods = {
  create: IdempotencyRecord.create,
  findOne: IdempotencyRecord.findOne,
  findByIdAndUpdate: IdempotencyRecord.findByIdAndUpdate
};

function createAccessToken(overrides = {}) {
  return jwt.sign(
    {
      sub: 'user-1',
      email: 'investor@udyogsetu.local',
      roles: ['investor'],
      primaryRole: 'investor',
      permissions: ['case.create', 'case.read_own'],
      tokenType: 'access',
      ...overrides
    },
    config.jwtSecret,
    {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      expiresIn: '15m'
    }
  );
}

async function withServer(run) {
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch (_error) {
    body = text;
  }

  return { response, body };
}

function installInMemoryIdempotencyStore() {
  const records = new Map();

  IdempotencyRecord.create = async function create(record) {
    const compositeKey = `${record.key}:${record.method}:${record.route}:${record.actorId}`;
    if (records.has(compositeKey)) {
      const error = new Error('duplicate key');
      error.code = 11000;
      throw error;
    }

    const created = {
      _id: `${records.size + 1}`,
      ...record
    };
    records.set(compositeKey, created);
    return created;
  };

  IdempotencyRecord.findOne = async function findOne(query) {
    return records.get(`${query.key}:${query.method}:${query.route}:${query.actorId}`) || null;
  };

  IdempotencyRecord.findByIdAndUpdate = async function findByIdAndUpdate(id, update) {
    const existing = [...records.values()].find((record) => record._id === id);
    if (!existing) return null;

    Object.assign(existing, update.$set || {});
    return existing;
  };
}

function restoreIdempotencyStore() {
  IdempotencyRecord.create = originalIdempotencyMethods.create;
  IdempotencyRecord.findOne = originalIdempotencyMethods.findOne;
  IdempotencyRecord.findByIdAndUpdate = originalIdempotencyMethods.findByIdAndUpdate;
}

test.afterEach(() => {
  restoreIdempotencyStore();
});

test('GET /health returns gateway envelope', async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/health');
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.service, 'gateway');
    assert.ok(body.meta.correlationId);
    assert.ok(body.meta.requestId);
  });
});

test('GET /ready returns readiness envelope', async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/ready');
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.service, 'gateway');
    assert.ok(body.data.dependencies);
  });
});

test('GET /api/v1/openapi.json returns OpenAPI 3.1 document', async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/api/v1/openapi.json');
    assert.equal(response.status, 200);
    assert.equal(body.openapi, '3.1.0');
    assert.equal(body.info.title, 'UdyogSetu 360 API');
  });
});

test('correlation ID is generated when missing', async () => {
  await withServer(async (baseUrl) => {
    const { response } = await request(baseUrl, '/api/v1/health');
    assert.ok(response.headers.get('x-correlation-id'));
    assert.ok(response.headers.get('x-request-id'));
  });
});

test('correlation ID is preserved when provided', async () => {
  await withServer(async (baseUrl) => {
    const { response } = await request(baseUrl, '/api/v1/health', {
      headers: { 'x-correlation-id': 'demo-correlation-001' }
    });
    assert.equal(response.headers.get('x-correlation-id'), 'demo-correlation-001');
  });
});

test('validation failures return 400 envelope', async () => {
  installInMemoryIdempotencyStore();

  await withServer(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/api/v1/cases', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${createAccessToken()}`,
        'content-type': 'application/json',
        'idempotency-key': 'demo-key-validation'
      },
      body: JSON.stringify({ caseType: 'new_industrial_unit' })
    });

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'VALIDATION_ERROR');
  });
});

test('unknown API route returns 404 envelope', async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/api/v1/does-not-exist');
    assert.equal(response.status, 404);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOT_FOUND');
  });
});

test('idempotency key replays matching completed request', async () => {
  installInMemoryIdempotencyStore();

  await withServer(async (baseUrl) => {
    const token = createAccessToken();
    const payload = {
      caseType: 'new_industrial_unit',
      title: 'Demo Factory Approval'
    };

    const first = await request(baseUrl, '/api/v1/cases', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'idempotency-key': 'demo-key-replay'
      },
      body: JSON.stringify(payload)
    });

    const second = await request(baseUrl, '/api/v1/cases', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'idempotency-key': 'demo-key-replay'
      },
      body: JSON.stringify(payload)
    });

    assert.equal(first.response.status, 201);
    assert.equal(second.response.status, 201);
    assert.equal(second.response.headers.get('x-idempotency-status'), 'replayed');
    assert.deepEqual(second.body, first.body);
  });
});

test('idempotency conflict returns 409 for changed payload', async () => {
  installInMemoryIdempotencyStore();

  await withServer(async (baseUrl) => {
    const token = createAccessToken();

    await request(baseUrl, '/api/v1/cases', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'idempotency-key': 'demo-key-conflict'
      },
      body: JSON.stringify({
        caseType: 'new_industrial_unit',
        title: 'Original Payload'
      })
    });

    const { response, body } = await request(baseUrl, '/api/v1/cases', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'idempotency-key': 'demo-key-conflict'
      },
      body: JSON.stringify({
        caseType: 'new_industrial_unit',
        title: 'Changed Payload'
      })
    });

    assert.equal(response.status, 409);
    assert.equal(response.headers.get('x-idempotency-status'), 'conflict');
    assert.equal(body.error.code, 'IDEMPOTENCY_CONFLICT');
  });
});

test('invalid webhook signature is rejected', async () => {
  await withServer(async (baseUrl) => {
    const { response, body } = await request(baseUrl, '/api/v1/webhooks/n8n/demo-workflow', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-us360-signature': 'invalid-signature',
        'x-us360-timestamp': `${Math.floor(Date.now() / 1000)}`,
        'x-us360-webhook-id': 'demo-webhook-001'
      },
      body: JSON.stringify({ ping: true })
    });

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'WEBHOOK_SIGNATURE_INVALID');
  });
});

test('legacy API aliases redirect to versioned routes with deprecation headers', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/cases`, { redirect: 'manual' });
    assert.equal(response.status, 307);
    assert.equal(response.headers.get('deprecation'), 'true');
    assert.equal(response.headers.get('link'), '</api/v1/cases>; rel="successor-version"');
  });
});
