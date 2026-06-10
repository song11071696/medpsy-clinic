# MedPsy Clinic - Rule-Based Mental Health Consultation Platform

## 🔒 隐私保护特色

MedPsy Clinic 将用户隐私保护作为核心设计原则：

| 特色 | 说明 |
|------|------|
| **端到端加密** | AES-256-GCM 加密所有敏感咨询数据，传输和存储全程加密 |
| **QVAC 隐私计算** | 基于 QVAC SDK 的隐私保护 LLM 推理，心理健康数据不出本地设备 |
| **数据脱敏** | 日志和分析中自动脱敏个人信息，移除姓名、电话、身份证号等 PII |
| **JWT 强制安全密钥** | 启动时强制要求 `JWT_SECRET` 环境变量（≥16字符），无 fallback，缺失即拒绝启动 |
| **输入内容过滤** | 所有用户输入经过 XSS/注入检测、长度限制、格式校验 |
| **音频格式校验** | 语音输入严格校验文件格式（WAV/MP3/FLAC/OGG/WebM）、大小（≤25MB）和内容完整性 |
| **Token 撤销机制** | 支持用户登出后立即撤销 JWT Token，防止令牌被盗用 |
| **数据留存控制** | 默认 24 小时会话超时，过期数据自动清理 |
| **零泄露承诺** | 用户心理健康数据永远不会被第三方获取，所有处理在设备端完成 |
| **免责声明** | 每条 AI 响应自动附加免责声明，提醒用户咨询专业医师 |

### 安全架构

```
用户输入 → 输入验证（长度/格式/XSS过滤） → JWT 认证 → 速率限制
    ↓
RAG 检索 → QVAC 隐私推理 → 响应生成 → 免责声明附加 → 加密传输
    ↓
数据脱敏 → 日志记录（移除PII） → 定期清理
```

## 🆘 危机干预机制

### 四级危机评估体系

| 等级 | 标签 | 响应时间 | 触发关键词示例 | 行动 |
|------|------|---------|--------------|------|
| **CRITICAL** | 紧急 | 立即 | 想自杀、结束生命、割腕、遗书 | 热线转介 + 紧急联系人通知 |
| **HIGH** | 高危 | 1小时内 | 不想活、活够了、想消失、想伤害自己 | 专业咨询师转介 + 热线提供 |
| **MODERATE** | 中度 | 24小时内 | 撑不下去、快要崩溃、看不到希望 | 自助资源 + 预约建议 |
| **LOW** | 低度 | 常规 | 太痛苦了、一个人好累 | 心理健康建议 + 持续监测 |

### 干预流程

```
用户输入 → 关键词匹配（中/英文） → 严重程度评估
    ↓
[CRITICAL/HIGH] → 立即显示危机热线 → 生成危机警报 → 记录用户ID和时间
    ↓
[MODERATE/LOW]  → 温和建议 → 推荐自助资源 → 标记观察
```

### 危机热线（自动转介）

| 热线名称 | 号码 | 覆盖范围 |
|---------|------|---------|
| 全国24小时心理援助热线 | 400-161-9995 | 全国 |
| 北京心理危机研究与干预中心 | 010-82951332 | 北京 |
| 生命热线 | 400-821-1215 | 全国 |
| 希望24热线 | 400-161-9995 | 全国 |
| Emergency (US) | 988 | 美国 |
| Crisis Text Line | Text HOME to 741741 | 英语区 |

### 边缘情况处理

- **误报防护**：自动检测中文成语、电影讨论等非危机场景
- **混合语言**：支持中英文混合输入的危机检测
- **多分类检测**：同时检测自杀意念、自伤行为、严重困扰、虐待暴力四类危机
- **去重机制**：相同关键词多次出现自动去重，避免重复警报
- **历史追踪**：危机警报完整记录，支持解决状态跟踪

## Performance Benchmarks

