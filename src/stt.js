/**
 * STT (Speech-to-Text) module
 * Handles audio input transcription for voice-based consultations
 */

const { QVAC } = require('@qvac/sdk');

let sttClient = null;

// Audio validation constants
const ALLOWED_AUDIO_FORMATS = new Set(['wav', 'mp3', 'flac', 'ogg', 'webm', 'm4a']);
const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const MIN_AUDIO_SIZE_BYTES = 100; // 100 bytes (prevent empty/malformed uploads)

/**
 * Validate audio input format and size
 * @param {Buffer} audioBuffer - Audio data
 * @param {Object} options - { format?: string }
 * @returns {{ valid: boolean, error?: string }}
 */
function validateAudioInput(audioBuffer, options = {}) {
  if (!audioBuffer || !Buffer.isBuffer(audioBuffer)) {
    return { valid: false, error: '音频数据无效：需要 Buffer 类型' };
  }

  if (audioBuffer.length < MIN_AUDIO_SIZE_BYTES) {
    return { valid: false, error: `音频数据过小（${audioBuffer.length} bytes），最小 ${MIN_AUDIO_SIZE_BYTES} bytes` };
  }

  if (audioBuffer.length > MAX_AUDIO_SIZE_BYTES) {
    const sizeMB = (audioBuffer.length / 1024 / 1024).toFixed(1);
    return { valid: false, error: `音频文件过大（${sizeMB}MB），最大允许 ${MAX_AUDIO_SIZE_BYTES / 1024 / 1024}MB` };
  }

  // Validate format hint if provided
  if (options.format) {
    const fmt = options.format.toLowerCase().replace(/^\./, '');
    if (!ALLOWED_AUDIO_FORMATS.has(fmt)) {
      return {
        valid: false,
        error: `不支持的音频格式: ${options.format}。支持的格式: ${[...ALLOWED_AUDIO_FORMATS].join(', ')}`,
      };
    }
  }

  // Check WAV header if buffer is large enough
  if (audioBuffer.length > 12) {
    const header = audioBuffer.slice(0, 4).toString('ascii');
    // Validate it's not a completely wrong file type (e.g. HTML/XML)
    if (header.startsWith('<') || header.startsWith('<?')) {
      return { valid: false, error: '音频数据似乎是文本/HTML文件，而非音频' };
    }
  }

  return { valid: true };
}

/**
 * Initialize STT client
 */
async function initSTT() {
  sttClient = new QVAC({
    task: 'stt',
    model: 'whisper-base',
    language: 'zh',
  });
  console.log('[STT] Speech-to-text module initialized');
}

/**
 * Transcribe audio buffer to text
 * @param {Buffer} audioBuffer - Audio data (WAV/MP3/FLAC)
 * @param {Object} options - Transcription options
 * @returns {Promise<{text: string, confidence: number, language: string}>}
 */
async function transcribe(audioBuffer, options = {}) {
  // Validate audio input before processing
  const validation = validateAudioInput(audioBuffer, options);
  if (!validation.valid) {
    throw new Error(`[STT] 音频校验失败: ${validation.error}`);
  }

  if (!sttClient) {
    await initSTT();
  }

  const result = await sttClient.transcribe({
    audio: audioBuffer,
    language: options.language || 'zh',
    task: 'transcribe',
  });

  return {
    text: result.text,
    confidence: result.confidence || 0.95,
    language: result.language || options.language || 'zh',
  };
}

/**
 * Detect language from audio
 */
async function detectLanguage(audioBuffer) {
  // Validate audio input
  const validation = validateAudioInput(audioBuffer);
  if (!validation.valid) {
    throw new Error(`[STT] 音频校验失败: ${validation.error}`);
  }

  if (!sttClient) {
    await initSTT();
  }

  const result = await sttClient.transcribe({
    audio: audioBuffer,
    task: 'detect_language',
  });

  return result.language;
}

module.exports = {
  initSTT,
  transcribe,
  detectLanguage,
  validateAudioInput,
  ALLOWED_AUDIO_FORMATS,
  MAX_AUDIO_SIZE_BYTES,
};
