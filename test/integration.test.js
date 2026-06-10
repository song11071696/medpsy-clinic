/**
 * Integration Tests
 * Tests the full API server with HTTP requests
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const Module = require('module');
const path = require('path');

// Intercept require for @qvac/sdk
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === '@qvac/sdk') {
    return '@qvac/sdk:mock';
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

if (!require.cache['@qvac/sdk:mock']) {
  require.cache['@qvac/sdk:mock'] = {
    id: '@qvac/sdk:mock',
    filename: '@qvac/sdk:mock',
    loaded: true,
    exports: {
      QVAC: function() {
        this.completion = () => Promise.resolve({ text: 'Integration test mock response' });
        this.transcribe = () => Promise.resolve({ text: 'Mock transcription', confidence: 0.95, language: 'zh' });
        this.synthesize = () => Promise.resolve({ audio: Buffer.from('mock-audio'), duration: 2.5, sampleRate: 22050 });
      },
    },
  };
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    }).on('error', reject);
  });
}

function httpPost(url, body, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = typeof body === 'string' ? body : JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(postData),
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
    req.write(postData);
    req.end();
  });
}

describe('Integration Tests', () => {
  let server;
  let baseUrl;
  const TEST_PORT = 13579;

  before(async () => {
    // Clear module caches
    const apiPath = path.resolve(__dirname, '..', 'api-server.js');
    delete require.cache[apiPath];
    delete require.cache[path.resolve(__dirname, '..', 'src', 'rag.js')];
    delete require.cache[path.resolve(__dirname, '..', 'src', 'stt.js')];
    delete require.cache[path.resolve(__dirname, '..', 'src', 'tts.js')];

    const { app } = require('../api-server');

    // Initialize RAG (calls loadKnowledgeBase + creates QVAC client)
    const rag = require('../src/rag');
    await rag.initRAG();

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
      const res = await httpGet(`${baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.service, 'medpsy-clinic');
    });

    it('should include knowledge base info', async () => {
      const res = await httpGet(`${baseUrl}/health`);
      assert.ok(res.body.knowledge_base, 'Should have knowledge_base');
      assert.ok(Array.isArray(res.body.knowledge_base.documents), 'Should have documents array');
      assert.ok(res.body.knowledge_base.count > 0, 'Should have loaded documents');
    });

    it('should include timestamp', async () => {
      const res = await httpGet(`${baseUrl}/health`);
      assert.ok(res.body.timestamp, 'Should have timestamp');
    });
  });

  describe('GET /api/knowledge', () => {
    it('should return document list', async () => {
      const res = await httpGet(`${baseUrl}/api/knowledge`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.documents), 'Should have documents array');
      assert.ok(res.body.count > 0, 'Should have document count');
    });
  });

  describe('POST /api/consult', () => {
    it('should return consultation response', async () => {
      const res = await httpPost(`${baseUrl}/api/consult`, { query: '我感到焦虑' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.answer, 'Should have answer');
      assert.ok(Array.isArray(res.body.data.sources), 'Should have sources');
      assert.ok(typeof res.body.data.context_used === 'boolean', 'Should have context_used');
    });

    it('should reject empty query', async () => {
      const res = await httpPost(`${baseUrl}/api/consult`, {});
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.error, 'Should return error');
    });

    it('should reject non-string query', async () => {
      const res = await httpPost(`${baseUrl}/api/consult`, { query: 123 });
      assert.strictEqual(res.status, 400);
    });
  });

  describe('POST /api/retrieve', () => {
    it('should return retrieval results', async () => {
      const res = await httpPost(`${baseUrl}/api/retrieve`, { query: '焦虑', topK: 2 });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.results), 'Should have results array');
      assert.ok(res.body.data.count > 0, 'Should have results count');
    });

    it('should respect topK parameter', async () => {
      const res = await httpPost(`${baseUrl}/api/retrieve`, { query: '心理健康', topK: 1 });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.data.results.length <= 1, 'Should respect topK limit');
    });
  });

  describe('GET /v1/models', () => {
    it('should return model list', async () => {
      const res = await httpGet(`${baseUrl}/v1/models`);
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.data), 'Should have data array');
      assert.strictEqual(res.body.data[0].id, 'MedPsy-4B');
    });
  });

  describe('GET /v1/docs', () => {
    it('should return API documentation', async () => {
      const res = await httpGet(`${baseUrl}/v1/docs`);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.openapi, '3.0.3');
      assert.ok(res.body.info.title, 'Should have title');
      assert.ok(res.body.paths, 'Should have paths');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await httpGet(`${baseUrl}/nonexistent`);
      assert.strictEqual(res.status, 404);
      assert.ok(res.body.error, 'Should return error');
      assert.ok(Array.isArray(res.body.available_endpoints), 'Should list available endpoints');
    });
  });
});
