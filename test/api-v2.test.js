/**
 * API v2 Route Tests
 * Tests the modular Express server endpoints
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const Module = require('module');
const path = require('path');

// Intercept require for @qvac/sdk
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === '@qvac/sdk') return '@qvac/sdk:mock';
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

if (!require.cache['@qvac/sdk:mock']) {
  require.cache['@qvac/sdk:mock'] = {
    id: '@qvac/sdk:mock',
    filename: '@qvac/sdk:mock',
    loaded: true,
    exports: {
      QVAC: function() {
        this.completion = (opts) => Promise.resolve({ text: 'Mock AI response for: ' + (opts.messages?.[0]?.content || '') });
        this.transcribe = () => Promise.resolve({ text: 'Mock transcription', confidence: 0.95, language: 'zh' });
        this.synthesize = () => Promise.resolve({ audio: Buffer.from('mock-audio'), duration: 2.5, sampleRate: 22050 });
      },
    },
  };
}

function httpRequest(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

describe('API v2 Routes', () => {
  let server;
  let baseUrl;
  const TEST_PORT = 13580;

  before(async () => {
    // Clear module caches for server
    const serverPath = path.resolve(__dirname, '..', 'src', 'api', 'server.js');
    Object.keys(require.cache).forEach(key => {
      if (key.includes('medpsy-clinic')) delete require.cache[key];
    });
    // Re-inject mock
    require.cache['@qvac/sdk:mock'] = {
      id: '@qvac/sdk:mock',
      filename: '@qvac/sdk:mock',
      loaded: true,
      exports: {
        QVAC: function() {
          this.completion = (opts) => Promise.resolve({ text: 'Mock AI response' });
        },
      },
    };

    const { app } = require('../src/api/server');
    return new Promise((resolve) => {
      server = app.listen(TEST_PORT, () => {
        baseUrl = `http://localhost:${TEST_PORT}`;
        resolve();
      });
    });
  });

  after((done) => {
    if (server) server.close(done);
    else done();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await httpRequest('GET', `${baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.service, 'medpsy-clinic-api');
      assert.ok(res.body.version);
      assert.ok(res.body.timestamp);
      assert.ok(res.body.system);
    });
  });

  describe('GET /api/v2/info', () => {
    it('should return API info with endpoints', async () => {
      const res = await httpRequest('GET', `${baseUrl}/api/v2/info`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.name, 'MedPsy Clinic API');
      assert.ok(res.body.endpoints.chat);
      assert.ok(res.body.endpoints.knowledge);
      assert.ok(res.body.endpoints.assessments);
      assert.ok(res.body.endpoints.users);
    });
  });

  describe('POST /api/v2/users/register', () => {
    it('should register a new user', async () => {
      const res = await httpRequest('POST', `${baseUrl}/api/v2/users/register`, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'securePassword123',
      });
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.username, 'testuser');
      assert.strictEqual(res.body.user.email, 'test@example.com');
      assert.ok(!res.body.user.passwordHash, 'Should not expose password hash');
    });

    it('should reject duplicate email', async () => {
      await httpRequest('POST', `${baseUrl}/api/v2/users/register`, {
        username: 'user1', email: 'dup@example.com', password: 'password123',
      });
      const res = await httpRequest('POST', `${baseUrl}/api/v2/users/register`, {
        username: 'user2', email: 'dup@example.com', password: 'password456',
      });
      assert.strictEqual(res.status, 409);
    });

    it('should reject short password', async () => {
      const res = await httpRequest('POST', `${baseUrl}/api/v2/users/register`, {
        username: 'shortpw', email: 'short@example.com', password: '123',
      });
      assert.strictEqual(res.status, 400);
    });

    it('should reject missing fields', async () => {
      const res = await httpRequest('POST', `${baseUrl}/api/v2/users/register`, {
        username: 'incomplete',
      });
      assert.strictEqual(res.status, 400);
    });
  });

  describe('POST /api/v2/users/login', () => {
    it('should login with valid credentials', async () => {
      // Register first
      await httpRequest('POST', `${baseUrl}/api/v2/users/register`, {
        username: 'logintest', email: 'login@example.com', password: 'myPassword123',
      });
      const res = await httpRequest('POST', `${baseUrl}/api/v2/users/login`, {
        email: 'login@example.com', password: 'myPassword123',
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.message, 'Login successful');
    });

    it('should reject wrong password', async () => {
      await httpRequest('POST', `${baseUrl}/api/v2/users/register`, {
        username: 'wrongpw', email: 'wrongpw@example.com', password: 'correctPassword',
      });
      const res = await httpRequest('POST', `${baseUrl}/api/v2/users/login`, {
        email: 'wrongpw@example.com', password: 'wrongPassword',
      });
      assert.strictEqual(res.status, 401);
    });

    it('should reject non-existent user', async () => {
      const res = await httpRequest('POST', `${baseUrl}/api/v2/users/login`, {
        email: 'nobody@example.com', password: 'whatever',
      });
      assert.strictEqual(res.status, 401);
    });
  });

  describe('User profile with auth', () => {
    it('should get profile with valid token', async () => {
      const regRes = await httpRequest('POST', `${baseUrl}/api/v2/users/register`, {
        username: 'profileuser', email: 'profile@example.com', password: 'profilePass123',
      });
      const token = regRes.body.token;
      const res = await httpRequest('GET', `${baseUrl}/api/v2/users/profile`, null, {
        Authorization: `Bearer ${token}`,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.username, 'profileuser');
      assert.ok(!res.body.passwordHash);
    });

    it('should reject unauthenticated profile access', async () => {
      const res = await httpRequest('GET', `${baseUrl}/api/v2/users/profile`);
      assert.strictEqual(res.status, 401);
    });

    it('should update profile', async () => {
      const regRes = await httpRequest('POST', `${baseUrl}/api/v2/users/register`, {
        username: 'upduser', email: 'upd@example.com', password: 'updatePass123',
      });
      const token = regRes.body.token;
      const res = await httpRequest('PUT', `${baseUrl}/api/v2/users/profile`, {
        displayName: 'Updated Name',
        bio: 'New bio',
      }, {
        Authorization: `Bearer ${token}`,
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.profile.displayName, 'Updated Name');
      assert.strictEqual(res.body.profile.bio, 'New bio');
    });
  });

  describe('GET /api/v2/knowledge/list', () => {
    it('should return knowledge documents', async () => {
      const res = await httpRequest('GET', `${baseUrl}/api/v2/knowledge/list`);
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.documents));
      assert.ok(res.body.total > 0);
    });

    it('should filter by category', async () => {
      const res = await httpRequest('GET', `${baseUrl}/api/v2/knowledge/list?category=anxiety`);
      assert.strictEqual(res.status, 200);
      res.body.documents.forEach(doc => {
        assert.strictEqual(doc.category, 'anxiety');
      });
    });
  });

  describe('GET /api/v2/knowledge/search', () => {
    it('should search knowledge base', async () => {
      const res = await httpRequest('GET', `${baseUrl}/api/v2/knowledge/search?q=焦虑`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.resultCount > 0);
    });

    it('should require search query', async () => {
      const res = await httpRequest('GET', `${baseUrl}/api/v2/knowledge/search`);
      assert.strictEqual(res.status, 400);
    });
  });

  describe('GET /api/v2/knowledge/document/:id', () => {
    it('should return specific document', async () => {
      const res = await httpRequest('GET', `${baseUrl}/api/v2/knowledge/document/kb-001`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.id, 'kb-001');
      assert.ok(res.body.content);
    });

    it('should return 404 for unknown document', async () => {
      const res = await httpRequest('GET', `${baseUrl}/api/v2/knowledge/document/kb-999`);
      assert.strictEqual(res.status, 404);
    });
  });

  describe('GET /api/v2/knowledge/categories', () => {
    it('should list categories', async () => {
      const res = await httpRequest('GET', `${baseUrl}/api/v2/knowledge/categories`);
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.categories));
    });
  });

  describe('POST /api/v2/assessments/create', () => {
    it('should create PHQ-9 assessment', async () => {
      // Need auth token for assessment routes
      const regRes = await httpRequest('POST', `${baseUrl}/api/v2/users/register`, {
        username: 'asmuser', email: 'asm@example.com', password: 'asmPass123',
      });
      const token = regRes.body.token;
      const res = await httpRequest('POST', `${baseUrl}/api/v2/assessments/create`, {
        templateId: 'phq-9',
      }, {
        Authorization: `Bearer ${token}`,
      });
      assert.strictEqual(res.status, 201);
      assert.ok(res.body.assessmentId);
      assert.strictEqual(res.body.status, 'in_progress');
    });

    it('should reject invalid template', async () => {
      const regRes = await httpRequest('POST', `${baseUrl}/api/v2/users/register`, {
        username: 'asmuser2', email: 'asm2@example.com', password: 'asmPass456',
      });
      const token = regRes.body.token;
      const res = await httpRequest('POST', `${baseUrl}/api/v2/assessments/create`, {
        templateId: 'nonexistent',
      }, {
        Authorization: `Bearer ${token}`,
      });
      assert.strictEqual(res.status, 400);
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await httpRequest('GET', `${baseUrl}/nonexistent`);
      assert.strictEqual(res.status, 404);
      assert.ok(res.body.error);
    });
  });
});
