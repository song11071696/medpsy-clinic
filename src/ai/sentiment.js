/**
 * Sentiment Analysis Module
 *
 * Text-based sentiment analysis using keyword matching and
 * scoring algorithms for mental health contexts.
 */

// ─── Sentiment Lexicons ──────────────────────────────────

const POSITIVE_KEYWORDS = {
  high: [
    '开心', '快乐', '高兴', '幸福', '兴奋', '愉快', '满足', '欣慰',
    '感激', '感恩', '希望', '乐观', '自信', '勇敢', '坚强', '平静',
    '放松', '舒适', '满意', '骄傲', '成功', '进步', '改善', '好转',
    'happy', 'joy', 'grateful', 'hopeful', 'confident', 'peaceful',
  ],
  medium: [
    '还行', '不错', '可以', '好的', '正常', '稳定', '一般', '还好',
    'ok', 'fine', 'good', 'better', 'okay',
  ],
  low: [
    '也许', '可能', '试试', '尝试', '努力', '坚持',
    'maybe', 'try', 'hope',
  ],
};

const NEGATIVE_KEYWORDS = {
  severe: [
    '绝望', '崩溃', '痛不欲生', '生不如死', '万念俱灰',
    '无法承受', '走投无路', '没有出路', '毫无意义',
    'hopeless', 'desperate', 'unbearable', 'worthless',
  ],
  high: [
    '悲伤', '痛苦', '焦虑', '恐惧', '愤怒', '沮丧', '绝望',
    '孤独', '无助', '无力', '绝望', '害怕', '担心', '紧张',
    '烦躁', '压抑', '难受', '疲惫', '心碎',
    'sad', 'anxious', 'depressed', 'scared', 'angry', 'lonely',
    'helpless', 'exhausted', 'overwhelmed',
  ],
  medium: [
    '不好', '不舒服', '不太对', '有点烦', '压力大', '睡不好',
    '吃不下', '没精神', '不开心', '无聊', '烦闷',
    'stressed', 'worried', 'tired', 'bored', 'unhappy',
  ],
  low: [
    '有点', '稍微', '不太', '略微',
    'slightly', 'somewhat', 'a bit',
  ],
};

// Crisis-related keywords (overlap with crisis detection)
const CRISIS_KEYWORDS = [
  '自杀', '想死', '不想活', '结束生命', '自残', '自我伤害',
  '遗书', '告别', '最后一次', '活不下去',
  'suicide', 'kill myself', 'end my life', 'self-harm',
];

// ─── Sentiment Scoring ──────────────────────────────────

/**
 * Calculate sentiment score for a single text
 * @param {string} text
 * @returns {Object} Sentiment result
 */
function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0, magnitude: 0, label: 'neutral', crisis: false };
  }

  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/[\s,，。！？!?.;；]+/).filter(Boolean);

  let positiveScore = 0;
  let negativeScore = 0;
  let crisisDetected = false;
  const matchedKeywords = { positive: [], negative: [], crisis: [] };

  // Check for positive keywords
  for (const [weight, keywords] of Object.entries(POSITIVE_KEYWORDS)) {
    const multiplier = weight === 'high' ? 3 : weight === 'medium' ? 2 : 1;
    for (const kw of keywords) {
      if (normalizedText.includes(kw.toLowerCase())) {
        positiveScore += multiplier;
        matchedKeywords.positive.push({ keyword: kw, weight });
      }
    }
  }

  // Check for negative keywords
  for (const [weight, keywords] of Object.entries(NEGATIVE_KEYWORDS)) {
    const multiplier = weight === 'severe' ? 4 : weight === 'high' ? 3 : weight === 'medium' ? 2 : 1;
    for (const kw of keywords) {
      if (normalizedText.includes(kw.toLowerCase())) {
        negativeScore += multiplier;
        matchedKeywords.negative.push({ keyword: kw, weight });
      }
    }
  }

  // Check for crisis keywords
  for (const kw of CRISIS_KEYWORDS) {
    if (normalizedText.includes(kw.toLowerCase())) {
      crisisDetected = true;
      matchedKeywords.crisis.push(kw);
    }
  }

  // Calculate overall score (-1 to 1)
  const totalScore = positiveScore + negativeScore;
  const score = totalScore > 0
    ? (positiveScore - negativeScore) / totalScore
    : 0;

  // Magnitude (strength of sentiment)
  const magnitude = Math.min(1, totalScore / 20);

  // Determine label
  let label;
  if (score > 0.3) label = 'positive';
  else if (score > 0.1) label = 'slightly_positive';
  else if (score > -0.1) label = 'neutral';
  else if (score > -0.3) label = 'slightly_negative';
  else label = 'negative';

  return {
    score: Math.round(score * 100) / 100,
    magnitude: Math.round(magnitude * 100) / 100,
    label,
    positiveScore,
    negativeScore,
    crisis: crisisDetected,
    matchedKeywords,
    wordCount: words.length,
  };
}

