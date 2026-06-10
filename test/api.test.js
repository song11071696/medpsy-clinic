/**
 * API Endpoint Tests
 * Tests rate limiting, API routes, and middleware
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
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
        this.completion = () => Promise.resolve({ text: 'Mock API response' });
        this.transcribe = () => Promise.resolve({ text: 'Mock transcription', confidence: 0.95, language: 'zh' });
        this.synthesize = () => Promise.resolve({ audio: Buffer.from('mock-audio'), duration: 2.5, sampleRate: 22050 });
      },
    },
  };
}

describe('RateLimiter', () => {
  let RateLimiter;

  before(() => {
    const apiPath = path.resolve(__dirname, '..', 'api-server.js');
    delete require.cache[apiPath];
    const apiServer = require('../api-server');
    RateLimiter = apiServer.RateLimiter;
  });

  describe('constructor', () => {
    it('should create limiter with default options', () => {
      const limiter = new RateLimiter();
      assert.strictEqual(limiter.windowMs, 60000);
      assert.strictEqual(limiter.maxRequests, 30);
    });

    it('should create limiter with custom options', () => {
      const limiter = new RateLimiter({ windowMs: 30000, maxRequests: 5 });
      assert.strictEqual(limiter.windowMs, 30000);
      assert.strictEqual(limiter.maxRequests, 5);
    });
  });

  describe('middleware', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 5 });
      const middleware = limiter.middleware();

      let nextCalled = false;
      const mockReq = { ip: '127.0.0.1', connection: { remoteAddress: '127.0.0.1' } };
      const mockRes = { set: () => {}, status: () => ({ json: () => {} }) };

      middleware(mockReq, mockRes, () => { nextCalled = true; });
      assert.ok(nextCalled, 'Should call next() for allowed request');
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 2 });
      const middleware = limiter.middleware();

      const mockReq = { ip: '192.168.1.1', connection: { remoteAddress: '192.168.1.1' } };

      for (let i = 0; i < 2; i++) {
        let nextCalled = false;
        middleware(mockReq, { set: () => {}, status: () => ({ json: () => {} }) }, () => { nextCalled = true; });
        assert.ok(nextCalled, `Request ${i + 1} should be allowed`);
      }

      let blockedStatus = null;
      let blockedData = null;
      const mockRes = {
        set: () => {},
        status: (code) => {
          blockedStatus = code;
          return { json: (data) => { blockedData = data; } };
        },
      };
      middleware(mockReq, mockRes, () => {});

      assert.strictEqual(blockedStatus, 429, 'Should return 429 status');
      assert.strictEqual(blockedData.error, 'Rate limit exceeded');
    });

    it('should set rate limit headers', () => {
      const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 10 });
      const middleware = limiter.middleware();

      const headers = {};
      const mockReq = { ip: '10.0.0.1', connection: { remoteAddress: '10.0.0.1' } };
      const mockRes = { set: (key, value) => { headers[key] = value; }, status: () => ({ json: () => {} }) };

      middleware(mockReq, mockRes, () => {});

      assert.strictEqual(headers['X-RateLimit-Limit'], '10');
      assert.strictEqual(headers['X-RateLimit-Remaining'], '9');
      assert.ok(headers['X-RateLimit-Reset'], 'Should set reset header');
    });

    it('should isolate different clients', () => {
      const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 1 });
      const middleware = limiter.middleware();

      let next1 = false;
      middleware(
        { ip: '1.1.1.1', connection: { remoteAddress: '1.1.1.1' } },
        { set: () => {}, status: () => ({ json: () => {} }) },
        () => { next1 = true; }
      );
      assert.ok(next1, 'Client 1 first request allowed');

      let next2 = false;
      middleware(
        { ip: '2.2.2.2', connection: { remoteAddress: '2.2.2.2' } },
        { set: () => {}, status: () => ({ json: () => {} }) },
        () => { next2 = true; }
      );
      assert.ok(next2, 'Client 2 allowed (different client)');
    });
  });
});

describe('API Module exports', () => {
  it('should export app and RateLimiter from api-server', () => {
    const apiPath = path.resolve(__dirname, '..', 'api-server.js');
    const mod = require.cache[apiPath]?.exports || require('../api-server');
    assert.ok(mod.app, 'Should export app');
    assert.ok(mod.RateLimiter, 'Should export RateLimiter');
  });
});
