/**
 * MedPsy Clinic - Logger Middleware
 * Request/response logging with structured output
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] || 1;

/**
 * Format timestamp for log entries
 */
function timestamp() {
  return new Date().toISOString();
}

/**
 * Request logger middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    if (LOG_LEVELS[level] >= currentLevel) {
      const entry = {
        time: timestamp(),
        level,
        method,
        url,
        status: res.statusCode,
        duration_ms: duration,
        request_id: req.requestId || '-',
        ip: req.ip || req.connection?.remoteAddress || '-',
        user_id: req.user?.id || 'anonymous',
      };
      if (level === 'warn') {
        console.warn(`[${entry.time}] WARN ${method} ${url} ${res.statusCode} ${duration}ms`);
      } else {
        console.log(`[${entry.time}] ${method} ${url} ${res.statusCode} ${duration}ms`);
      }
    }
  });

  next();
}

/**
 * Error logger middleware
 */
function errorLogger(err, req, res, next) {
  const entry = {
    time: timestamp(),
    level: 'error',
    method: req.method,
    url: req.url,
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    request_id: req.requestId || '-',
  };
  console.error(`[${entry.time}] ERROR ${req.method} ${req.url}: ${err.message}`);
  next(err);
}

/**
 * Application logger utility
 */
const logger = {
  debug: (...args) => { if (currentLevel <= 0) console.log(`[${timestamp()}] DEBUG`, ...args); },
  info: (...args) => { if (currentLevel <= 1) console.log(`[${timestamp()}] INFO`, ...args); },
  warn: (...args) => { if (currentLevel <= 2) console.warn(`[${timestamp()}] WARN`, ...args); },
  error: (...args) => { console.error(`[${timestamp()}] ERROR`, ...args); },
};

module.exports = { requestLogger, errorLogger, logger };
