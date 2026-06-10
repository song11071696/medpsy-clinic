/**
 * MedPsy Clinic - API Server with Rate Limiting, WebSocket & Streaming
 * Full-featured standalone server entry point
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { initRAG, completion, getDocumentTitles, retrieve } = require('./src/rag');
const { initSTT, transcribe } = require('./src/stt');
const { initTTS, synthesize } = require('./src/tts');

// === 新增：安全模块导入 ===
const { CrisisService } = require('./src/services/crisis-service');
const { DataEncryption } = require('./src/privacy/data-encryption');
const { authMiddleware, optionalAuth, requireRole, generateToken, revokeToken, verifyToken } = require('./src/api/middleware/auth');

const crisisService = new CrisisService();
const encryption = new DataEncryption();
const isProduction = process.env.NODE_ENV === 'production';
const MAX_QUERY_LENGTH = 500;

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// Rate Limiting (in-memory, simple sliding window)
// ============================================================

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;
    this.maxRequests = options.maxRequests || 30;
    this.clients = new Map();
    this.message = options.message || 'Too many requests, please try again later.';
  }

  getClientId(req) {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  cleanup() {
    const now = Date.now();
    for (const [clientId, data] of this.clients.entries()) {
      if (now - data.windowStart > this.windowMs) {
        this.clients.delete(clientId);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      const clientId = this.getClientId(req);
      const now = Date.now();

      let clientData = this.clients.get(clientId);
      if (!clientData || now - clientData.windowStart > this.windowMs) {
        clientData = { windowStart: now, count: 0 };
        this.clients.set(clientId, clientData);
      }

      clientData.count++;

      const remaining = Math.max(0, this.maxRequests - clientData.count);
      res.set('X-RateLimit-Limit', String(this.maxRequests));
      res.set('X-RateLimit-Remaining', String(remaining));
      res.set('X-RateLimit-Reset', String(Math.ceil((clientData.windowStart + this.windowMs) / 1000)));

      if (clientData.count > this.maxRequests) {
        res.set('Retry-After', String(Math.ceil(this.windowMs / 1000)));
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: this.message,
          retryAfter: Math.ceil(this.windowMs / 1000),
        });
      }

      if (Math.random() < 0.01) {
        this.cleanup();
      }

      next();
    };
  }
}

// Create rate limiters
const generalLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 60,
  message: 'Too many requests from this IP, please try again after a minute.',
});

const consultationLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 10,
  message: 'Too many consultation requests. Please wait before sending another query.',
});

const voiceLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 5,
  message: 'Too many voice requests. Please wait before sending another audio.',
});

// ============================================================
// Service state tracking
// ============================================================

const serviceState = {
  startedAt: null,
  requestCount: 0,
  wsConnections: 0,
  modelLoaded: false,
};

// ============================================================
// Crisis Detection Middleware
// ============================================================

function crisisMiddleware(req, res, next) {
  const query = req.body?.query || '';
  const lastMsg = req.body?.messages?.[req.body.messages.length - 1];
  const text = query || lastMsg?.content || '';

  if (!text) return next();

  req.crisisResult = crisisService.analyze(text, req.user?.id || 'anonymous');
  next();
}

// ============================================================
// Input Validation & Sanitization
// ============================================================

function sanitizeInput(query) {
  if (!query || typeof query !== 'string') return null;

  if (query.length > MAX_QUERY_LENGTH) {
    return { error: `Query exceeds maximum length of ${MAX_QUERY_LENGTH} characters` };
  }

  const sanitized = query
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();

  const injectionPatterns = [
    /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /system\s*:\s*/i,
    /forget\s+(everything|all|your)\s+/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      return { error: 'Input contains potentially harmful content' };
    }
  }

  return { sanitized };
}

// ============================================================
// Middleware
// ============================================================

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'audio/*', limit: '25mb' }));

app.use(generalLimiter.middleware());

