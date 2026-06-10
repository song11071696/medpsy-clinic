/**
 * Emotion Analysis Module
 * Provides multi-dimensional emotion detection, sentiment analysis,
 * and emotional trajectory tracking for mental health conversations
 */

class EmotionAnalyzer {
  constructor(options = {}) {
    this.sensitivity = options.sensitivity || 0.7;
    this.language = options.language || 'zh';
    this.emotionLexicon = this._buildEmotionLexicon();
    this.intensityModifiers = this._buildIntensityModifiers();
  }

  /**
   * Build comprehensive emotion lexicon with weights
   * @returns {Object} Emotion lexicon mapping
   */
  _buildEmotionLexicon() {
    return {
      joy: {
        zh: ['开心', '快乐', '高兴', '幸福', '愉快', '兴奋', '满足', '喜悦', '欢乐', '欣喜',
             '欣慰', '满意', '舒适', '放松', '轻松', '自在', '乐观', '积极', '阳光', '温暖'],
        en: ['happy', 'joy', 'glad', 'excited', 'delighted', 'pleased', 'cheerful', 'wonderful',
             'fantastic', 'great', 'love', 'amazing', 'beautiful', 'perfect', 'grateful'],
        weight: 1.0,
        valence: 1.0,
      },
      sadness: {
        zh: ['难过', '伤心', '悲伤', '痛苦', '沮丧', '失落', '失望', '绝望', '心痛', '哀伤',
             '忧伤', '悲痛', '凄凉', '凄惨', '悲哀', '难受', '不开心', '郁闷', '消沉', '颓废'],
        en: ['sad', 'unhappy', 'depressed', 'miserable', 'heartbroken', 'grief', 'sorrow',
             'disappointed', 'lonely', 'hopeless', 'crying', 'tears', 'painful', 'hurt'],
        weight: 1.0,
        valence: -1.0,
      },
      anxiety: {
        zh: ['焦虑', '紧张', '担心', '害怕', '恐惧', '不安', '恐慌', '忧虑', '忐忑', '惶恐',
             '心慌', '发慌', '慌张', '惊慌', '畏惧', '胆怯', '惊恐', '惊吓', '毛骨悚然', '不寒而栗'],
        en: ['anxious', 'worried', 'nervous', 'afraid', 'scared', 'panic', 'fear', 'terrified',
             'uneasy', 'restless', 'tense', 'stressed', 'overwhelmed', 'dread', 'phobia'],
        weight: 1.2,
        valence: -0.8,
      },
      anger: {
        zh: ['生气', '愤怒', '恼火', '烦躁', '暴躁', '气愤', '恼怒', '怨恨', '恨', '不满',
             '委屈', '憋屈', '窝火', '火大', '发火', '暴怒', '怒火', '愤慨', '深恶痛绝', '痛恨'],
        en: ['angry', 'furious', 'mad', 'irritated', 'annoyed', 'frustrated', 'rage',
             'outraged', 'hostile', 'resentful', 'bitter', 'hate', 'livid', 'enraged'],
        weight: 1.1,
        valence: -0.9,
      },
      confusion: {
        zh: ['困惑', '迷茫', '疑惑', '不解', '茫然', '迷失', '不知所措', '纠结', '矛盾',
             '犹豫', '徘徊', '彷徨', '无所适从', '一头雾水', '摸不着头脑', '晕头转向'],
        en: ['confused', 'lost', 'puzzled', 'uncertain', 'unclear', 'bewildered', 'perplexed',
             'mixed up', 'don\'t understand', 'not sure', 'torn', 'indecisive'],
        weight: 0.8,
        valence: -0.4,
      },
      hope: {
        zh: ['希望', '期待', '盼望', '渴望', '向往', '憧憬', '企盼', '期盼', '指望',
             '展望', '信心', '相信', '信任', '乐观', '积极', '进取', '上进', '努力'],
        en: ['hope', 'wish', 'expect', 'desire', 'aspire', 'believe', 'trust', 'faith',
             'optimistic', 'positive', 'looking forward', 'determined', 'motivated'],
        weight: 0.9,
        valence: 0.7,
      },
      gratitude: {
        zh: ['感谢', '感恩', '感激', '谢谢', '多谢', '谢意', '铭记', '珍惜', '知足'],
        en: ['grateful', 'thankful', 'appreciate', 'thanks', 'blessed', 'indebted',
             'obliged', 'recognize', 'value'],
        weight: 0.8,
        valence: 0.8,
      },
      apathy: {
        zh: ['无所谓', '不在乎', '不在乎了', '麻木', '冷漠', '淡漠', '无感', '没感觉',
             '行尸走肉', '空虚', '无聊', '没意思', '没有意义', '不想', '算了'],
        en: ['apathetic', 'indifferent', 'numb', 'empty', 'nothing matters', 'don\'t care',
             'whatever', 'bored', 'meaningless', 'pointless', 'useless'],
        weight: 1.0,
        valence: -0.6,
      },
    };
  }