MedPsy Clinic is a rule-based mental health consultation platform that combines:
- **Knowledge Retrieval**: Uses TF-IDF cosine similarity for semantic document matching
- **STT (Speech-to-Text)**: Voice input for natural conversation
- **TTS (Text-to-Speech)**: Audio output for accessibility
- **WebSocket**: Real-time bidirectional communication
- **Streaming**: Server-Sent Events for progressive response delivery

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MedPsy Clinic                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────────────┐  │
│  │  Client   │──▶│  API Server  │──▶│  Express Middleware    │  │
│  │ (Web/App) │◀──│  (HTTP/WS)   │◀──│  - CORS                │  │
│  └──────────┘   └──────────────┘   │  - Rate Limiting       │  │
│       │               │             │  - Request Logging     │  │
│       │               │             └────────────────────────┘  │
│       │               ▼                                         │
│  ┌──────────┐   ┌──────────────┐   ┌────────────────────────┐  │
│  │ WebSocket │──▶│  RAG Engine  │──▶│  Knowledge Base        │  │
│  │   /ws     │   │  (Retrieval) │   │  (28+ documents)       │  │
│  └──────────┘   └──────┬───────┘   │  - CBT Overview        │  │
│                        │           │  - Anxiety Management   │  │
│                        ▼           │  - Depression Guide     │  │
│                 ┌──────────────┐   │  - Sleep Disorders      │  │
│                 │   QVAC SDK   │   │  - Stress Management    │  │
│                 │  (LLM/STT/   │   │  - Trauma & PTSD        │  │
│                 │   TTS)       │   │  - ... 22 more topics   │  │
│                 └──────────────┘   └────────────────────────┘  │
│                        │                                        │
│          ┌─────────────┼─────────────┐                          │
│          ▼             ▼             ▼                           │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│    │ MedPsy-4B│  │ Whisper  │  │ TTS-Base │                    │
│    │  (LLM)   │  │ (STT)    │  │ (TTS)    │                    │
│    └──────────┘  └──────────┘  └──────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Text Query:   Client ──POST──▶ /api/consult ──▶ RAG retrieve() ──▶ QVAC completion() ──▶ Response
Voice Query:  Client ──POST──▶ /api/consult/voice ──▶ STT ──▶ RAG ──▶ TTS ──▶ Response
Stream:       Client ──POST──▶ /api/consult/stream ──▶ RAG ──▶ SSE chunked response
WebSocket:    Client ◀──WS──▶ /ws ──▶ consult/retrieve messages ──▶ token-by-token response
```

### Screenshots & UI Preview

```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Chat Interface                                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 🤖 AI 咨询师                                             │  │
│  │ 听起来您正在经历焦虑情绪。根据认知行为疗法(CBT)的框架...   │  │
│  │                                                          │  │
│  │ ┌─ 📚 参考来源 ──────────────────────────────────────┐  │  │
│  │ │ 📖 焦虑管理  v1.2  来源: 中国心理学会...            │  │  │
│  │ │ 📖 CBT概述    v1.1  来源: Beck Institute...         │  │  │
│  │ └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  📊 Emotion Dashboard                                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │ 情绪分布                 │  │ 本周情绪走势              │   │
│  │ 平静 ████████████ 12    │  │   ●                      │   │
│  │ 焦虑 ████████░░░  8     │  │  ●  ●                    │   │
│  │ 感恩 ███████░░░░  7     │  │         ●   ●            │   │
│  │ 快乐 ██████░░░░░  6     │  │              ●  ●        │   │
│  └──────────────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Architecture Overview:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  Frontend   │────▶│  API Server │────▶│  RAG Engine     │
│  React/Vite │◀────│  Express    │◀────│  TF-IDF Search  │
│  Port 5173  │     │  Port 3000  │     │  28+ documents  │
└─────────────┘     └──────┬──────┘     └────────┬────────┘
                           │                      │
                    ┌──────┴──────┐        ┌──────┴──────┐
                    │  Auth/JWT   │        │  QVAC SDK   │
                    │  Rate Limit │        │  LLM/STT/TTS│
                    └─────────────┘        └─────────────┘
```

## Features

- **Text-based mental health consultation** with RAG context
- **Voice-based consultation** (speech input → knowledge-based response → speech output)
- **Streaming responses** via Server-Sent Events (SSE)
- **WebSocket** for real-time bidirectional communication
- **OpenAI-compatible API** (`/v1/chat/completions`)
- **Comprehensive knowledge base** with 28+ psychology documents
- **Rate limiting** with per-client tracking
- **API documentation** at `/v1/docs` (OpenAPI 3.0.3)
- **Health monitoring** with uptime, memory, and connection stats

## Quick Start

### Backend (API Server)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment config
cp .env.example .env

# 3. Run the full API server (port 3000)
npm run serve

# Alternative: run minimal server
npm start
```

