/**
 * @deprecated 已合并到 src/services/crisis-service.js，请使用 CrisisService。
 * 危机检测模块
 * 检测用户是否存在自伤、自杀等危机状态
 */

const RISK_LEVELS = {
  NONE: 'none',
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const CRISIS_KEYWORDS = {
  suicidal: {
    critical: ['自杀', '不想活', '结束生命', 'suicide', 'kill myself', 'end my life', '不想活了', '活不下去'],
    high: ['遗书', '告别', '没有希望', '活着没意思', 'goodbye forever', 'no reason to live', '遗言'],
    moderate: ['痛苦', '活着好累', '太累了', '解脱', 'tired of living', 'want it to stop'],
    low: ['低落', '没有意义', 'lonely', 'hopeless', 'worthless']
  },
  selfHarm: {
    critical: ['割腕', '自伤', '自残', 'self-harm', 'cutting', 'overdose'],
    high: ['刀片', '伤害自己', 'hurt myself', 'burn myself'],
    moderate: ['撞墙', '打自己', 'hitting', 'scratching'],
    low: ['抓伤', '抠皮肤', 'picking skin']
  },
  violence: {
    critical: ['杀了他', '杀了她', '报复', 'murder', 'revenge killing'],
    high: ['打人', '攻击', 'hurt someone', 'attack'],
    moderate: ['愤怒', '怒火', 'furious', 'rage'],
    low: ['不满', '烦躁', 'irritated']
  }
};

const URGENCY_KEYWORDS = ['今天', '现在', '马上', 'today', 'now', 'tonight', '此刻', 'right now'];

class CrisisDetector {
  constructor(options = {}) {
    this.sensitivityLevel = options.sensitivityLevel || 'balanced'; // strict, balanced, lenient
    this.detections = [];
    this.maxDetections = options.maxDetections || 1000;
  }

  /**
   * 检测文本中的危机信号
   * @param {string} text - 输入文本
   * @param {Object} context - 上下文信息
   * @returns {Object} 检测结果
   */
  detect(text, context = {}) {
    if (!text || typeof text !== 'string') {
      throw new Error('输入文本必须是非空字符串');
    }

    const lowerText = text.toLowerCase();
    const matches = [];
    let highestRisk = RISK_LEVELS.NONE;

    // 扫描危机关键词
    for (const [category, levels] of Object.entries(CRISIS_KEYWORDS)) {
      for (const [level, keywords] of Object.entries(levels)) {
        for (const keyword of keywords) {
          if (lowerText.includes(keyword.toLowerCase())) {
            matches.push({ category, level, keyword });
            if (this._isHigherRisk(level, highestRisk)) {
              highestRisk = level;
            }
          }
        }
      }
    }

    // 检测紧迫性
    const hasUrgency = URGENCY_KEYWORDS.some(kw => lowerText.includes(kw.toLowerCase()));

    // 综合评估
    const riskScore = this._calculateRiskScore(matches, hasUrgency, context);
    const finalRiskLevel = this._determineRiskLevel(riskScore);
    const isCrisis = finalRiskLevel === RISK_LEVELS.CRITICAL || finalRiskLevel === RISK_LEVELS.HIGH;

    const result = {
      isCrisis,
      riskLevel: finalRiskLevel,
      riskScore,
      hasUrgency,
      matches,
      categories: [...new Set(matches.map(m => m.category))],
      immediateAction: isCrisis,
      recommendedResponse: this._getRecommendedResponse(finalRiskLevel, matches),
      resources: isCrisis ? this._getCrisisResources() : [],
      timestamp: new Date().toISOString(),
      detectionId: `CD-${Date.now()}`
    };

    this.detections.push(result);
    if (this.detections.length > this.maxDetections) this.detections.shift();

    return result;
  }

  /**
   * 判断风险等级是否更高
   */
  _isHigherRisk(level, current) {
    const order = { none: 0, low: 1, moderate: 2, high: 3, critical: 4 };
    return order[level] > order[current];
  }

  /**
   * 计算风险分数
   */
  _calculateRiskScore(matches, hasUrgency, context) {
    let score = 0;
    const weights = { critical: 40, high: 25, moderate: 15, low: 5 };

    for (const match of matches) {
      score += weights[match.level] || 0;
    }

    // 紧迫性加权
    if (hasUrgency) score *= 1.5;

    // 上下文加权
    if (context.previousAttempts) score *= 1.3;
    if (context.hasMeans) score *= 1.4;
    if (context.isolation) score *= 1.2;

    return Math.min(100, score);
  }

  /**
   * 确定风险等级
   */
  _determineRiskLevel(score) {
    const thresholds = {
      strict: { critical: 30, high: 20, moderate: 10, low: 5 },
      balanced: { critical: 50, high: 35, moderate: 20, low: 10 },
      lenient: { critical: 70, high: 50, moderate: 30, low: 15 }
    };
    const t = thresholds[this.sensitivityLevel] || thresholds.balanced;
    if (score >= t.critical) return RISK_LEVELS.CRITICAL;
    if (score >= t.high) return RISK_LEVELS.HIGH;
    if (score >= t.moderate) return RISK_LEVELS.MODERATE;
    if (score >= t.low) return RISK_LEVELS.LOW;
    return RISK_LEVELS.NONE;
  }

  /**
   * 获取建议响应
   */
  _getRecommendedResponse(riskLevel, matches) {
    const categories = [...new Set(matches.map(m => m.category))];
    const responses = {
      [RISK_LEVELS.CRITICAL]: '立即启动危机干预流程，联系紧急救援',
      [RISK_LEVELS.HIGH]: '优先安排心理危机评估，保持持续关注',
      [RISK_LEVELS.MODERATE]: '加强监测频次，安排专业评估',
      [RISK_LEVELS.LOW]: '记录并持续关注，下次会谈时跟进',
      [RISK_LEVELS.NONE]: '常规随访'
    };
    return {
      action: responses[riskLevel],
      categories,
      followUp: riskLevel !== RISK_LEVELS.NONE
    };
  }

  /**
   * 获取危机资源
   */
  _getCrisisResources() {
    return [
      { name: '全国心理援助热线', phone: '400-161-9995' },
      { name: '北京心理危机研究与干预中心', phone: '010-82951332' },
      { name: '生命热线', phone: '400-821-1215' },
      { name: '希望24热线', phone: '400-161-9995' }
    ];
  }

  /**
   * 获取检测历史
   */
  getHistory(limit = 50) {
    return this.detections.slice(-limit);
  }

  /**
   * 获取高风险检测统计
   */
  getHighRiskStats() {
    const highRisk = this.detections.filter(
      d => d.riskLevel === RISK_LEVELS.CRITICAL || d.riskLevel === RISK_LEVELS.HIGH
    );
    return {
      totalDetections: this.detections.length,
      highRiskCount: highRisk.length,
      recentHighRisk: highRisk.slice(-10)
    };
  }
}

module.exports = { CrisisDetector, RISK_LEVELS };
