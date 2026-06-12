# SECURITY.md - MedPsy Clinic Security Policy

## Security Architecture

MedPsy Clinic implements defense-in-depth security for a mental health consultation platform:

### Authentication & Authorization
- **JWT-based authentication** with HMAC-SHA256 signing
- `JWT_SECRET` environment variable is **mandatory** (≥16 characters) — server refuses to start without it
- No fallback or default secrets are provided
- Token revocation supported on user logout
- Timing-safe comparison for token verification

### Encryption
- **AES-256-GCM** encryption for sensitive consultation data (query, answer, diagnosis, notes)
- PBKDF2 key derivation (100,000 iterations, SHA-512) with per-user salt
- Key cache with 1-hour expiration to limit memory exposure
- Encryption keys derived from `ENCRYPTION_MASTER_KEY` environment variable

### Input Validation
- XSS and injection detection on all user inputs
- Length limits and format validation
- Audio file validation: WAV/MP3/FLAC/OGG/WebM formats, ≤25MB, header integrity checks
- Request body size limits

### Rate Limiting
| Endpoint | Limit | Window |
|----------|-------|--------|
| General | 60 requests | 1 minute |
| Consultation | 10 requests | 1 minute |
| Voice | 5 requests | 1 minute |

### Data Minimization
- PII (names, phone numbers, email addresses) automatically masked in logs and analytics
- Session timeout: 24 hours by default
- Expired data automatically cleaned

---

## Reporting a Vulnerability

If you discover a security vulnerability in MedPsy Clinic, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities
2. Email the maintainers directly (see project repository for contact information)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if available)

We will acknowledge receipt within 72 hours and aim to provide a fix or mitigation plan within 30 days.

---

## Known Limitations

- This is a **research/educational platform**, not a certified medical device
- QVAC SDK integration is optional; when not used, LLM inference may involve external API calls — review your deployment configuration
- Crisis detection is keyword-based and may produce false positives or false negatives
- The platform does not replace professional clinical assessment

---

## Environment Variables (Security-Relevant)

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **Yes** | JWT signing secret, ≥16 characters. No default. |
| `ENCRYPTION_MASTER_KEY` | Recommended | Master key for AES-256-GCM data encryption |
| `NODE_ENV` | Recommended | Set to `production` for production deployments |
| `CORS_ORIGINS` | No | Comma-separated allowed CORS origins |

---

## Deployment Security Checklist

- [ ] Set a strong `JWT_SECRET` (≥16 random characters)
- [ ] Set `ENCRYPTION_MASTER_KEY` for data encryption
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGINS` to restrict allowed origins
- [ ] Use HTTPS in production (reverse proxy with TLS)
- [ ] Enable health check endpoint monitoring
- [ ] Review rate limit settings for your use case
- [ ] Ensure `autoEscalateToHuman` is explicitly configured if crisis escalation is needed
