/**
 * MedPsy Clinic - Chat Routes
 * Handles AI-assisted therapy chat sessions with streaming support
 */

const express = require('express');
const router = express.Router();
const { streamLimiter } = require('../middleware/rateLimit');
const rag = require('../../rag');

const { validateChatMessage } = require('../../utils/validators');

// Standard disclaimer appended to every AI response
const DISCLAIMER = '\n\n---\n⚠️ **免责声明**：以上内容由 AI 辅助生成，仅供参考，不构成专业医疗或心理建议，不能替代专业心理医生的诊断和治疗。如有任何健康问题，请咨询具有执业资质的医师或心理咨询师。如有紧急情况，请立即拨打 24 小时心理援助热线：**400-161-9995**，或前往最近的医疗机构就诊。';

let ragInitialized = false;

async function ensureRAG() {
  if (!ragInitialized) {
    try {
      await rag.initRAG();
      ragInitialized = true;
    } catch (err) {
      console.error('[Chat] RAG init failed:', err.message);
    }
  }
}

// In-memory session store (use DB in production)
const sessions = new Map();

/**
 * POST /send - Send a message and get AI response
 */
router.post('/send', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    // Use unified validator for input sanitization
    const validation = validateChatMessage(message);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const cleanMessage = validation.sanitized;

    const sid = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    if (!sessions.has(sid)) {
      sessions.set(sid, { id: sid, userId: req.user?.id, messages: [], createdAt: new Date() });
    }
    const session = sessions.get(sid);

    // Store user message
    const userMsg = { role: 'user', content: cleanMessage, timestamp: new Date() };
    session.messages.push(userMsg);

    // Generate AI response via RAG + QVAC
    const aiResult = await generateAIResponse(session.messages);
    const contentWithDisclaimer = aiResult.answer + DISCLAIMER;
    const assistantMsg = {
      role: 'assistant',
      content: contentWithDisclaimer,
      timestamp: new Date(),
      disclaimer: true,
      sources: aiResult.sources,
      context_used: aiResult.context_used,
    };
    session.messages.push(assistantMsg);

    res.json({
      sessionId: sid,
      message: assistantMsg,
      sources: aiResult.sources,
      messageCount: session.messages.length,
    });
  } catch (err) {
    console.error('[Chat] Send error:', err.message);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * POST /stream - SSE streaming chat response
 */
router.post('/stream', streamLimiter, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    // Use unified validator
    const validation = validateChatMessage(message);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const cleanMessage = validation.sanitized;

    const sid = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    if (!sessions.has(sid)) {
      sessions.set(sid, { id: sid, userId: req.user?.id, messages: [], createdAt: new Date() });
    }
    const session = sessions.get(sid);
    session.messages.push({ role: 'user', content: cleanMessage, timestamp: new Date() });

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Session-ID': sid,
    });

    // Stream tokens with improved chunking (by sentence/clause boundaries)
    const aiResult = await generateAIResponse(session.messages);
    const fullResponse = aiResult.answer;
    // Semantic chunking: split on sentence boundaries (Chinese + English punctuation)
    // Preserves punctuation with its sentence, falls back to clause boundaries for long sentences
    const chunks = fullResponse.match(/[^。！？!?\n.]+[。！？!?\n.]?|\n/g) || [fullResponse];
    const streamedContent = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) continue;
      // Sub-split long sentences at clause boundaries (commas, semicolons, Chinese pauses)
      let subChunks;
      if (chunk.length > 40) {
        subChunks = chunk.match(/[^，；,;、]+[，；,;、]?/g) || [chunk];
        // Further split if a clause is still very long (>30 chars)
        subChunks = subChunks.flatMap(s => s.length > 30 ? s.match(/.{1,20}/g) || [s] : [s]);
      } else {
        subChunks = [chunk];
      }
      for (const sub of subChunks) {
        streamedContent.push(sub);
        res.write(`data: ${JSON.stringify({ token: sub, done: false })}\n\n`);
        // Vary delay: longer pause after punctuation (sentence end), shorter within sentences
        const isPunctuation = /[。！？!?\n.]$/.test(sub);
        const delay = isPunctuation ? 80 + Math.random() * 40 : 25 + Math.random() * 25;
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    // Append disclaimer as final chunk
    res.write(`data: ${JSON.stringify({ token: DISCLAIMER, done: false, isDisclaimer: true })}\n\n`);

    const fullContentWithDisclaimer = fullResponse + DISCLAIMER;
    session.messages.push({ role: 'assistant', content: fullContentWithDisclaimer, timestamp: new Date(), disclaimer: true, sources: aiResult.sources });
    res.write(`data: ${JSON.stringify({ token: '', done: true, sessionId: sid, disclaimer: true, sources: aiResult.sources, context_used: aiResult.context_used })}\n\n`);
    res.end();
  } catch (err) {
    console.error('[Chat] Stream error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    res.end();
  }
});

/**
 * GET /history/:sessionId - Get chat history
 */
router.get('/history/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  // 安全修复：严格检查会话所有权，防止IDOR攻击
  if (!req.user?.id || (session.userId && session.userId !== req.user.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json({
    sessionId: session.id,
    messages: session.messages,
    createdAt: session.createdAt,
    messageCount: session.messages.length,
  });
});

/**
 * DELETE /session/:sessionId - Delete a chat session
 */
router.delete('/session/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  // 安全修复：严格检查会话所有权，防止IDOR攻击
  if (!req.user?.id || (session.userId && session.userId !== req.user.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  sessions.delete(req.params.sessionId);
  res.json({ message: 'Session deleted', sessionId: req.params.sessionId });
});

/**
 * Generate AI response using RAG knowledge base + QVAC completion
 */
async function generateAIResponse(messages) {
  await ensureRAG();
  const last = messages[messages.length - 1]?.content || '';
  try {
    const result = await rag.completion(last);
    // Normalize sources to include title, category, metadata
    const sources = (result.sources || []).map(s => typeof s === 'string' ? { title: s } : s);
    return { answer: result.answer, sources, context_used: result.context_used || false };
  } catch (err) {
    console.error('[Chat] RAG completion error:', err.message);
    // Fallback to basic response if RAG fails
    return { answer: '感谢您的分享。作为您的心理健康助手，我会认真倾听您的每一个问题。如果需要更专业的帮助，建议您联系专业心理咨询师。', sources: [], context_used: false };
  }
}

module.exports = router;