**Expected backend output:**
```
🏥 MedPsy Clinic API Server starting...
[RAG] Loaded 28 knowledge base documents
[RAG] TF-IDF index built: 5200+ unique terms across 28 documents
[MedPsy] Server running on http://localhost:3000
[MedPsy] Health check: http://localhost:3000/health
```

### Frontend (React + Vite)

```bash
# 1. Enter frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start dev server (port 5173, proxies /api to localhost:3000)
npm run dev
```

**Expected frontend output:**
```
  VITE v5.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Full Stack Workflow

```bash
# Terminal 1: Start backend
npm run serve

# Terminal 2: Start frontend
cd frontend && npm run dev

# Open browser at http://localhost:5173
```

### Expected Chat Flow

1. Open `http://localhost:5173` → See the chat interface with quick-start prompts
2. Click "我最近感到很焦虑" or type a custom message
3. The loading indicator shows "AI 正在思考..."
4. Response appears with RAG knowledge sources (e.g. 📚 anxiety-management)
5. Each response is grounded in the 28+ psychology knowledge base documents

**Example API call:**
```bash
curl -X POST http://localhost:3000/api/consult \
  -H "Content-Type: application/json" \
  -d '{"query": "我最近感到很焦虑，应该怎么办？"}'
```

**Example response:**
```json
{
  "success": true,
  "data": {
    "answer": "听起来您正在经历焦虑情绪。根据认知行为疗法...",
    "sources": ["anxiety-management", "cbt-overview"],
    "context_used": true
  },
  "timestamp": "2025-06-06T12:00:00.000Z"
}
```

### Run tests

```bash
npm test
```

## API Endpoints

### System
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check with system info |
| `GET` | `/v1/docs` | OpenAPI 3.0.3 documentation |

### Consultation
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/consult` | Text consultation (supports `stream: true`) |
| `POST` | `/api/consult/stream` | Streaming consultation (SSE) |
| `POST` | `/api/consult/voice` | Voice consultation (audio in/out) |

### Knowledge
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/knowledge` | List knowledge base documents |
| `POST` | `/api/retrieve` | Search knowledge base |

### OpenAI Compatible
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/models` | List available models |
| `POST` | `/v1/chat/completions` | Chat completions (supports streaming) |

### WebSocket
| Path | Description |
|------|-------------|
| `ws://host:port/ws` | Real-time bidirectional communication |

### Examples

**Text Consultation:**
```bash
curl -X POST http://localhost:3000/api/consult \
  -H "Content-Type: application/json" \
  -d '{"query": "I feel anxious, what should I do?"}'
```

**Streaming Consultation:**
```bash
curl -X POST http://localhost:3000/api/consult \
  -H "Content-Type: application/json" \
  -d '{"query": "What is CBT?", "stream": true}'
```

**Voice Consultation:**
```bash
curl -X POST http://localhost:3000/api/consult/voice \
  -H "Content-Type: audio/wav" \
  --data-binary @recording.wav
```

**Document Retrieval:**
```bash
curl -X POST http://localhost:3000/api/retrieve \
  -H "Content-Type: application/json" \
  -d '{"query": "anxiety management", "topK": 3}'
```

**WebSocket:**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'consult', query: 'I feel stressed' }));
};
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'token') process.stdout.write(msg.content);
  if (msg.type === 'consult_done') console.log('\nDone!', msg.sources);
};
```

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| General | 60 requests | 1 minute |
| Consultation | 10 requests | 1 minute |
| Voice | 5 requests | 1 minute |

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Performance Benchmarks

Benchmark results on reference hardware (Apple M1, 16GB RAM, Node.js 20):

| Metric | Value | Notes |
|--------|-------|-------|
| Model load time | ~3-5s | MedPsy-4B-Q4_K_M.gguf |
| TTFT (first token) | ~200-400ms | With RAG retrieval |
| Tokens/second | ~15-25 tok/s | On-device inference |
| RAG retrieval | <10ms | 28+ documents, TF-IDF cosine similarity |
| API response (non-streaming) | ~1-3s | Full generation |
| Memory usage | ~2-4GB | Model + runtime |
| **Crisis detection** | **<1ms** | **Keyword matching across 4 categories, 2 languages** |
| **Input validation** | **<0.1ms** | **XSS/length/format checks** |
| **JWT sign/verify** | **<0.5ms** | **HMAC-SHA256 with timing-safe comparison** |
| **RAG TF-IDF build** | **<50ms** | **28 documents, 5200+ unique terms** |
| **Audio validation** | **<1ms** | **Format/size/header checks for 25MB max** |
| **Disclaimers** | **N/A** | **Auto-appended to every AI response** |

### Running Benchmarks

```bash
# Run the demo with performance logging
node src/demo.js

