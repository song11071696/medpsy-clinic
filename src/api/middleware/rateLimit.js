/**
 * MedPsy Clinic - Rate Limiting Middleware
 * Token-bucket rate limiter with per-IP and per-user tracking
 */

const WINDOW_DEFAULT = 60000;   // 1 minute
const MAX_REQUESTS_DEFAULT = 100;

// Store buckets in memory (use Redis for distributed deployments)
const buckets = new Map();

/**
 * Clean up expired buckets periodically
 */
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function cleanupBuckets(windowMs) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs * 2;
  for (const [key, bucket] of buckets) {
    if (bucket.lastAccess < cutoff) buckets.delete(key);
  }
}

/**
 * Get or create a rate limit bucket for a key
 */
function getBucket(key, windowMs, maxRequests) {
  if (!buckets.has(key)) {
    buckets.set(key, {
      tokens: maxRequests,
      maxTokens: maxRequests,
      lastRefill: Date.now(),
      lastAccess: Date.now(),
      windowMs,
    });
  }
  const bucket = buckets.get(key);
  bucket.lastAccess = Date.now();

  // Refill tokens based on elapsed time
  const elapsed = Date.now() - bucket.lastRefill;
  const refillRate = maxRequests / windowMs;
  const tokensToAdd = elapsed * refillRate;
  bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = Date.now();

  return bucket;
}

/**
 * Create a rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Max requests per window
 * @param {Function} options.keyGenerator - Custom key function (req) => string
 * @param {string} options.message - Custom error message
 */
function rateLimiter(options = {}) {
  const {
    windowMs = WINDOW_DEFAULT,
    maxRequests = MAX_REQUESTS_DEFAULT,
    keyGenerator = null,
    message = 'Too many requests. Please try again later.',
  } = options;

  return (req, res, next) => {
    // Generate bucket key
    const key = keyGenerator
      ? keyGenerator(req)
      : req.user?.id
        ? `user:${req.user.id}`
        : `ip:${req.ip || req.connection?.remoteAddress || 'unknown'}`;

    const bucket = getBucket(key, windowMs, maxRequests);

    // Set rate limit headers
    const remaining = Math.floor(bucket.tokens);
    const resetMs = Math.ceil(windowMs - (Date.now() - bucket.lastRefill));
    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));
    res.set('X-RateLimit-Reset', String(Math.ceil(resetMs / 1000)));

    if (bucket.tokens < 1) {
      res.set('Retry-After', String(Math.ceil(resetMs / 1000)));
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil(resetMs / 1000),
      });
    }

    bucket.tokens -= 1;
    cleanupBuckets(windowMs);
    next();
  };
}

/**
 * Strict rate limiter for sensitive endpoints (login, register)
 */
const strictLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many attempts. Please wait 15 minutes.',
});

/**
 * API rate limiter for general endpoints
 */
const apiLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
});

/**
 * Stream rate limiter for SSE/streaming endpoints
 */
const streamLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Too many streaming requests.',
});

/**
 * Get current stats (for monitoring)
 */
function getStats() {
  return {
    activeBuckets: buckets.size,
    memoryEstimateKB: Math.round(JSON.stringify([...buckets]).length / 1024),
  };
}

module.exports = {
  rateLimiter,
  strictLimiter,
  apiLimiter,
  streamLimiter,
  getStats,
};
