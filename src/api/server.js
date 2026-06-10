/**
 * MedPsy Clinic - API Server
 * Modular Express server with structured routing
 */

const express = require('express');
const cors = require('cors');
const http = require('http');

const chatRoutes = require('./routes/chat');
const knowledgeRoutes = require('./routes/knowledge');
const assessmentRoutes = require('./routes/assessment');
const userRoutes = require('./routes/user');
const { authMiddleware } = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rateLimit');
const { requestLogger, errorLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.API_PORT || 3001;

// ============================================================
// Core Middleware
// ============================================================

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Global rate limiting
app.use(rateLimiter({ windowMs: 60000, maxRequests: 100 }));

// Security headers
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('X-Powered-By', 'MedPsy-Clinic');
  next();
});

// Request ID
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.set('X-Request-ID', req.requestId);
  next();
});

// ============================================================
// Health Check
// ============================================================

const serviceState = {
  startedAt: new Date(),
  requestCount: 0,
  errorCount: 0,
};

app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - serviceState.startedAt.getTime()) / 1000);
  res.json({
    status: 'ok',
    service: 'medpsy-clinic-api',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: uptime,
    request_count: serviceState.requestCount,
    error_count: serviceState.errorCount,
    system: {
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      pid: process.pid,
    },
  });
});

// ============================================================
// API Routes (12+ endpoints)
// ============================================================

// Chat routes
app.use('/api/v2/chat', authMiddleware, chatRoutes);

// Knowledge routes
app.use('/api/v2/knowledge', knowledgeRoutes);

// Assessment routes
app.use('/api/v2/assessments', authMiddleware, assessmentRoutes);

// User routes
app.use('/api/v2/users', userRoutes);

// API info
app.get('/api/v2/info', (req, res) => {
  res.json({
    name: 'MedPsy Clinic API',
    version: '2.0.0',
    description: 'AI-assisted mental health consultation platform',
    endpoints: {
      chat: [
        'POST /api/v2/chat/send',
        'POST /api/v2/chat/stream',
        'GET  /api/v2/chat/history/:sessionId',
        'DELETE /api/v2/chat/session/:sessionId',
      ],
      knowledge: [
        'GET  /api/v2/knowledge/list',
        'GET  /api/v2/knowledge/search',
        'GET  /api/v2/knowledge/document/:id',
      ],
      assessments: [
        'POST /api/v2/assessments/create',
        'GET  /api/v2/assessments/:id',
        'POST /api/v2/assessments/:id/submit',
        'GET  /api/v2/assessments/history',
      ],
      users: [
        'POST /api/v2/users/register',
        'POST /api/v2/users/login',
        'GET  /api/v2/users/profile',
        'PUT  /api/v2/users/profile',
      ],
    },
    total_endpoints: 15,
  });
});

// ============================================================
// Error Handling
// ============================================================

app.use(errorLogger);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.requestId,
  });
});

app.use((err, req, res, next) => {
  serviceState.errorCount++;
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.requestId,
  });
});

// ============================================================
// Server Start
// ============================================================

function startServer(port = PORT) {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(port, () => {
      console.log(`[MedPsy API] Server running on http://localhost:${port}`);
      console.log(`[MedPsy API] Health: http://localhost:${port}/health`);
      console.log(`[MedPsy API] Info: http://localhost:${port}/api/v2/info`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, serviceState };
