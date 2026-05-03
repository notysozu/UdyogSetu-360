const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const supertest = require('supertest');
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
  const request = supertest(app);
  await run(request);
}

async function request(app, path, options = {}) {
  let req = app[options.method ? options.method.toLowerCase() : 'get'](path);

  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      req = req.set(key, value);
    }
  }

  if (options.body !== undefined) {
    const body =
      typeof options.body === 'string' && options.headers?.['content-type']?.includes('application/json')
        ? JSON.parse(options.body)
        : options.body;
    req = req.send(body);
  }

  const response = await req;
  return { response, body: response.body };
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
  await withServer(async (app) => {
    const { response, body } = await request(app, '/health');
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.service, 'gateway');
    assert.ok(body.meta.correlationId);
    assert.ok(body.meta.requestId);
  });
});

test('GET /ready returns readiness envelope', async () => {
  await withServer(async (app) => {
    const { response, body } = await request(app, '/ready');
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.service, 'gateway');
    assert.ok(body.data.dependencies);
  });
});

test('GET /api/v1/openapi.json returns OpenAPI 3.1 document', async () => {
  await withServer(async (app) => {
    const { response, body } = await request(app, '/api/v1/openapi.json');
    assert.equal(response.status, 200);
    assert.equal(body.openapi, '3.1.0');
    assert.equal(body.info.title, 'UdyogSetu 360 API');
  });
});

test('correlation ID is generated when missing', async () => {
  await withServer(async (app) => {
    const { response } = await request(app, '/api/v1/health');
    assert.ok(response.headers['x-correlation-id']);
    assert.ok(response.headers['x-request-id']);
  });
});

test('correlation ID is preserved when provided', async () => {
  await withServer(async (app) => {
    const { response } = await request(app, '/api/v1/health', {
      headers: { 'x-correlation-id': 'demo-correlation-001' }
    });
    assert.equal(response.headers['x-correlation-id'], 'demo-correlation-001');
  });
});

test('validation failures return 400 envelope', async () => {
  installInMemoryIdempotencyStore();

  await withServer(async (app) => {
    const { response, body } = await request(app, '/api/v1/cases', {
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
  await withServer(async (app) => {
    const { response, body } = await request(app, '/api/v1/does-not-exist');
    assert.equal(response.status, 404);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOT_FOUND');
  });
});

test('idempotency key replays matching completed request', async () => {
  installInMemoryIdempotencyStore();

  await withServer(async (app) => {
    const token = createAccessToken();
    const payload = {
      caseType: 'new_industrial_unit',
      title: 'Demo Factory Approval'
    };

    const first = await request(app, '/api/v1/cases', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'idempotency-key': 'demo-key-replay'
      },
      body: JSON.stringify(payload)
    });

    const second = await request(app, '/api/v1/cases', {
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
    assert.equal(second.response.headers['x-idempotency-status'], 'replayed');
    assert.deepEqual(second.body, first.body);
  });
});

test('idempotency conflict returns 409 for changed payload', async () => {
  installInMemoryIdempotencyStore();

  await withServer(async (app) => {
    const token = createAccessToken();

    await request(app, '/api/v1/cases', {
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

    const { response, body } = await request(app, '/api/v1/cases', {
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
    assert.equal(response.headers['x-idempotency-status'], 'conflict');
    assert.equal(body.error.code, 'IDEMPOTENCY_CONFLICT');
  });
});

test('invalid webhook signature is rejected', async () => {
  await withServer(async (app) => {
    const { response, body } = await request(app, '/api/v1/webhooks/n8n/demo-workflow', {
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
  await withServer(async (app) => {
    const response = await app.get('/api/cases').redirects(0);
    assert.equal(response.status, 307);
    assert.equal(response.headers.deprecation, 'true');
    assert.equal(response.headers.link, '</api/v1/cases>; rel="successor-version"');
  });
});
