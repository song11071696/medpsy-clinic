/**
 * @deprecated 热线数据已迁移到 src/services/crisis-service.js 的 CRISIS_HOTLINES。
 * Crisis Intervention Module - MedPsy Clinic
 * 危机干预机制 + 紧急热线转介
 * 
 * 实时监测用户对话中的危机信号
 * 自动触发紧急干预流程和热线转介
 */

const CRISIS_LEVELS = {
  NONE: 'none',
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const HOTLINES = {
  china: { name: '全国心理援助热线', phone: '400-161-9995', hours: '24/7' },
  beijing: { name: '北京心理危机研究与干预中心', phone: '010-82951332', hours: '24/7' },
  hope: { name: '希望24热线', phone: '400-161-9995', hours: '24/7' },
  suicide_prevention: { name: '生命热线', phone: '400-821-1215', hours: '24/7' },
  youth: { name: '青少年心理热线', phone: '12355', hours: '工作日 9:00-17:00' },
};

const CRISIS_KEYWORDS = {
  critical: [
    '自杀', '不想活', '活不下去', '结束生命', '跳楼', '割腕',
    'suicide', 'kill myself', 'end my life', 'want to die',
  ],
  high: [
    '遗书', '告别', '最后一次', '解脱', '没有希望', '生不如死',
    'goodbye forever', 'no reason to live', 'better off dead',
  ],
  moderate: [
    '抑郁', '崩溃', '绝望', '痛苦', '孤独', '无意义',
    'hopeless', 'worthless', 'cannot go on', 'breaking down',
  ],
  low: [
    '焦虑', '失眠', '压力大', '情绪低落', '无助',
    'anxious', 'insomnia', 'overwhelmed', 'stressed',
  ],
};

class CrisisIntervention {
  constructor(config = {}) {
    this.config = {
      autoEscalateToHuman: config.autoEscalateToHuman !== false,
      enableHotlineReferral: config.enableHotlineReferral !== false,
      logCrises: config.logCrises !== false,
      region: config.region || 'china',
      ...config,
    };
    this.crisisHistory = [];
  }

  /**
   * 分析对话内容的危机等级
   */
  assessCrisisLevel(text) {
    if (!text) return { level: CRISIS_LEVELS.NONE, score: 0, keywords: [] };

    const lowerText = text.toLowerCase();
    let maxLevel = CRISIS_LEVELS.NONE;
    let maxScore = 0;
    const matchedKeywords = [];

    const levelScores = { critical: 1.0, high: 0.8, moderate: 0.5, low: 0.3 };

    for (const [level, keywords] of Object.entries(CRISIS_KEYWORDS)) {
      for (const keyword of keywords) {
        const regex = new RegExp(keyword, 'i');
        if (regex.test(lowerText)) {
          matchedKeywords.push({ keyword, level });
          if (levelScores[level] > maxScore) {
            maxScore = levelScores[level];
            maxLevel = level;
          }
        }
      }
    }

    return {
      level: maxLevel,
      score: maxScore,
      keywords: matchedKeywords,
      requiresIntervention: maxLevel === CRISIS_LEVELS.HIGH || maxLevel === CRISIS_LEVELS.CRITICAL,
    };
  }

  /**
   * 处理危机事件 — 主入口
   */
  async handleCrisis(text, userId) {
    const assessment = this.assessCrisisLevel(text);

    if (assessment.level === CRISIS_LEVELS.NONE || assessment.level === CRISIS_LEVELS.LOW) {
      return { handled: false, assessment };
    }

    const intervention = {
      userId,
      assessment,
      timestamp: Date.now(),
      actions: [],
    };

    if (assessment.requiresIntervention) {
      intervention.actions.push('immediate_response');
      intervention.response = this._getCrisisResponse(assessment.level);
    }

    if (this.config.enableHotlineReferral && assessment.level !== CRISIS_LEVELS.LOW) {
      intervention.actions.push('hotline_referral');
      intervention.hotlines = this._getHotlines();
    }

    if (this.config.autoEscalateToHuman && assessment.level === CRISIS_LEVELS.CRITICAL) {
      intervention.actions.push('escalate_to_human');
      intervention.escalation = {
        priority: 'urgent',
        reason: 'Critical crisis keywords detected',
        keywords: assessment.keywords.map(k => k.keyword),
      };
    }

    if (this.config.logCrises) {
      this.crisisHistory.push(intervention);
    }

    return { handled: true, intervention };
  }

  /**
   * 获取危机响应文案
   */
  _getCrisisResponse(level) {
    const responses = {
      critical: [
        '我非常关心您现在的安全。您现在的感受很重要，您并不孤单。',
        '我强烈建议您立即联系专业的心理危机干预热线，他们可以提供即时帮助：',
        '如果您现在处于危险中，请拨打 120 急救电话。',
      ],
      high: [
        '我能感受到您正在经历很大的痛苦。请知道，寻求帮助是勇敢的行为。',
        '以下热线可以为您提供专业支持，他们 24 小时在线：',
      ],
      moderate: [
        '听起来您正在经历一些困难的情绪。这些感受是可以被理解和处理的。',
        '如果您需要专业帮助，以下资源可以为您提供支持：',
      ],
    };
    return responses[level] || responses.moderate;
  }

  /**
   * 获取紧急热线列表
   */
  _getHotlines() {
    const region = this.config.region;
    return Object.entries(HOTLINES)
      .filter(([key]) => key === region || key === 'hope')
      .map(([key, info]) => ({ id: key, ...info }));
  }

  getStats() {
    const byLevel = {};
    for (const entry of this.crisisHistory) {
      const level = entry.assessment.level;
      byLevel[level] = (byLevel[level] || 0) + 1;
    }
    return { total: this.crisisHistory.length, byLevel };
  }
}

module.exports = { CrisisIntervention, CRISIS_LEVELS, HOTLINES };