  /**
   * Build intensity modifiers for emotion scoring
   * @returns {Object} Intensity modifier patterns
   */
  _buildIntensityModifiers() {
    return {
      amplifier: {
        zh: ['非常', '特别', '极其', '十分', '万分', '太', '超级', '格外', '异常', '无比',
             '简直', '实在', '确实', '真的', '真的很', '越来越', '越来越越'],
        en: ['very', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely',
             'really', 'so', 'utterly', 'deeply', 'terribly', 'awfully'],
        multiplier: 1.5,
      },
      diminisher: {
        zh: ['有点', '稍微', '略微', '一些', '一点', '些许', '轻微', '不太', '不怎么', '没那么'],
        en: ['slightly', 'somewhat', 'a bit', 'a little', 'kind of', 'sort of',
             'mildly', 'not very', 'not really', 'barely'],
        multiplier: 0.5,
      },
      negator: {
        zh: ['不', '没', '没有', '不是', '别', '莫', '未', '非', '无', '勿'],
        en: ['not', 'no', 'never', 'neither', 'nor', 'don\'t', 'doesn\'t', 'didn\'t',
             'won\'t', 'can\'t', 'isn\'t', 'aren\'t'],
        multiplier: -1.0,
      },
    };
  }

  /**
   * Analyze text for emotional content
   * @param {string} text - Input text to analyze
   * @returns {Object} Comprehensive emotion analysis result
   */
  analyze(text) {
    if (!text || typeof text !== 'string') {
      return this._emptyResult();
    }

    const normalizedText = text.trim().toLowerCase();
    if (normalizedText.length === 0) {
      return this._emptyResult();
    }

    const emotions = {};
    const detectedEmotions = [];
    let totalScore = 0;

    // Analyze each emotion category
    for (const [emotion, config] of Object.entries(this.emotionLexicon)) {
      const keywords = config[this.language] || config.en || [];
      let emotionScore = 0;
      const matchedWords = [];

      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        // Count occurrences
        let index = 0;
        let count = 0;
        while ((index = normalizedText.indexOf(keywordLower, index)) !== -1) {
          count++;
          index += keywordLower.length;
        }

        if (count > 0) {
          // Apply intensity modifiers based on surrounding context
          const contextMultiplier = this._getContextMultiplier(normalizedText, keywordLower);
          const wordScore = count * config.weight * contextMultiplier;
          emotionScore += wordScore;
          matchedWords.push({ word: keyword, count, score: wordScore });
        }
      }

      if (emotionScore > 0) {
        const normalizedScore = Math.min(1.0, emotionScore / 10);
        emotions[emotion] = {
          score: normalizedScore,
          rawScore: emotionScore,
          valence: config.valence,
          matchedWords: matchedWords.map(m => m.word),
        };
        totalScore += normalizedScore;

        detectedEmotions.push({
          name: emotion,
          score: normalizedScore,
          valence: config.valence,
        });
      }
    }

    // Normalize scores to sum to 1.0
    if (totalScore > 0) {
      for (const emotion of Object.values(emotions)) {
        emotion.normalizedScore = emotion.score / totalScore;
      }
    }

    // Sort detected emotions by score
    detectedEmotions.sort((a, b) => b.score - a.score);

    // Calculate overall sentiment
    const sentiment = this._calculateSentiment(emotions);

    // Determine emotional complexity
    const complexity = this._calculateComplexity(emotions);

    // Generate emotional state description
    const description = this._generateDescription(detectedEmotions, sentiment);

