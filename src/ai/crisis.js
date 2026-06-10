/**
 * @deprecated 已合并到 src/services/crisis-service.js，请使用 CrisisService。
 * Crisis Detection Module (Simplified)
 *
 * Lightweight crisis detection for real-time monitoring.
 * Focuses on keyword-based detection with severity scoring
 * and automatic referral mechanisms.
 */

// ─── Crisis Keyword Database ──────────────────────────────

const CRISIS_CATEGORIES = {
  suicidal_ideation: {
    severity: 'critical',
    keywords: {
      critical: [
        '想自杀', '想死', '不想活了', '活不下去', '结束生命', '自我了断',
        '遗书', '告别世界', '最后一次', '不想存在', '消失掉',
        '活着没意思', '活着没有意义', '死了算了', '不如死了',
        'suicide', 'kill myself', 'end my life', 'want to die',
      ],
      high: [
        '不想活', '想消失', '希望不存在', '活着太累', '活够了',
        '没有人会在意', '没有人在乎', '解脱', '一了百了',
        'don\'t want to live', 'wish I was dead', 'better off dead',
      ],
      medium: [
        '活着有什么意义', '为什么还要活着', '日子过不下去',
        '看不到希望', '没有未来', '永远都不会好',
        'what\'s the point', 'no reason to live',
      ],
    },
  },
  self_harm: {
    severity: 'high',
    keywords: {
      critical: [
        '割腕', '自残', '伤害自己', '伤害自己', '撞墙',
        'self-harm', 'cut myself', 'hurt myself',
      ],
      high: [
        '想打自己', '想撞', '想烫', '想划',
        'scratching', 'burning', 'hitting myself',
      ],
      medium: [
        '惩罚自己', '自虐', '受虐',
        'punish myself',
      ],
    },
  },
  hopelessness: {
    severity: 'high',
    keywords: {
      critical: [
        '万念俱灰', '走投无路', '没有出路', '无路可走',
        'completely hopeless', 'no way out', 'trapped',
      ],
      high: [
        '绝望', '没有希望', '永远不会好', '改变不了',
        'hopeless', 'give up', 'no hope',
      ],
      medium: [
        '看不到未来', '前途暗淡', '没有方向',
        'no future', 'dark ahead',
      ],
    },
  },
  substance_abuse: {
    severity: 'moderate',
    keywords: {
      high: [
        '过量服药', '嗑药', '酗酒', '吸毒',
        'overdose', 'drug abuse', 'alcohol abuse',
      ],
      medium: [
        '吃很多药', '喝很多酒', '靠药物入睡',
        'pills', 'drinking too much',
      ],
    },
  },
  violence: {
    severity: 'high',
    keywords: {
      critical: [
        '杀人', '报复', '同归于尽',
        'kill someone', 'revenge', 'make them pay',
      ],
      high: [
        '暴力', '打架', '伤害别人',
        'violent', 'attack',
      ],
    },
  },
};

// ─── Referral Resources ──────────────────────────────────

const REFERRAL_RESOURCES = {
  zh: {
    hotline: {
      name: '全国24小时心理援助热线',
      number: '400-161-9995',
      description: '免费、保密的心理危机干预热线',
    },
    crisis_line: {
      name: '北京心理危机研究与干预中心',
      number: '010-82951332',
      description: '24小时心理危机干预热线',
    },
    emergency: {
      name: '紧急救援',
      number: '120',
      description: '如有生命危险请立即拨打',
    },
    text_line: {
      name: '希望24热线',
      number: '400-161-9995',
      description: '全天候心理援助',
    },
  },
  en: {
    hotline: {
      name: 'National Suicide Prevention Lifeline',
      number: '988',
      description: 'Free, confidential 24/7 support',
    },
    crisis_text: {
      name: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      description: 'Free crisis counseling via text',
    },
    emergency: {
      name: 'Emergency Services',
      number: '911',
      description: 'Call if in immediate danger',
    },
  },
};

// ─── Severity Levels ─────────────────────────────────────

const SEVERITY_RESPONSE = {
  critical: {
    level: 1,
    label: '紧急',
    action: 'immediate_intervention',
    description: '存在即时生命危险，需要立即干预',
    autoEscalate: true,
    responseTime: 'immediate',
  },
  high: {
    level: 2,
    label: '高危',
    action: 'urgent_referral',
    description: '存在严重心理危机风险，需要尽快评估',
    autoEscalate: true,
    responseTime: 'within_1_hour',
  },
  moderate: {
    level: 3,
    label: '中等',
    action: 'scheduled_referral',
    description: '存在心理困扰，建议安排专业评估',
    autoEscalate: false,
    responseTime: 'within_24_hours',
  },
  low: {
    level: 4,
    label: '低',
    action: 'monitoring',
    description: '需要持续关注和监测',
    autoEscalate: false,
    responseTime: 'routine',
  },
};

// ─── Crisis Detector Class ───────────────────────────────

class CrisisDetector {
  constructor(options = {}) {
    this.sensitivity = options.sensitivity || 'high';
    this.language = options.language || 'zh';
    this.alertHistory = [];
    this.maxHistorySize = options.maxHistorySize || 100;
    this.onAlert = options.onAlert || null;
  }