/**
 * Analyze sentiment across multiple messages (conversation)
 * @param {Array<string>} messages
 * @returns {Object} Aggregate sentiment
 */
function analyzeConversation(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { averageScore: 0, trend: 'neutral', crisis: false };
  }

  const results = messages.map(msg => analyzeSentiment(msg));
  const scores = results.map(r => r.score);
  const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
  const hasCrisis = results.some(r => r.crisis);

  // Calculate trend (comparing first half vs second half)
  const mid = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, mid);
  const secondHalf = scores.slice(mid);
  const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / (secondHalf.length || 1);
  const trendDelta = secondAvg - firstAvg;

  let trend;
  if (trendDelta > 0.15) trend = 'improving';
  else if (trendDelta < -0.15) trend = 'declining';
  else trend = 'stable';

  return {
    averageScore: Math.round(avgScore * 100) / 100,
    trend,
    trendDelta: Math.round(trendDelta * 100) / 100,
    crisis: hasCrisis,
    messageCount: messages.length,
    scores,
    volatility: calcVolatility(scores),
    lowestPoint: Math.min(...scores),
    highestPoint: Math.max(...scores),
  };
}

/**
 * Calculate score volatility
 */
function calcVolatility(scores) {
  if (scores.length < 2) return 0;
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / (scores.length - 1);
  return Math.round(Math.sqrt(variance) * 100) / 100;
}

/**
 * Extract emotional themes from text
 */
function extractEmotionalThemes(text) {
  const themes = {};
  const normalizedText = text.toLowerCase();

  const themeKeywords = {
    anxiety: ['焦虑', '担心', '紧张', '恐惧', '害怕', 'anxious', 'worried', 'scared'],
    depression: ['悲伤', '沮丧', '绝望', '无聊', 'sad', 'depressed', 'hopeless'],
    anger: ['愤怒', '生气', '烦躁', '恼火', 'angry', 'frustrated', 'annoyed'],
    loneliness: ['孤独', '寂寞', '孤立', 'lonely', 'isolated', 'alone'],
    stress: ['压力', '紧张', '疲惫', '不堪重负', 'stressed', 'overwhelmed', 'burnout'],
    hope: ['希望', '乐观', '期待', '相信', 'hope', 'optimistic', 'believe'],
    gratitude: ['感激', '感恩', '感谢', 'grateful', 'thankful', 'appreciate'],
  };

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    let count = 0;
    for (const kw of keywords) {
      if (normalizedText.includes(kw.toLowerCase())) count++;
    }
    if (count > 0) themes[theme] = count;
  }

  // Sort by frequency
  return Object.entries(themes)
    .sort((a, b) => b[1] - a[1])
    .map(([theme, count]) => ({ theme, occurrences: count }));
}

module.exports = {
  analyzeSentiment,
  analyzeConversation,
  extractEmotionalThemes,
  POSITIVE_KEYWORDS,
  NEGATIVE_KEYWORDS,
  CRISIS_KEYWORDS,
};
