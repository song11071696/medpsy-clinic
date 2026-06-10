/**
 * 情绪分析模块
 * 通过文本和语音输入分析用户情绪状态
 */

const EMOTION_LABELS = ['happy', 'sad', 'angry', 'anxious', 'fearful', 'surprised', 'neutral', 'disgusted'];
const INTENSITY_LEVELS = ['low', 'medium', 'high', 'extreme'];

const EMOTION_KEYWORDS = {
  happy: ['开心', '高兴', '快乐', '幸福', '愉快', '满意', '兴奋', 'hopeful', 'happy', 'joy', 'glad'],
  sad: ['悲伤', '难过', '伤心', '沮丧', '失落', '痛苦', 'sad', 'depressed', 'grief', 'sorrowful'],
  angry: ['愤怒', '生气', '恼火', '烦躁', '暴怒', 'angry', 'furious', 'irritated', 'rage'],
  anxious: ['焦虑', '紧张', '不安', '担忧', '恐慌', 'anxious', 'worried', 'nervous', 'tense'],
  fearful: ['害怕', '恐惧', '畏惧', '怕', 'scared', 'afraid', 'fearful', 'terrified'],
  surprised: ['惊讶', '震惊', '意外', 'surprised', 'shocked', 'astonished'],
  neutral: ['平静', '一般', '还好', 'okay', 'fine', 'neutral', 'calm'],
  disgusted: ['厌恶', '恶心', '反感', 'disgusted', 'repulsed', 'revolted']
};

class EmotionAnalyzer {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.3;
    this.history = [];
    this.maxHistorySize = options.maxHistorySize || 1000;
  }

  /**
   * 分析文本中的情绪
   * @param {string} text - 输入文本
   * @returns {Object} 情绪分析结果
   */
  analyzeText(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('输入文本必须是非空字符串');
    }

    const scores = {};
    const lowerText = text.toLowerCase();
    let totalMatches = 0;

    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      let count = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(keyword, 'gi');
        const matches = lowerText.match(regex);
        if (matches) count += matches.length;
      }
      scores[emotion] = count;
      totalMatches += count;
    }

    // 归一化分数
    const normalizedScores = {};
    for (const [emotion, score] of Object.entries(scores)) {
      normalizedScores[emotion] = totalMatches > 0 ? score / totalMatches : 0;
    }

    // 确定主要情绪
    const sortedEmotions = Object.entries(normalizedScores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1]);

    const primaryEmotion = sortedEmotions.length > 0 ? sortedEmotions[0][0] : 'neutral';
    const intensity = this._calculateIntensity(normalizedScores[primaryEmotion]);

    const result = {
      text,
      primaryEmotion,
      intensity,
      scores: normalizedScores,
      allDetected: sortedEmotions.map(([e, s]) => ({ emotion: e, score: s })),
      timestamp: new Date().toISOString(),
      confidence: sortedEmotions.length > 0 ? sortedEmotions[0][1] : 0
    };

    this.history.push(result);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    return result;
  }

  /**
   * 计算情绪强度等级
   */
  _calculateIntensity(score) {
    if (score >= 0.8) return 'extreme';
    if (score >= 0.6) return 'high';
    if (score >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * 获取情绪趋势
   * @param {number} windowSize - 窗口大小
   * @returns {Object} 趋势分析
   */
  getEmotionTrend(windowSize = 10) {
    const window = this.history.slice(-windowSize);
    if (window.length < 2) return { trend: 'insufficient_data', data: [] };

    const emotionCounts = {};
    for (const entry of window) {
      emotionCounts[entry.primaryEmotion] = (emotionCounts[entry.primaryEmotion] || 0) + 1;
    }

    const dominantEmotion = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    return {
      trend: dominantEmotion,
      distribution: emotionCounts,
      windowSize: window.length,
      recentEmotions: window.slice(-5).map(e => e.primaryEmotion)
    };
  }

  /**
   * 批量分析
   * @param {string[]} texts - 文本数组
   * @returns {Object[]} 分析结果数组
   */
  analyzeBatch(texts) {
    if (!Array.isArray(texts)) throw new Error('输入必须是数组');
    return texts.map(text => this.analyzeText(text));
  }

  /**
   * 获取历史记录
   */
  getHistory(limit = 50) {
    return this.history.slice(-limit);
  }

  /**
   * 重置分析器
   */
  reset() {
    this.history = [];
  }
}

module.exports = { EmotionAnalyzer, EMOTION_LABELS, INTENSITY_LEVELS };
