# DoraHacks Submission Text — MedPsy Clinic

## Project Title
**MedPsy Clinic — On-Device AI Mental Health Assistant**

## Project Description

MedPsy Clinic is a privacy-first mental health AI assistant powered by QVAC SDK and MedPsy models, running entirely on-device with zero cloud dependency.

### The Problem
Mental health support faces two critical barriers: (1) privacy concerns — users fear their sensitive conversations being stored on corporate servers, and (2) accessibility — professional therapy is expensive and waitlisted. Existing AI chatbots send all data to the cloud, violating the fundamental trust required for mental health conversations.

### Our Solution
MedPsy Clinic leverages QVAC's on-device inference to run MedPsy-4B — a model that outperforms Google MedGemma 27B on medical benchmarks — directly on the user's device. Every conversation stays local. Every inference happens on-device. Zero data leaves the machine.

### Key Features
- **CBT-Guided Conversations** — Evidence-based Cognitive Behavioral Therapy techniques
- **RAG Knowledge Base** — Local psychology literature retrieval for accurate, cited responses
- **Voice Interface** — Whisper STT + Chatterbox TTS for natural voice conversations
- **Crisis Detection** — Automatic identification of crisis signals with immediate resource provision
- **OpenAI-Compatible API** — Standard REST endpoints for easy integration with other apps
- **Performance Auditing** — Built-in TTFT and tokens/sec logging for transparency

### QVAC SDK Usage
- LLM inference via MedPsy-4B-Q4_K_M (primary) and MedPsy-1.7B-Q4_K_M (lightweight fallback)
- Text embeddings via nomic-embed-text for RAG vector search
- Speech-to-text via Whisper for voice input
- Text-to-speech via Chatterbox for voice output
- Streaming token generation via tokenStream
- Full model lifecycle management (loadModel/completion/unloadModel)

### Technical Highlights
- **Zero Cloud Dependency** — No API keys, no subscriptions, no data leakage
- **Vulkan GPU Acceleration** — Cross-platform GPU support (NVIDIA, AMD, Intel, Apple)
- **4-bit Quantization** — MedPsy-4B-Q4_K_M runs in just 2.6GB
- **RAG Pipeline** — Local vector embeddings over psychology knowledge base
- **Audit Logging** — Every inference logged with TTFT, tokens/sec, and hardware info

## Track
Psychology Model — specializing MedPsy for mental health applications.

## Hardware Requirements
- Minimum: 8GB RAM, any modern CPU
- Recommended: 16GB RAM, GPU with Vulkan support
- Models: MedPsy-4B-Q4_K_M (2.6GB) or MedPsy-1.7B-Q4_K_M (1.2GB for low-resource devices)
