# Code Audit Report: medpsy-clinic
## QVAC Edge AI Hackathon

**Auditor:** Coder Agent  
**Date:** 2026-06-09  
**Project Path:** C:\Users\11071\medpsy-clinic

---

## 1. Test Results

### Before Fixes
| Test Suite | Tests | Passed | Failed |
|------------|-------|--------|--------|
| API v2 Routes | 24 | 24 | 0 |
| RateLimiter | 5 | 5 | 0 |
| API Module exports | 1 | 1 | 0 |
| Integration Tests | 10 | 10 | 0 |
| RAG Module | 13 | 13 | 0 |
| **Total** | **62** | **62** | **0** |

### After Fixes
| Test Suite | Tests | Passed | Failed |
|------------|-------|--------|--------|
| API v2 Routes | 24 | 24 | 0 |
| RateLimiter | 5 | 5 | 0 |
| API Module exports | 1 | 1 | 0 |
| Integration Tests | 10 | 10 | 0 |
| RAG Module | 13 | 13 | 0 |
| **Total** | **62** | **62** | **0** |

✅ All tests pass before and after fixes.

---

## 2. Security Audit

### 2.1 Issues Found & Fixed

#### 🔴 HIGH: Timing Attack on JWT Verification (Fixed)
- **File:** `src/api/middleware/auth.js`
- **Issue:** `verifyToken()` used string comparison (`signature !== expected`) for HMAC verification, which is vulnerable to timing attacks. An attacker could theoretically determine the correct signature byte-by-byte by measuring response times.
- **Fix:** Replaced with `crypto.timingSafeEqual()` for constant-time comparison.
- **Before:**
  ```javascript
  if (signature !== expected) return null;
  ```
- **After:**
  ```javascript
  if (!signature || !expected || signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  ```

#### 🔴 HIGH: Insufficient XSS Sanitization (Fixed)
- **File:** `src/utils/validators.js`
- **Issue:** `sanitize()` function only removed `<>` characters, leaving other XSS vectors open (e.g., `"` and `'` in attribute injection).
- **Fix:** Implemented proper HTML entity encoding for all dangerous characters.
- **Before:**
  ```javascript
  return str.trim().substring(0, maxLength).replace(/[<>]/g, '');
  ```
- **After:**
  ```javascript
  return str.trim().substring(0, maxLength)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  ```

### 2.2 Issues Noted (Not Fixed)

#### 🟡 MEDIUM: Hardcoded JWT Secret Fallback
- **File:** `src/api/middleware/auth.js`
- **Issue:** JWT secret falls back to `'medpsy-dev-secret-key'` when `JWT_SECRET` env var is not set.
- **Recommendation:** Throw an error in production if JWT_SECRET is not configured.

#### 🟡 MEDIUM: In-Memory Session Storage
- **Files:** `src/auth/auth-service.js`, `src/api/middleware/auth.js`
- **Issue:** All sessions and token revocations are stored in-memory. Data is lost on server restart.
- **Recommendation:** Use Redis or database for production deployments.

#### 🟢 LOW: No CSRF Protection
- **File:** `src/api/server.js`
- **Issue:** No CSRF token validation on state-changing endpoints.
- **Recommendation:** Add CSRF protection middleware for production.

### 2.3 Security Features Verified ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Password Hashing | ✅ | PBKDF2 with 100k iterations, SHA-512 |
| Timing-Safe Comparison | ✅ | Used for password and HMAC verification (after fix) |
| Account Lockout | ✅ | 5 failed attempts → 15 min lockout |
| Rate Limiting | ✅ | Sliding window with per-IP tracking |
| Input Validation | ✅ | Email, password strength, username format |
| Security Headers | ✅ | X-Content-Type-Options, X-Frame-Options, HSTS |
| Token Revocation | ✅ | Logout invalidates tokens |
| CORS Configuration | ✅ | Configurable origin whitelist |
| Request Size Limits | ✅ | 10MB JSON, 25MB audio |

---

## 3. Code Quality

### 3.1 Documentation
- ✅ Clear JSDoc comments on all public functions
- ✅ Chinese comments for domain-specific logic (mental health context)
- ✅ Well-structured module organization
- ✅ API documentation endpoint (`/v1/docs`)

### 3.2 Code Style
- ✅ Consistent naming conventions
- ✅ Proper error handling with meaningful messages
- ✅ Clean separation of concerns (auth, AI, RAG, assessment)
- ✅ Modular route structure

### 3.3 Test Coverage
- ✅ API endpoint tests (health, info, users, knowledge, assessments)
- ✅ Authentication flow tests (register, login, profile)
- ✅ Rate limiter unit tests
- ✅ RAG module tests (knowledge loading, retrieval, completion)
- ✅ Integration tests with full request lifecycle

---

## 4. Files Modified

| File | Change |
|------|--------|
| `src/api/middleware/auth.js` | Fixed timing attack vulnerability in JWT verification |
| `src/utils/validators.js` | Improved XSS sanitization with proper HTML entity encoding |

---

## 5. Summary

| Category | Score | Notes |
|----------|-------|-------|
| Security | 7/10 | Fixed timing attack and XSS; hardcoded secret remains |
| Code Quality | 8/10 | Good organization and documentation |
| Test Coverage | 9/10 | Comprehensive test suite for all endpoints |
| Functionality | 9/10 | RAG, auth, assessment all working correctly |
| **Overall** | **8.25/10** | Solid hackathon project; production needs Redis/JWT hardening |