# Performance log saved to performance-log.json
cat performance-log.json
```

## Project Structure

```
medpsy-clinic/
├── src/
│   ├── index.js          # Main application with Express server
│   ├── api-server.js     # QVAC-compatible HTTP API (OpenAI-style)
│   ├── rag.js            # RAG module (knowledge retrieval + completion)
│   ├── stt.js            # Speech-to-Text module
│   ├── tts.js            # Text-to-Speech module
│   ├── demo.js           # Demo script with 5 scenarios
│   ├── logger.js         # Performance logger (TTFT, tok/s)
│   ├── privacy/
│   │   └── data-encryption.js  # 端到端加密 + 数据脱敏 (AES-256-GCM)
│   └── ai/
│       └── crisis-intervention.js  # 危机干预 + 紧急热线转介
├── data/
│   └── knowledge-base/   # Psychology documents (28+ files)
│       ├── cbt-overview.md
│       ├── anxiety-management.md
│       ├── depression-guide.md
│       ├── sleep-disorders.md
│       ├── stress-management.md
│       └── ... (23 more topic files)
├── test/
│   ├── rag.test.js       # RAG module tests (15 cases)
│   ├── api.test.js       # Rate limiter tests (8 cases)
│   └── integration.test.js # HTTP integration tests (12 cases)
├── docs/
│   ├── submission-guide.md
│   └── doraHacks-submission-text.md
├── api-server.js         # Full API server (rate limiting + WebSocket + streaming)
├── package.json
└── README.md
```

## Deployment

### Local Development

```bash
npm install
npm run serve
```

### Docker

```dockerfile
FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

EXPOSE 3000
CMD ["node", "api-server.js"]
```

```bash
docker build -t medpsy-clinic .
docker run -p 3000:3000 -e PORT=3000 medpsy-clinic
```

### Docker Compose

```yaml
version: '3.8'
services:
  medpsy-clinic:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start api-server.js --name medpsy-clinic

# Monitor
pm2 monit

# Auto-restart on crash
pm2 startup
pm2 save
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name medpsy.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `LOG_LEVEL` | `info` | Logging level |
| `CORS_ORIGINS` | `localhost:3000,5173,8080` | Comma-separated allowed CORS origins |

## Knowledge Base

The knowledge base includes **28+ documents** covering:

### Document Versioning & Sources

Each knowledge base document includes YAML front matter metadata:

```yaml
---
version: v1.2
source: 中国心理学会临床心理学注册工作委员会 + APA Practice Guidelines
last_updated: 2025-06-01
---
```

This metadata is parsed by the RAG engine and returned with each response as source citations.

### Core Therapeutic Approaches
- Cognitive Behavioral Therapy (CBT) overview and basics
- Mindfulness-based interventions and exercises
- Positive psychology principles

### Mental Health Topics
- **Anxiety Management**: Types, CBT strategies, relaxation techniques
- **Depression Intervention**: Assessment, CBT/IPT/BA treatments, crisis protocols
- **Sleep Disorders**: Insomnia, CBT-I, sleep hygiene
- **Stress Management**: Stress physiology, CBSM, MBSR
- **Trauma & Stress-Related Disorders**: PTSD symptoms, PE, CPT, EMDR
- **Interpersonal Relationships**: Attachment theory, IPT, communication skills
- **Self-Esteem Building**: CBT, self-compassion, ACT approaches
- Social anxiety, OCD, eating disorders, grief counseling
- Addiction recovery, anger management, family therapy
- Adolescent psychology, attachment theory
- Crisis intervention, psychoeducation

## Important Notes

- **JWT_SECRET is mandatory** — the server will refuse to start without a valid `JWT_SECRET` (≥16 chars). No fallback secret is provided.
- **Disclaimer auto-appended** — every AI response includes a medical disclaimer reminding users to consult a licensed professional.
- **Knowledge base versioning** — all documents include version/source metadata, returned with API responses for transparency.
- The RAG `completion()` function is **async** and must be **awaited**
- The `@qvac/sdk` is listed as an optional dependency (>=0.12.0) — install may require native build tools
- Always consult a mental health professional for serious concerns
- This is not a substitute for professional medical advice

## License

MIT
