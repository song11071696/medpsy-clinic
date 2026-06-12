# FEATURE_STATUS.md - MedPsy Clinic Feature Status

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ Stable | Fully implemented, tested, and production-ready |
| 🔶 Functional | Working but may have known limitations |
| 🔷 Optional | Not required for core functionality |
| ⚠️ Experimental | May change or be removed |

---

## Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| Text consultation (RAG) | ✅ Stable | TF-IDF cosine similarity across 28+ knowledge documents |
| Streaming responses (SSE) | ✅ Stable | Server-Sent Events for progressive delivery |
| WebSocket communication | ✅ Stable | Real-time bidirectional messaging |
| OpenAI-compatible API | ✅ Stable | `/v1/chat/completions` endpoint |
| Rate limiting | ✅ Stable | Per-client tracking with configurable limits |
| Health monitoring | ✅ Stable | `/health` endpoint with system info |
| API documentation | ✅ Stable | OpenAPI 3.0.3 at `/v1/docs` |

## Privacy & Security Features

| Feature | Status | Notes |
|---------|--------|-------|
| AES-256-GCM encryption | ✅ Stable | End-to-end encryption for sensitive data |
| JWT authentication | ✅ Stable | Mandatory `JWT_SECRET` (≥16 chars), no fallback |
| Data masking (PII removal) | ✅ Stable | Logs and analytics automatically mask PII |
| Input validation (XSS/injection) | ✅ Stable | Length, format, and content checks |
| Token revocation | ✅ Stable | Immediate revocation on logout |
| Audio format validation | ✅ Stable | WAV/MP3/FLAC/OGG/WebM, ≤25MB |
| Session timeout (24h) | ✅ Stable | Automatic data cleanup |

## Voice Features

| Feature | Status | Notes |
|---------|--------|-------|
| Speech-to-Text (STT) | 🔶 Functional | Requires QVAC SDK or compatible STT provider |
| Text-to-Speech (TTS) | 🔶 Functional | Requires QVAC SDK or compatible TTS provider |

## AI/ML Features

| Feature | Status | Notes |
|---------|--------|-------|
| QVAC privacy-preserving LLM | 🔷 Optional | Core platform works without QVAC; `@qvac/sdk` listed as optional dependency |
| Crisis keyword detection | ✅ Stable | 4-level assessment (CRITICAL/HIGH/MODERATE/LOW) |
| Crisis hotline referral | ✅ Stable | Auto-displays relevant crisis hotline numbers |
| Auto-escalation to human | ⚠️ Experimental | **Disabled by default** (`autoEscalateToHuman: false`). Must be explicitly enabled. When disabled, crisis alerts are logged but no automatic notification is sent to third parties. |

## Knowledge Base

| Feature | Status | Notes |
|---------|--------|-------|
| 28+ psychology documents | ✅ Stable | CBT, anxiety, depression, sleep, stress, trauma, etc. |
| Document versioning | ✅ Stable | YAML front matter with version/source metadata |
| TF-IDF indexing | ✅ Stable | 5200+ unique terms indexed |
| Source citations | ✅ Stable | API responses include source references |

---

> **Note**: Features marked as 🔷 Optional or ⚠️ Experimental are not required for the core platform to function. See [SECURITY.md](./SECURITY.md) and [PRIVACY.md](./PRIVACY.md) for details on data handling.
