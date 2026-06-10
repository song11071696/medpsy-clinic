/**
 * MedPsy Clinic - Authentication Middleware
 * JWT-based authentication with session validation
 */

const crypto = require('crypto');

// In-memory token store (replace with Redis/DB in production)
const tokenStore = new Map();
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Validate JWT_SECRET is set (fail-fast in production)
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[SECURITY CRITICAL] JWT_SECRET environment variable is NOT set!');
    console.error('[SECURITY CRITICAL] Application cannot start securely without JWT_SECRET.');
    console.error('[SECURITY CRITICAL] Set JWT_SECRET in your .env file (minimum 16 characters).');
    throw new Error('JWT_SECRET environment variable is required. Set it in your .env file before starting the server.');
  }
  if (secret.length < 16) {
    throw new Error('[SECURITY] JWT_SECRET must be at least 16 characters. Current length: ' + secret.length);
  }
  return secret;
}

/**
 * Generate a signed JWT-like token
 */
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS,
  })).toString('base64url');
  const secret = getJwtSecret();
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode a token
 */
function verifyToken(token) {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const secret = getJwtSecret();
    const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    // Use timing-safe comparison to prevent timing attacks
    if (!signature || !expected || signature.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Authentication middleware - validates Bearer token
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Missing Authorization header. Use: Bearer <token>',
    });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Invalid auth format',
      message: 'Expected: Bearer <token>',
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      message: 'Please login again to obtain a new token',
    });
  }

  // Check if token has been revoked
  if (tokenStore.has(`revoked:${token}`)) {
    return res.status(401).json({
      error: 'Token revoked',
      message: 'This token has been revoked. Please login again.',
    });
  }

  req.user = payload;
  req.token = token;
  next();
}

/**
 * Optional auth - attaches user if token present, but doesn't reject
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token) {
      const payload = verifyToken(token);
      if (payload) {
        req.user = payload;
        req.token = token;
      }
    }
  }
  next();
}

/**
 * Role-based access control middleware factory
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Requires one of: ${roles.join(', ')}`,
      });
    }
    next();
  };
}

/**
 * Revoke a token (logout)
 */
function revokeToken(token) {
  tokenStore.set(`revoked:${token}`, Date.now());
  // Clean up expired revoked tokens periodically
  if (tokenStore.size > 10000) {
    const cutoff = Date.now() - TOKEN_EXPIRY_MS;
    for (const [key, ts] of tokenStore) {
      if (key.startsWith('revoked:') && ts < cutoff) tokenStore.delete(key);
    }
  }
}

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRole,
  generateToken,
  verifyToken,
  revokeToken,
};