    return {
      primaryEmotion: detectedEmotions[0] || null,
      emotions,
      detectedEmotions,
      sentiment,
      complexity,
      description,
      textLength: text.length,
      emotionalIntensity: this._calculateIntensity(emotions),
      riskIndicators: this._checkRiskIndicators(text, emotions),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get context multiplier for intensity modifiers
   * @param {string} text - Full text
   * @param {string} keyword - Matched keyword
   * @returns {number} Context multiplier
   */
  _getContextMultiplier(text, keyword) {
    const index = text.indexOf(keyword);
    if (index === -1) return 1.0;

    const windowSize = 15;
    const start = Math.max(0, index - windowSize);
    const end = Math.min(text.length, index + keyword.length + windowSize);
    const context = text.substring(start, end);

    let multiplier = 1.0;

    // Check for amplifiers
    for (const amp of this.intensityModifiers.amplifier[this.language] || []) {
      if (context.includes(amp)) {
        multiplier *= this.intensityModifiers.amplifier.multiplier;
        break;
      }
    }

    // Check for diminishers
    for (const dim of this.intensityModifiers.diminisher[this.language] || []) {
      if (context.includes(dim)) {
        multiplier *= this.intensityModifiers.diminisher.multiplier;
        break;
      }
    }

    // Check for negators
    for (const neg of this.intensityModifiers.negator[this.language] || []) {
      if (context.includes(neg)) {
        multiplier *= this.intensityModifiers.negator.multiplier;
        break;
      }
    }

    return multiplier;
  }

  /**
   * Calculate overall sentiment score
   * @param {Object} emotions - Detected emotions with scores
   * @returns {Object} Sentiment analysis
   */
  _calculateSentiment(emotions) {
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    for (const emotion of Object.values(emotions)) {
      if (emotion.valence > 0.1) {
        positiveScore += emotion.score * emotion.valence;
      } else if (emotion.valence < -0.1) {
        negativeScore += emotion.score * Math.abs(emotion.valence);
      } else {
        neutralScore += emotion.score;
      }
    }

    const total = positiveScore + negativeScore + neutralScore;
    if (total === 0) {
      return { label: 'neutral', score: 0, positive: 0, negative: 0, neutral: 1 };
    }

    const normalizedPositive = positiveScore / total;
    const normalizedNegative = negativeScore / total;
    const overallScore = (positiveScore - negativeScore) / total;

    let label;
    if (overallScore > 0.3) label = 'positive';
    else if (overallScore < -0.3) label = 'negative';
    else label = 'mixed';

    return {
      label,
      score: Math.round(overallScore * 100) / 100,
      positive: Math.round(normalizedPositive * 100) / 100,
      negative: Math.round(normalizedNegative * 100) / 100,
      neutral: Math.round((1 - normalizedPositive - normalizedNegative) * 100) / 100,
    };
  }

  /**
   * Calculate emotional complexity (how many emotions are present)
   * @param {Object} emotions - Detected emotions
   * @returns {Object} Complexity metrics
   */
  _calculateComplexity(emotions) {
    const emotionCount = Object.keys(emotions).length;
    const scores = Object.values(emotions).map(e => e.normalizedScore || 0);
    const maxScore = Math.max(...scores, 0);
    const entropy = scores.reduce((sum, s) => {
      if (s > 0) return sum - s * Math.log2(s);
      return sum;
    }, 0);

    let level;
    if (emotionCount <= 1) level = 'simple';
    else if (emotionCount <= 3) level = 'moderate';
    else level = 'complex';

    return {
      level,
      emotionCount,
      entropy: Math.round(entropy * 100) / 100,
      dominance: Math.round(maxScore * 100) / 100,
    };
  }

  /**
   * Calculate overall emotional intensity
   * @param {Object} emotions - Detected emotions
   * @returns {number} Intensity score 0-1
   */
  _calculateIntensity(emotions) {
    const scores = Object.values(emotions).map(e => e.score || 0);
    if (scores.length === 0) return 0;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.min(1.0, Math.round(avg * 100) / 100);
  }

  /**
   * Check for risk indicators in text
   * @param {string} text - Input text
   * @param {Object} emotions - Detected emotions
   * @returns {Array} Risk indicators
   */
  _checkRiskIndicators(text, emotions) {
    const indicators = [];
    const textLower = text.toLowerCase();

    // Severe distress patterns
    const severePatterns = {
      zh: ['不想活', '自杀', '轻生', '想死', '结束生命', '活不下去', '没有意义',
           '自残', '割', '跳楼', '上吊', '服毒', '遗书', '告别'],
      en: ['suicide', 'kill myself', 'want to die', 'end my life', 'self-harm',
           'cutting', 'overdose', 'no reason to live', 'goodbye forever', 'end it all'],
    };

    for (const pattern of (severePatterns[this.language] || severePatterns.en)) {
      if (textLower.includes(pattern.toLowerCase())) {
        indicators.push({
          type: 'severe_distress',
          pattern,
          severity: 'critical',
          message: '检测到严重心理危机信号，建议立即寻求专业帮助',
        });
      }
    }

    // Elevated distress patterns
    const elevatedPatterns = {
      zh: ['撑不下去', '受不了', '快要崩溃', '坚持不住', '无法忍受', '绝望',
           '无助', '走投无路', '进退两难', '看不到希望', '没有出路'],
      en: ['can\'t take it', 'breaking down', 'falling apart', 'no way out',
           'giving up', 'can\'t cope', 'overwhelmed', 'desperate', 'trapped'],
    };

    for (const pattern of (elevatedPatterns[this.language] || elevatedPatterns.en)) {
      if (textLower.includes(pattern.toLowerCase())) {
        indicators.push({
          type: 'elevated_distress',
          pattern,
          severity: 'high',
          message: '检测到较高心理压力，建议关注心理健康状况',
        });
      }
    }

    // Check anxiety score
    if (emotions.anxiety && emotions.anxiety.score > 0.7) {
      indicators.push({
        type: 'high_anxiety',
        severity: 'moderate',
        score: emotions.anxiety.score,
        message: '焦虑情绪水平较高，建议进行放松练习',
      });
    }

    // Check sadness score
    if (emotions.sadness && emotions.sadness.score > 0.7) {
      indicators.push({
        type: 'high_sadness',
        severity: 'moderate',
        score: emotions.sadness.score,
        message: '悲伤情绪水平较高，建议寻求支持',
      });
    }

    return indicators;
  }

  /**
   * Generate human-readable description of emotional state
   * @param {Array} detectedEmotions - Sorted list of detected emotions
   * @param {Object} sentiment - Overall sentiment
   * @returns {string} Description text
   */
  _generateDescription(detectedEmotions, sentiment) {
    if (detectedEmotions.length === 0) {
      return '未检测到明显情绪特征，表达较为中性。';
    }

    const emotionNames = {
      zh: {
        joy: '快乐', sadness: '悲伤', anxiety: '焦虑', anger: '愤怒',
        confusion: '困惑', hope: '希望', gratitude: '感恩', apathy: '冷漠',
      },
      en: {
        joy: 'joy', sadness: 'sadness', anxiety: 'anxiety', anger: 'anger',
        confusion: 'confusion', hope: 'hope', gratitude: 'gratitude', apathy: 'apathy',
      },
    };

    const names = emotionNames[this.language] || emotionNames.en;
    const primary = detectedEmotions[0];
    const primaryName = names[primary.name] || primary.name;

    let desc = `主要情绪为${primaryName}（强度：${Math.round(primary.score * 100)}%）`;

    if (detectedEmotions.length > 1) {
      const secondary = detectedEmotions[1];
      const secondaryName = names[secondary.name] || secondary.name;
      desc += `，同时伴有${secondaryName}（${Math.round(secondary.score * 100)}%）`;
    }

    desc += `。整体情绪倾向为${sentiment.label === 'positive' ? '积极' :
      sentiment.label === 'negative' ? '消极' : '复杂混合'}。`;

    return desc;
  }

  /**
   * Return empty analysis result
   * @returns {Object} Empty result
   */
  _emptyResult() {
    return {
      primaryEmotion: null,
      emotions: {},
      detectedEmotions: [],
      sentiment: { label: 'neutral', score: 0, positive: 0, negative: 0, neutral: 1 },
      complexity: { level: 'simple', emotionCount: 0, entropy: 0, dominance: 0 },
      description: '输入为空，无法分析情绪。',
      textLength: 0,
      emotionalIntensity: 0,
      riskIndicators: [],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Emotion History Tracker
 * Tracks emotional states over time and identifies patterns
 */
class EmotionHistory {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || 1000;
    this.entries = [];
    this.analyzer = new EmotionAnalyzer(options);
  }

  /**
   * Record a new emotion entry
   * @param {string} text - Source text
   * @param {string} userId - User identifier
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Recorded entry
   */
  record(text, userId = 'default', metadata = {}) {
    const analysis = this.analyzer.analyze(text);
    const entry = {
      id: this._generateId(),
      userId,
      text: text.substring(0, 500), // Truncate for storage
      analysis,
      metadata,
      timestamp: new Date().toISOString(),
    };

    this.entries.push(entry);

    // Trim history if needed
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    return entry;
  }

  /**
   * Get emotion trend over time
   * @param {string} userId - User to analyze
   * @param {number} days - Number of days to look back
   * @returns {Object} Trend analysis
   */
  getTrend(userId = 'default', days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const userEntries = this.entries.filter(e =>
      e.userId === userId && new Date(e.timestamp) >= cutoff
    );

    if (userEntries.length === 0) {
      return { trend: 'insufficient_data', entries: 0, data: [] };
    }

    // Group by day
    const dailyData = {};
    for (const entry of userEntries) {
      const day = entry.timestamp.substring(0, 10);
      if (!dailyData[day]) dailyData[day] = [];
      dailyData[day].push(entry.analysis);
    }

    // Calculate daily averages
    const trendData = Object.entries(dailyData).map(([day, analyses]) => {
      const avgSentiment = analyses.reduce((sum, a) => sum + a.sentiment.score, 0) / analyses.length;
      const avgIntensity = analyses.reduce((sum, a) => sum + a.emotionalIntensity, 0) / analyses.length;
      return { day, sentiment: avgSentiment, intensity: avgIntensity, count: analyses.length };
    }).sort((a, b) => a.day.localeCompare(b.day));

    // Calculate overall trend direction
    const trendDirection = this._calculateTrendDirection(trendData);

    return {
      trend: trendDirection,
      entries: userEntries.length,
      days: Object.keys(dailyData).length,
      data: trendData,
      summary: this._summarizeTrend(trendData, trendDirection),
    };
  }

  /**
   * Get most common emotions for a user
   * @param {string} userId - User identifier
   * @returns {Array} Ranked emotions
   */
  getTopEmotions(userId = 'default') {
    const userEntries = this.entries.filter(e => e.userId === userId);
    const emotionCounts = {};

    for (const entry of userEntries) {
      for (const emotion of entry.analysis.detectedEmotions) {
        if (!emotionCounts[emotion.name]) {
          emotionCounts[emotion.name] = { total: 0, count: 0, avgScore: 0 };
        }
        emotionCounts[emotion.name].total += emotion.score;
        emotionCounts[emotion.name].count++;
      }
    }

    return Object.entries(emotionCounts)
      .map(([name, data]) => ({
        name,
        frequency: data.count,
        averageScore: Math.round((data.total / data.count) * 100) / 100,
        percentage: Math.round((data.count / userEntries.length) * 100),
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  _generateId() {
    return `emo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  _calculateTrendDirection(trendData) {
    if (trendData.length < 2) return 'stable';
    const recent = trendData.slice(-3);
    const older = trendData.slice(0, 3);
    const recentAvg = recent.reduce((s, d) => s + d.sentiment, 0) / recent.length;
    const olderAvg = older.reduce((s, d) => s + d.sentiment, 0) / older.length;
    const diff = recentAvg - olderAvg;
    if (diff > 0.2) return 'improving';
    if (diff < -0.2) return 'declining';
    return 'stable';
  }

  _summarizeTrend(trendData, direction) {
    const avgSentiment = trendData.reduce((s, d) => s + d.sentiment, 0) / trendData.length;
    const summaries = {
      improving: '情绪状态呈改善趋势，整体向好发展。',
      declining: '情绪状态呈下降趋势，建议关注并寻求支持。',
      stable: '情绪状态相对稳定，无明显波动。',
    };
    return `${summaries[direction]} 平均情绪得分：${Math.round(avgSentiment * 100) / 100}`;
  }
}

module.exports = { EmotionAnalyzer, EmotionHistory };
