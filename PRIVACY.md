# PRIVACY.md - MedPsy Clinic Privacy Policy

## Overview

MedPsy Clinic is a mental health consultation platform that prioritizes user privacy. This document describes how data is handled, stored, and protected.

## Data Collection

### What We Process
- **Consultation queries**: Text or voice input from users seeking mental health information
- **Session metadata**: Timestamps, session IDs, request logs
- **Crisis detection logs**: When crisis keywords are detected, the event (level, timestamp, keywords) may be logged for safety purposes

### What We Do NOT Collect
- Real names or personal identifiers (unless voluntarily provided in conversation)
- Persistent user profiles across sessions (by default)
- Third-party tracking cookies or analytics

## Data Protection Measures

### Encryption
- Sensitive consultation fields (query, answer, diagnosis, notes) are encrypted with **AES-256-GCM**
- Per-user key derivation using PBKDF2 (100,000 iterations, SHA-512)
- Encryption keys are cached with a 1-hour expiration and cleared on demand

### Data Masking
- **PII removal** in logs: Chinese names, phone numbers, and email addresses are automatically masked
- Masking patterns:
  - Chinese names: first character preserved, rest replaced with `*`
  - Phone numbers: replaced with `1**********`
  - Email addresses: replaced with `***@***.com`

### Data Retention
- Default session timeout: **24 hours**
- Expired data is automatically cleaned
- Crisis detection logs may be retained longer for safety review (configurable)

## Third-Party Data Sharing

- **By default, no data is shared with third parties**
- When QVAC SDK is used, inference is performed on-device (privacy-preserving)
- When QVAC SDK is not available, LLM inference may involve external API calls — check your deployment configuration
- No advertising trackers or analytics third parties are integrated

## User Rights

- Users can request data deletion at any time
- Token revocation on logout ensures session data cannot be reused
- Users should be informed that conversation content may be processed by the AI system

## Limitations

- This platform is **not** a certified medical record system
- Data protection measures reduce risk but cannot guarantee absolute security
- Users should avoid sharing highly sensitive personal information (SSN, financial details) in conversations
- Crisis detection logging exists for user safety; users should be informed of this in the application

## Configuration

| Environment Variable | Description |
|---------------------|-------------|
| `ENCRYPTION_MASTER_KEY` | Master key for data encryption (recommended) |
| `JWT_SECRET` | Required for session authentication |

## Compliance Notes

- This platform is designed as a research/educational tool
- For clinical deployment, additional compliance measures (HIPAA, GDPR, etc.) should be implemented by the deploying organization
- The deploying organization is responsible for ensuring compliance with applicable data protection regulations in their jurisdiction