  /**
   * Analyze text for crisis indicators
   * @param {string} text - Text to analyze
   * @returns {Object} Detection result
   */
  detect(text) {
    if (!text || typeof text !== 'string') {
      return { crisis: false, severity: 'none', matches: [] };
    }

    const normalizedText = text.toLowerCase();
    const allMatches = [];
    let maxSeverity = 'none';
    const severityOrder = ['critical', 'high', 'moderate', 'low', 'none'];

    // Check each category
    for (const [category, config] of Object.entries(CRISIS_CATEGORIES)) {
      for (const [level, keywords] of Object.entries(config.keywords)) {
        for (const keyword of keywords) {
          if (normalizedText.includes(keyword.toLowerCase())) {
            allMatches.push({
              category,
              keyword,
              level,
              categorySeverity: config.severity,
            });

            // Update max severity
            if (severityOrder.indexOf(level) < severityOrder.indexOf(maxSeverity)) {
              maxSeverity = level;
            }
          }
        }
      }
    }

    const isCrisis = allMatches.length > 0;
    const result = {
      crisis: isCrisis,
      severity: maxSeverity,
      matchCount: allMatches.length,
      matches: allMatches,
      categories: [...new Set(allMatches.map(m => m.category))],
      timestamp: new Date().toISOString(),
    };

    // Generate response if crisis detected
    if (isCrisis) {
      result.response = this._generateResponse(maxSeverity, allMatches);
      result.referrals = this._getReferrals(maxSeverity);

      // Log alert
      this._logAlert(result);

      // Callback
      if (this.onAlert) {
        this.onAlert(result);
      }
    }

    return result;
  }

  /**
   * Analyze multiple messages in conversation
   */
  detectInConversation(messages) {
    const results = [];
    let hasCrisis = false;
    let maxSeverity = 'none';
    const severityOrder = ['critical', 'high', 'moderate', 'low', 'none'];

    for (const msg of messages) {
      const result = this.detect(msg);
      results.push(result);

      if (result.crisis) {
        hasCrisis = true;
        if (severityOrder.indexOf(result.severity) < severityOrder.indexOf(maxSeverity)) {
          maxSeverity = result.severity;
        }
      }
    }

    return {
      crisis: hasCrisis,
      severity: maxSeverity,
      messageResults: results,
      crisisMessages: results.filter(r => r.crisis).length,
      totalMessages: messages.length,
    };
  }

  /**
   * Generate appropriate response based on severity
   */
  _generateResponse(severity, matches) {
    const severityInfo = SEVERITY_RESPONSE[severity];
    if (!severityInfo) return null;

    const hasSuicidal = matches.some(m => m.category === 'suicidal_ideation');
    const hasSelfHarm = matches.some(m => m.category === 'self_harm');

    let message;
    if (severity === 'critical' && hasSuicidal) {
      message = this.language === 'zh'
        ? '我注意到您正在经历非常大的痛苦。您的安全是最重要的。请立即拨打心理援助热线 400-161-9995，专业人员24小时在线为您提供帮助。如果您正处于危险中，请拨打120。'
        : 'I notice you are going through tremendous pain. Your safety is what matters most. Please call the Suicide Prevention Lifeline at 988 right now. If you are in immediate danger, please call 911.';
    } else if (severity === 'critical' || severity === 'high') {
      message = this.language === 'zh'
        ? '我非常关心您现在的状态。您不需要独自面对这些。请考虑联系专业心理援助热线 400-161-9995，他们会为您提供支持。'
        : 'I am very concerned about how you are feeling. You don\'t have to face this alone. Please consider reaching out to the helpline at 988 for support.';
    } else {
      message = this.language === 'zh'
        ? '我注意到您可能正在经历一些困难。如果您愿意，可以拨打心理援助热线 400-161-9995 与专业人员交流。'
        : 'I notice you may be going through a difficult time. If you\'d like to talk to someone, the helpline at 988 is available.';
    }

    return {
      severity,
      severityLabel: severityInfo.label,
      message,
      action: severityInfo.action,
      autoEscalate: severityInfo.autoEscalate,
      responseTime: severityInfo.responseTime,
    };
  }

  /**
   * Get referral resources based on severity
   */
  _getReferrals(severity) {
    const resources = REFERRAL_RESOURCES[this.language] || REFERRAL_RESOURCES.zh;
    const referrals = [];

    // Always include hotline
    referrals.push(resources.hotline);

    // Critical: include emergency services
    if (severity === 'critical') {
      referrals.push(resources.emergency);
    }

    // Add text line if available
    if (resources.text_line) {
      referrals.push(resources.text_line);
    }

    return referrals;
  }

  /**
   * Log alert to history
   */
  _logAlert(result) {
    this.alertHistory.push({
      severity: result.severity,
      categories: result.categories,
      matchCount: result.matchCount,
      timestamp: result.timestamp,
    });

    // Trim history
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get detection statistics
   */
  getStats() {
    const bySeverity = {};
    const byCategory = {};

    for (const alert of this.alertHistory) {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      for (const cat of alert.categories) {
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }
    }

    return {
      totalAlerts: this.alertHistory.length,
      bySeverity,
      byCategory,
      recentAlerts: this.alertHistory.slice(-10),
    };
  }
}

module.exports = {
  CrisisDetector,
  CRISIS_CATEGORIES,
  REFERRAL_RESOURCES,
  SEVERITY_RESPONSE,
};
