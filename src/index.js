/**
 * MedPsy Clinic - Main Entry Point
 * AI-assisted mental health consultation platform
 *
 * Integrates: RAG (knowledge retrieval), STT (speech input), TTS (speech output)
 */

require('dotenv').config();

const { initRAG, completion, getDocumentTitles } = require('./rag');
const { initSTT, transcribe } = require('./stt');
const { initTTS, synthesize } = require('./tts');

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'audio/*', limit: '25mb' }));

// ============================================================
// Initialization
// ============================================================

async function initializeServices() {
  try {
    console.log('[MedPsy] Initializing services...');
    await initRAG();
    await initSTT();
    await initTTS();
    console.log('[MedPsy] All services initialized successfully');
    console.log(`[MedPsy] Knowledge base contains: ${getDocumentTitles().join(', ')}`);
  } catch (err) {
    console.error('[MedPsy] Service initialization error:', err);
    process.exit(1);
  }
}

// ============================================================
// API Routes
// ============================================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'medpsy-clinic',
    timestamp: new Date().toISOString(),
    knowledge_base: getDocumentTitles(),
  });
});

/**
 * Text-based consultation endpoint
 * POST /api/consult
 * Body: { "query": "用户问题", "context": { "history": [...] } }
 */
app.post('/api/consult', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query field is required and must be a string',
      });
    }

    console.log(`[Consult] Received query: ${query.substring(0, 100)}...`);

    // IMPORTANT: completion() is async - MUST await
    const result = await completion(query);

    res.json({
      success: true,
      data: {
        answer: result.answer,
        sources: result.sources,
        context_used: result.context_used,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Consult] Error:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * Voice consultation endpoint
 * POST /api/consult/voice
 * Body: raw audio buffer (WAV/MP3/FLAC)
 */
app.post('/api/consult/voice', async (req, res) => {
  try {
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Audio data is required',
      });
    }

    // Step 1: Speech-to-Text
    console.log('[Voice] Transcribing audio...');
    const sttResult = await transcribe(req.body);
    console.log(`[Voice] Transcribed: ${sttResult.text}`);

    // Step 2: RAG completion
    const ragResult = await completion(sttResult.text);

    // Step 3: Text-to-Speech
    console.log('[Voice] Synthesizing response...');
    const ttsResult = await synthesize(ragResult.answer);

    res.json({
      success: true,
      data: {
        transcription: {
          text: sttResult.text,
          confidence: sttResult.confidence,
          language: sttResult.language,
        },
        answer: {
          text: ragResult.answer,
          sources: ragResult.sources,
        },
        audio: {
          duration: ttsResult.duration,
          sampleRate: ttsResult.sampleRate,
          base64: ttsResult.audio.toString('base64'),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Voice] Error:', err);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * List knowledge base documents
 * GET /api/knowledge
 */
app.get('/api/knowledge', (req, res) => {
  res.json({
    success: true,
    documents: getDocumentTitles(),
    count: getDocumentTitles().length,
  });
});

// ============================================================
// Start Server
// ============================================================

if (require.main === module) {
  initializeServices().then(() => {
    app.listen(PORT, () => {
      console.log(`[MedPsy] Server running on http://localhost:${PORT}`);
      console.log(`[MedPsy] Health check: http://localhost:${PORT}/health`);
    });
  });
}

// Export for testing
module.exports = { app, initializeServices };