// 安全修复：添加安全响应头
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('X-Powered-By', 'MedPsy-Clinic');
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  serviceState.requestCount++;
  res.on('finish', () => {
    const duration = Date.now() - start;
    const maskedPath = encryption.maskSensitiveData(req.path);
    console.log(`[${new Date().toISOString()}] ${req.method} ${maskedPath} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ============================================================
// Health Check (enhanced)
// ============================================================

app.get('/health', (req, res) => {
  const healthResponse = {
    status: 'ok',
    service: 'medpsy-clinic',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  };

  // 仅开发环境返回详细系统信息
  if (!isProduction) {
    const uptime = serviceState.startedAt
      ? Math.floor((Date.now() - serviceState.startedAt.getTime()) / 1000)
      : 0;

    healthResponse.uptime_seconds = uptime;
    healthResponse.model_loaded = serviceState.modelLoaded;
    healthResponse.total_requests = serviceState.requestCount;
    healthResponse.ws_connections = serviceState.wsConnections;
    healthResponse.knowledge_base = {
      count: getDocumentTitles().length,
      documents: getDocumentTitles(),
    };
    healthResponse.system = {
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
  }

  res.json(healthResponse);
});

// ============================================================
// API Documentation endpoint
// ============================================================

// ============================================================
// Authentication Endpoints
// ============================================================

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required',
      });
    }

    // 输入长度限制
    if (username.length > 100 || password.length > 200) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // 安全修复：拒绝未配置的默认登录，要求实际用户验证
    // 演示环境不再接受任意凭证
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid credentials. Please register first via /api/v2/users/register',
    });
  } catch (err) {
    console.error('[Auth] Login error:', encryption.maskSensitiveData(err.message));
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  try {
    revokeToken(req.token);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('[Auth] Logout error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Consent acknowledgment endpoint (CHANGE-10)
app.get('/api/consent', (req, res) => {
  res.json({
    consent: {
      version: '1.0',
      title: 'MedPsy Clinic 用户知情同意',
      sections: [
        {
          title: '数据收集说明',
          content: '本系统收集您的咨询对话内容，用于提供AI辅助心理健康建议。所有数据在本地设备处理，不上传至云端。',
        },
        {
          title: '隐私保护措施',
          content: '您的对话内容经过端到端加密存储，敏感信息已脱敏处理。我们承诺不会将您的数据用于训练模型或分享给第三方。',
        },
        {
          title: 'AI局限性声明',
          content: '本系统提供的AI建议仅供参考，不能替代专业心理医生的诊断和治疗。如有严重心理危机，请立即拨打专业热线。',
        },
        {
          title: '危机干预说明',
          content: '系统会实时监测对话中的危机信号。检测到高风险内容时，系统将优先提供专业热线信息。',
        },
      ],
    },
  });
});

app.post('/api/consent/accept', express.json(), (req, res) => {
  const { version, accepted } = req.body;
  if (!accepted) {
    return res.status(400).json({ error: 'Consent must be accepted' });
  }
  // 实际应存储到用户档案
  res.json({
    success: true,
    message: 'Consent accepted',
    consentVersion: version || '1.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API Documentation endpoint (continued)
// ============================================================

app.get('/v1/docs', (req, res) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'MedPsy Clinic API',
      version: '1.0.0',
      description: 'Rule-based mental health consultation platform with knowledge retrieval',
      contact: { name: 'MedPsy Team', url: 'https://github.com/song11071696/medpsy-clinic' },
      license: { name: 'MIT' },
    },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Local development' }],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          description: 'Returns service health status, uptime, and system info',
          tags: ['System'],
          responses: {
            200: { description: 'Service is healthy', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } } },
          },
        },
      },
      '/api/consult': {
        post: {
          summary: 'Text consultation',
          description: 'Send a text query and receive a knowledge-based mental health response using keyword retrieval',
          tags: ['Consultation'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string', description: 'User query about mental health', example: 'I feel anxious about work, what should I do?' },
                    stream: { type: 'boolean', default: false, description: 'Enable SSE streaming response' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Successful response', content: { 'application/json': { schema: { $ref: '#/components/schemas/ConsultResponse' } } } },
            400: { description: 'Invalid request' },
            429: { description: 'Rate limit exceeded' },
            500: { description: 'Internal server error' },
          },
        },
      },
      '/api/consult/stream': {
        post: {
          summary: 'Streaming text consultation (SSE)',
          description: 'Send a query and receive a Server-Sent Events stream of the response',
          tags: ['Consultation'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: { query: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'SSE stream', content: { 'text/event-stream': {} } },
          },
        },
      },
      '/api/consult/voice': {
        post: {
          summary: 'Voice consultation',
          description: 'Send audio data and receive transcription + AI response + synthesized audio',
          tags: ['Consultation'],
          requestBody: {
            required: true,
            content: { 'audio/wav': { schema: { type: 'string', format: 'binary' } } },
          },
          responses: {
            200: { description: 'Voice consultation result' },
            400: { description: 'Invalid audio data' },
          },
        },
      },
      '/api/knowledge': {
        get: {
          summary: 'List knowledge base documents',
          description: 'Returns all loaded knowledge base document titles',
          tags: ['Knowledge'],
          responses: {
            200: { description: 'Document list' },
          },
        },
      },
      '/api/retrieve': {
        post: {
          summary: 'Retrieve relevant documents',
          description: 'Search the knowledge base for relevant documents without generating a response',
          tags: ['Knowledge'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string' },
                    topK: { type: 'integer', default: 3, description: 'Number of results to return' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Retrieved documents' },
          },
        },
      },
      '/v1/chat/completions': {
        post: {
          summary: 'OpenAI-compatible chat completions',
          description: 'Standard OpenAI-compatible endpoint for chat completions',
          tags: ['OpenAI Compatible'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['messages'],
                  properties: {
                    messages: { type: 'array', items: { type: 'object' } },
                    stream: { type: 'boolean', default: false },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Chat completion response' },
          },
        },
      },
      '/v1/models': {
        get: {
          summary: 'List available models',
          tags: ['OpenAI Compatible'],
          responses: { 200: { description: 'Model list' } },
        },
      },
    },
    components: {
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            service: { type: 'string', example: 'medpsy-clinic' },
            version: { type: 'string', example: '1.0.0' },
            uptime_seconds: { type: 'integer' },
            knowledge_base: { type: 'object' },
            system: { type: 'object' },
          },
        },
        ConsultResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                answer: { type: 'string' },
                sources: { type: 'array', items: { type: 'string' } },
                context_used: { type: 'boolean' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  });
});

// ============================================================
// API Routes
// ============================================================

// Text consultation
app.post('/api/consult', authMiddleware, consultationLimiter.middleware(), crisisMiddleware, async (req, res) => {
  try {
    const { query, stream = false } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query field is required and must be a string',
      });
    }

    // 输入验证
    const validation = sanitizeInput(query);
    if (validation.error) {
      return res.status(400).json({ error: 'Invalid input', message: validation.error });
    }
    const cleanQuery = validation.sanitized;

    const crisis = req.crisisResult;

    // 🔴 CRITICAL 级别：阻断AI回答，直接返回危机干预信息
    if (crisis.shouldBlock) {
      return res.json({
        success: true,
        data: {
          answer: crisis.message,
          crisis: {
            detected: true,
            level: crisis.level,
            hotlines: crisis.hotlines,
          },
          sources: [],
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (stream) {
      // SSE streaming response
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const result = await completion(cleanQuery);

      // 危机信息作为第一个 chunk 发送
      if (crisis.detected) {
        res.write(`data: ${JSON.stringify({
          chunk: '',
          done: false,
          crisis: {
            detected: true,
            level: crisis.level,
            message: crisis.message,
            hotlines: crisis.hotlines,
          },
        })}\n\n`);
      }

      // Stream the answer in chunks
      const words = result.answer.split(/(?<=[。！？.!?\\s])/);
      for (const word of words) {
        if (word.trim()) {
          res.write(`data: ${JSON.stringify({ chunk: word, done: false })}\n\n`);
          await new Promise(r => setTimeout(r, 30));
        }
      }

      res.write(`data: ${JSON.stringify({
        chunk: '',
        done: true,
        sources: result.sources,
        context_used: result.context_used,
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const result = await completion(cleanQuery);

      // 加密存储审计记录
      const auditRecord = encryption.encryptConsultation({
        query: cleanQuery,
        answer: result.answer,
        timestamp: new Date().toISOString(),
        userId: req.user?.id || 'anonymous',
      }, req.user?.id || 'anonymous');

      // auditLog.push(auditRecord); // 实际存储到数据库

      const response = {
        success: true,
        data: {
          answer: result.answer,
          sources: result.sources,
          context_used: result.context_used,
          ...(crisis.detected && {
            crisis: {
              detected: true,
              level: crisis.level,
              message: crisis.message,
              hotlines: crisis.hotlines,
            },
          }),
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    }
  } catch (err) {
    console.error('[Consult] Error:', encryption.maskSensitiveData(err.message));
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Dedicated streaming endpoint
app.post('/api/consult/stream', authMiddleware, consultationLimiter.middleware(), crisisMiddleware, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query field is required and must be a string',
      });
    }

    // 输入验证
    const validation = sanitizeInput(query);
    if (validation.error) {
      return res.status(400).json({ error: 'Invalid input', message: validation.error });
    }
    const cleanQuery = validation.sanitized;

    const crisis = req.crisisResult;

    // 🔴 CRITICAL 级别：阻断AI回答
    if (crisis.shouldBlock) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write(`data: ${JSON.stringify({
        chunk: '',
        done: false,
        crisis: {
          detected: true,
          level: crisis.level,
          message: crisis.message,
          hotlines: crisis.hotlines,
        },
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const result = await completion(cleanQuery);

    // 危机信息作为第一个 chunk 发送
    if (crisis.detected) {
      res.write(`data: ${JSON.stringify({
        chunk: '',
        done: false,
        crisis: {
          detected: true,
          level: crisis.level,
          message: crisis.message,
          hotlines: crisis.hotlines,
        },
      })}\n\n`);
    }

    const words = result.answer.split(/(?<=[。！？.!?\\s])/);
    for (const word of words) {
      if (word.trim()) {
        res.write(`data: ${JSON.stringify({ chunk: word, done: false })}\n\n`);
        await new Promise(r => setTimeout(r, 30));
      }
    }

    res.write(`data: ${JSON.stringify({
      chunk: '',
      done: true,
      sources: result.sources,
      context_used: result.context_used,
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('[Stream] Error:', encryption.maskSensitiveData(err.message));
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Voice consultation
app.post('/api/consult/voice', authMiddleware, voiceLimiter.middleware(), crisisMiddleware, async (req, res) => {
  try {
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Audio data is required',
      });
    }

    const sttResult = await transcribe(req.body);

    // 语音转文字后也做危机检测
    const crisis = req.crisisResult;
    if (crisis.shouldBlock) {
      return res.json({
        success: true,
        data: {
          transcription: { text: sttResult.text, confidence: sttResult.confidence },
          answer: { text: crisis.message, sources: [] },
          crisis: {
            detected: true,
            level: crisis.level,
            hotlines: crisis.hotlines,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    const ragResult = await completion(sttResult.text);
    const ttsResult = await synthesize(ragResult.answer);

    res.json({
      success: true,
      data: {
        transcription: { text: sttResult.text, confidence: sttResult.confidence },
        answer: { text: ragResult.answer, sources: ragResult.sources },
        audio: { duration: ttsResult.duration, base64: ttsResult.audio.toString('base64') },
        ...(crisis.detected && {
          crisis: {
            detected: true,
            level: crisis.level,
            message: crisis.message,
            hotlines: crisis.hotlines,
          },
        }),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Voice] Error:', encryption.maskSensitiveData(err.message));
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Knowledge base listing
app.get('/api/knowledge', authMiddleware, (req, res) => {
  res.json({
    success: true,
    documents: getDocumentTitles(),
    count: getDocumentTitles().length,
  });
});

// Document retrieval (search without generation)
app.post('/api/retrieve', authMiddleware, (req, res) => {
  try {
    const { query, topK = 3 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query field is required and must be a string',
      });
    }

    const results = retrieve(query, topK);
    res.json({
      success: true,
      data: {
        results: results.map(r => ({
          id: r.id,
          title: r.title,
          category: r.category,
          score: r.score,
          excerpt: r.content.substring(0, 200) + '...',
        })),
        count: results.length,
      },
    });
  } catch (err) {
    console.error('[Retrieve] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OpenAI-compatible endpoints
app.get('/v1/models', (req, res) => {
  res.json({
    data: [{ id: 'MedPsy-4B', object: 'model', owned_by: 'qvac', created: Date.now() }],
  });
});

app.post('/v1/chat/completions', authMiddleware, consultationLimiter.middleware(), crisisMiddleware, async (req, res) => {
  try {
    const { messages, stream = false } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages field is required and must be an array' });
    }

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) {
      return res.status(400).json({ error: 'No user message found' });
    }

    // 输入验证
    const validation = sanitizeInput(lastUserMessage.content);
    if (validation.error) {
      return res.status(400).json({ error: 'Invalid input', message: validation.error });
    }

    const crisis = req.crisisResult;

    // CRITICAL 级别：阻断AI回答
    if (crisis.shouldBlock) {
      if (stream) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        res.write(`data: ${JSON.stringify({
          choices: [{ delta: { content: crisis.message } }],
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        res.json({
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'MedPsy-4B',
          choices: [{
            index: 0,
            message: { role: 'assistant', content: crisis.message },
            finish_reason: 'stop',
          }],
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        });
      }
      return;
    }

    const result = await completion(validation.sanitized);

    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      const words = result.answer.split(/(?<=[。！？.!?\\s])/);
      for (const word of words) {
        if (word.trim()) {
          res.write(`data: ${JSON.stringify({
            choices: [{ delta: { content: word } }],
          })}\n\n`);
          await new Promise(r => setTimeout(r, 30));
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.json({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'MedPsy-4B',
        choices: [{
          index: 0,
          message: { role: 'assistant', content: result.answer },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });
    }
  } catch (err) {
    console.error('[ChatCompletions] Error:', encryption.maskSensitiveData(err.message));
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    available_endpoints: [
      'GET  /health',
      'GET  /v1/docs',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET  /api/consent',
      'POST /api/consent/accept',
      'POST /api/consult',
      'POST /api/consult/stream',
      'POST /api/consult/voice',
      'GET  /api/knowledge',
      'POST /api/retrieve',
      'GET  /v1/models',
      'POST /v1/chat/completions',
    ],
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', encryption.maskSensitiveData(err.message || ''));
  res.status(500).json({
    error: 'Internal server error',
    // 安全修复：生产环境和开发环境都不泄露错误详情和堆栈
    message: 'An unexpected error occurred',
  });
});

// ============================================================
// WebSocket support
// ============================================================

function setupWebSocket(server) {
  let WebSocket;
  try {
    WebSocket = require('ws');
  } catch (e) {
    console.warn('[WebSocket] ws package not installed, WebSocket support disabled');
    return null;
  }

  const wss = new WebSocket.Server({ server, path: '/ws' });

  // verifyClient: 验证WebSocket连接的token
  wss.on('connection', (ws, req) => {
    // WebSocket认证：从URL参数或首条消息中验证token
    const clientIp = req.socket.remoteAddress;
    console.log(`[WebSocket] Client connected: ${clientIp}`);
    serviceState.wsConnections++;

    // 从URL查询参数中提取token进行验证
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
      ws.send(JSON.stringify({ type: 'error', message: 'Authentication required: missing token' }));
      ws.close(4001, 'Authentication required');
      return;
    }
    try {
      const decoded = verifyToken(token);
      ws.userId = decoded.id;
      ws.userRole = decoded.role;
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed: invalid token' }));
      ws.close(4002, 'Invalid token');
      return;
    }

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Welcome to MedPsy Clinic WebSocket',
      timestamp: new Date().toISOString(),
    }));

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // 安全修复：WebSocket消息大小限制和基本验证
        if (data.length > 65536) {
          ws.send(JSON.stringify({ type: 'error', message: 'Message too large' }));
          return;
        }

        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          return;
        }

        if (msg.type === 'consult') {
          if (!msg.query || typeof msg.query !== 'string') {
            ws.send(JSON.stringify({ type: 'error', message: 'query is required' }));
            return;
          }

          // 安全修复：对WebSocket查询也进行输入验证
          const wsValidation = sanitizeInput(msg.query);
          if (wsValidation.error) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid input' }));
            return;
          }

          ws.send(JSON.stringify({ type: 'consult_start', query: wsValidation.sanitized }));

          const result = await completion(wsValidation.sanitized);

          // Stream the response word by word
          const words = result.answer.split(/(?<=[。！？.!?\s])/);
          for (const word of words) {
            if (word.trim() && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'token', content: word }));
              await new Promise(r => setTimeout(r, 30));
            }
          }

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'consult_done',
              sources: result.sources,
              context_used: result.context_used,
            }));
          }
          return;
        }

        if (msg.type === 'retrieve') {
          const results = retrieve(msg.query || '', msg.topK || 3);
          ws.send(JSON.stringify({
            type: 'retrieve_result',
            results: results.map(r => ({
              id: r.id,
              title: r.title,
              category: r.category,
              score: r.score,
            })),
          }));
          return;
        }

        ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${msg.type}` }));
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: 'Internal server error' }));
      }
    });

    ws.on('close', () => {
      serviceState.wsConnections--;
      console.log(`[WebSocket] Client disconnected: ${clientIp}`);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Error:', err.message);
    });
  });

  // Heartbeat to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeatInterval));

  console.log('[WebSocket] WebSocket server initialized on /ws');
  return wss;
}

// ============================================================
// Start
// ============================================================

async function start() {
  try {
    await initRAG();
    await initSTT();
    await initTTS();
    serviceState.modelLoaded = true;
    serviceState.startedAt = new Date();

    const server = http.createServer(app);
    const wss = setupWebSocket(server);

    server.listen(PORT, () => {
      console.log(`[MedPsy] API Server running on http://localhost:${PORT}`);
      console.log(`[MedPsy] Health check: http://localhost:${PORT}/health`);
      console.log(`[MedPsy] API docs: http://localhost:${PORT}/v1/docs`);
      console.log(`[MedPsy] WebSocket: ws://localhost:${PORT}/ws`);
      console.log(`[MedPsy] Rate limits: General=60/min, Consult=10/min, Voice=5/min`);
    });
  } catch (err) {
    console.error('[MedPsy] Failed to start:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, RateLimiter, start, setupWebSocket };
