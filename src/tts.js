/**
 * TTS (Text-to-Speech) module
 * Handles audio output synthesis for voice-based consultations
 */

const { QVAC } = require('@qvac/sdk');

let ttsClient = null;

/**
 * Initialize TTS client
 */
async function initTTS() {
  ttsClient = new QVAC({
    task: 'tts',
    model: 'tts-base',
    language: 'zh',
  });
  console.log('[TTS] Text-to-speech module initialized');
}

/**
 * Synthesize text to audio
 * @param {string} text - Text to synthesize
 * @param {Object} options - Synthesis options
 * @returns {Promise<{audio: Buffer, duration: number, sampleRate: number}>}
 */
async function synthesize(text, options = {}) {
  if (!ttsClient) {
    await initTTS();
  }

  const result = await ttsClient.synthesize({
    text: text,
    voice: options.voice || 'female-calm',
    language: options.language || 'zh',
    speed: options.speed || 1.0,
    format: options.format || 'wav',
  });

  return {
    audio: result.audio,
    duration: result.duration || 0,
    sampleRate: result.sampleRate || 22050,
  };
}

/**
 * Get available voices
 */
async function getVoices() {
  if (!ttsClient) {
    await initTTS();
  }
  return await ttsClient.getVoices();
}

module.exports = {
  initTTS,
  synthesize,
  getVoices,
};
