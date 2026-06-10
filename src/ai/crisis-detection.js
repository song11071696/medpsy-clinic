/**
 * @deprecated 已合并到 src/services/crisis-service.js，请使用 CrisisService。
 * Crisis Detection Module
 * Real-time monitoring and detection of psychological crisis situations
 * Implements multi-level screening with escalation protocols
 */

class CrisisDetector {
  constructor(options = {}) {
    this.sensitivity = options.sensitivity || 'high';
    this.language = options.language || 'zh';
    this.alertHistory = [];
    this.escalationProtocols = this._buildEscalationProtocols();
    this.crisisPatterns = this._buildCrisisPatterns();
  }

  /**
   * Build crisis pattern database
   * @returns {Object} Crisis patterns by category
   */
  _buildCrisisPatterns() {
    return {
      suicidal_ideation: {
        zh: {
          critical: [
            '想自杀', '想死', '不想活了', '活不下去', '结束生命', '自我了断',
            '遗书', '告别世界', '最后一次', '不想存在', '消失掉',
            '活着没意思', '活着没有意义', '死了算了', '不如死了',
          ],
          high: [
            '不想活', '想消失', '希望不存在', '活着太累', '活够了',
            '没有意义', '没有价值', '不值得活着', '对世界没有留恋',
            '解脱', '一了百了', '解脱自己',
          ],
          moderate: [
            '太痛苦了', '看不到希望', '没有人关心', '一个人好累',
            '撑不下去', '无法继续', '没有出路', '走投无路',
            '快要崩溃', '感觉要疯了',
          ],
        },
        en: {
          critical: [
            'suicide', 'kill myself', 'want to die', 'end my life', 'end it all',
            'take my own life', 'no longer want to live', 'better off dead',
            'final goodbye', 'won\'t be here', 'last message',
          ],
          high: [
            'wish I was dead', 'wish I wasn\'t alive', 'don\'t want to exist',
            'can\'t go on living', 'no point in living', 'nothing to live for',
            'the world would be better without me', 'nobody would miss me',
            'tired of living', 'want to disappear forever',
          ],
          moderate: [
            'can\'t take it anymore', 'breaking point', 'giving up',
            'no way out', 'trapped', 'hopeless', 'desperate',
            'falling apart', 'losing my mind', 'can\'t cope',
          ],
        },
      },
      self_harm: {
        zh: {
          critical: [
            '割腕', '自残', '伤害自己', '割伤自己', '用刀割',
            '跳楼', '上吊', '服毒', '过量服药', '撞车',
          ],
          high: [
            '想割', '想伤害自己', '想打自己', '撞墙', '掐自己',
            '用烟头烫', '抓伤自己', '咬自己',
          ],
          moderate: [
            '控制不住', '想发泄', '想破坏', '砸东西', '摔东西',
          ],
        },
        en: {
          critical: [
            'cutting myself', 'self-harm', 'hurt myself', 'overdose',
            'jump off', 'hang myself', 'poison', 'cut my wrists',
          ],
          high: [
            'want to cut', 'want to hurt myself', 'hit myself',
            'bang my head', 'scratch myself', 'burn myself',
          ],
          moderate: [
            'can\'t control', 'want to vent', 'want to destroy',
            'break things', 'smash things',
          ],
        },
      },
      severe_distress: {
        zh: {
          critical: [
            '完全崩溃', '精神崩溃', '彻底绝望', '失去理智',
          ],
          high: [
            '快要疯了', '控制不住自己', '精神恍惚', '幻觉',
            '听到声音', '看到东西', '被害妄想', '有人要害我',
          ],
          moderate: [
            '极度焦虑', '极度恐惧', '恐慌发作', '呼吸困难',
            '心悸', '胸闷', '浑身发抖', '大汗淋漓',
          ],
        },
        en: {
          critical: [
            'complete breakdown', 'mental breakdown', 'lost my mind',
            'total despair',
          ],
          high: [
            'going crazy', 'can\'t control myself', 'hallucinations',
            'hearing voices', 'seeing things', 'paranoid', 'someone is after me',
          ],
          moderate: [
            'extreme anxiety', 'extreme fear', 'panic attack',
            'can\'t breathe', 'heart racing', 'chest tightness',
            'shaking all over', 'sweating profusely',
          ],
        },
      },
      abuse_violence: {
        zh: {
          critical: [
            '被打了', '家暴', '被虐待', '被性侵', '被强暴',
            '有人要杀我', '受到威胁', '被人跟踪',
          ],
          high: [
            '被人欺负', '被人骚扰', '不敢回家', '害怕某人',
            '被威胁', '被困住',
          ],
          moderate: [
            '不舒服的关系', '被迫做', '不被尊重', '被控制',
          ],
        },
        en: {
          critical: [
            'being beaten', 'domestic violence', 'being abused', 'sexually assaulted',
            'raped', 'someone wants to kill me', 'being threatened', 'being stalked',
          ],
          high: [
            'being bullied', 'being harassed', 'afraid to go home', 'afraid of someone',
            'being threatened', 'trapped',
          ],
          moderate: [
            'uncomfortable relationship', 'forced to do', 'not respected', 'being controlled',
          ],
        },
      },
    };
  }

  /**
   * Build escalation protocols
   * @returns {Object} Escalation protocols by severity
   */
  _buildEscalationProtocols() {
    return {
      critical: {
        level: 4,
        label: '紧急',
        labelEn: 'Critical',
        color: '#FF0000',
        responseTime: 'immediate',
        actions: [
          '立即联系危机干预热线',
          '通知紧急联系人',
          '评估是否需要报警或叫救护车',
          '保持对话，确保用户安全',
        ],
        hotlines: [
          { name: '全国24小时心理援助热线', number: '400-161-9995' },
          { name: '北京心理危机研究与干预中心', number: '010-82951332' },
          { name: '生命热线', number: '400-821-1215' },
          { name: '希望24热线', number: '400-161-9995' },
          { name: 'Emergency (US)', number: '988' },
          { name: 'Crisis Text Line', number: 'Text HOME to 741741' },
        ],
      },
      high: {
        level: 3,
        label: '高危',
        labelEn: 'High',
        color: '#FF6600',
        responseTime: 'within 1 hour',
        actions: [
          '建议联系心理咨询师或精神科医生',
          '提供危机热线号码',
          '评估安全状况',
          '制定安全计划',
        ],
        hotlines: [
          { name: '全国24小时心理援助热线', number: '400-161-9995' },
          { name: '生命热线', number: '400-821-1215' },
        ],
      },
      moderate: {
        level: 2,
        label: '中度',
        labelEn: 'Moderate',
        color: '#FFCC00',
        responseTime: 'within 24 hours',
        actions: [
          '建议预约心理咨询',
          '提供自助资源',
          '建议告知信任的人',
        ],
      },
      low: {
        level: 1,
        label: '低度',
        labelEn: 'Low',
        color: '#00CC00',
        responseTime: 'routine',
        actions: [
          '继续监测',
          '提供一般心理健康建议',
        ],
      },
    };
  }

  /**
   * Analyze text for crisis indicators
   * @param {string} text - Input text to analyze
   * @returns {Object} Crisis assessment result
   */
  analyze(text) {
    if (!text || typeof text !== 'string') {
      return this._emptyResult();
    }

    const normalizedText = text.trim().toLowerCase();
    if (normalizedText.length === 0) {
      return this._emptyResult();
    }

    const detections = [];
    let highestSeverity = 'low';
    const severityOrder = ['low', 'moderate', 'high', 'critical'];

    // Check each crisis category
    for (const [category, patterns] of Object.entries(this.crisisPatterns)) {
      const langPatterns = patterns[this.language] || patterns.en;

      for (const [severity, keywords] of Object.entries(langPatterns)) {
        for (const keyword of keywords) {
          if (normalizedText.includes(keyword.toLowerCase())) {
            detections.push({
              category,
              severity,
              keyword,
              matchedText: this._extractContext(normalizedText, keyword),
            });

            // Update highest severity
            if (severityOrder.indexOf(severity) > severityOrder.indexOf(highestSeverity)) {
              highestSeverity = severity;
            }
          }
        }
      }
    }

    // Determine if this is a crisis
    const isCrisis = highestSeverity === 'critical' || highestSeverity === 'high';
    const protocol = this.escalationProtocols[highestSeverity];

    // Generate alert if needed
    let alert = null;
    if (isCrisis) {
      alert = this._generateAlert(highestSeverity, detections, text);
    }

    // Generate response
    const response = this._generateResponse(highestSeverity, detections);

    return {
      isCrisis,
      severity: highestSeverity,
      severityLevel: protocol.level,
      detections: this._deduplicateDetections(detections),
      alert,
      response,
      protocol,
      recommendations: this._generateRecommendations(highestSeverity, detections),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract surrounding context for a matched keyword
   * @param {string} text - Full text
   * @param {string} keyword - Matched keyword
   * @returns {string} Context snippet
   */
  _extractContext(text, keyword) {
    const index = text.indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + keyword.length + 30);
    return (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
  }

  /**
   * Remove duplicate detections
   * @param {Array} detections - Raw detections
   * @returns {Array} Deduplicated detections
   */
  _deduplicateDetections(detections) {
    const seen = new Set();
    return detections.filter(d => {
      const key = `${d.category}:${d.severity}:${d.keyword}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Generate crisis alert
   * @param {string} severity - Severity level
   * @param {Array} detections - Crisis detections
   * @param {string} originalText - Original input text
   * @returns {Object} Crisis alert
   */
  _generateAlert(severity, detections, originalText) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      severity,
      categories: [...new Set(detections.map(d => d.category))],
      detectionCount: detections.length,
      summary: this._generateAlertSummary(severity, detections),
      requiredActions: this.escalationProtocols[severity].actions,
      hotlines: this.escalationProtocols[severity].hotlines || [],
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    this.alertHistory.push(alert);
    return alert;
  }

  /**
   * Generate alert summary
   * @param {string} severity - Severity level
   * @param {Array} detections - Detections
   * @returns {string} Summary text
   */
  _generateAlertSummary(severity, detections) {
    const categories = [...new Set(detections.map(d => d.category))];
    const categoryNames = {
      suicidal_ideation: '自杀意念',
      self_harm: '自伤行为',
      severe_distress: '严重心理困扰',
      abuse_violence: '虐待/暴力',
    };
    const categoryList = categories.map(c => categoryNames[c] || c).join('、');
    return `检测到${severity === 'critical' ? '紧急' : '高危'}心理危机信号（${categoryList}），需要立即关注和干预。`;
  }

  /**
   * Generate appropriate response based on severity
   * @param {string} severity - Severity level
   * @param {Array} detections - Detections
   * @returns {Object} Response recommendations
   */
  _generateResponse(severity, detections) {
    const responses = {
      critical: {
        message: '我注意到您可能正在经历非常大的痛苦。请记住，您不是一个人，有专业的帮助可以为您提供支持。',
        immediateAction: '请立即拨打24小时心理援助热线：400-161-9995，专业咨询师随时可以为您提供帮助。',
        tone: 'empathetic_urgent',
      },
      high: {
        message: '我能感受到您现在很痛苦。这些感受虽然很难受，但它们是可以被帮助和改善的。',
        immediateAction: '建议您联系专业的心理咨询师，或拨打心理援助热线：400-161-9995。',
        tone: 'empathetic_supportive',
      },
      moderate: {
        message: '听起来您最近承受着不少压力。关注自己的心理健康是很重要的一步。',
        immediateAction: '建议您尝试一些放松技巧，并考虑预约心理咨询。',
        tone: 'supportive',
      },
      low: {
        message: '感谢您分享您的感受。保持对自身心理状态的关注是非常好的习惯。',
        immediateAction: '如果您感到持续不适，建议咨询专业人士。',
        tone: 'warm',
      },
    };

    return responses[severity] || responses.low;
  }

  /**
   * Generate recommendations based on crisis level
   * @param {string} severity - Severity level
   * @param {Array} detections - Detections
   * @returns {Array} Recommendations
   */
  _generateRecommendations(severity, detections) {
    const recommendations = [];
    const categories = [...new Set(detections.map(d => d.category))];

    if (severity === 'critical') {
      recommendations.push({
        priority: 'urgent',
        action: '立即拨打24小时心理危机热线：400-161-9995',
        reason: '检测到紧急心理危机信号',
      });
      recommendations.push({
        priority: 'urgent',
        action: '如果身边有可以信任的人，请立即告知他们',
        reason: '社会支持在危机时刻至关重要',
      });
    }

    if (categories.includes('suicidal_ideation')) {
      recommendations.push({
        priority: severity === 'critical' ? 'urgent' : 'high',
        action: '与专业心理医生讨论您的想法和感受',
        reason: '自杀意念需要专业评估和干预',
      });
    }

    if (categories.includes('self_harm')) {
      recommendations.push({
        priority: 'high',
        action: '学习替代自伤的应对策略',
        reason: '有更安全的方式来应对痛苦情绪',
      });
    }

    if (categories.includes('severe_distress')) {
      recommendations.push({
        priority: 'medium',
        action: '尝试接地技术：5-4-3-2-1感官练习',
        reason: '帮助从极度痛苦中稳定下来',
      });
    }

    if (severity === 'moderate' || severity === 'low') {
      recommendations.push({
        priority: 'low',
        action: '定期进行心理健康自评',
        reason: '及早发现和干预心理健康问题',
      });
    }

    return recommendations;
  }

  /**
   * Get alert history
   * @param {number} limit - Maximum alerts to return
   * @returns {Array} Alert history
   */
  getAlertHistory(limit = 10) {
    return this.alertHistory
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Return empty result
   * @returns {Object} Empty crisis analysis result
   */
  _emptyResult() {
    return {
      isCrisis: false,
      severity: 'low',
      severityLevel: 1,
      detections: [],
      alert: null,
      response: this._generateResponse('low', []),
      protocol: this.escalationProtocols.low,
      recommendations: [],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Crisis Alert Manager
 * Manages and tracks crisis alerts with follow-up
 */
class CrisisAlert {
  constructor(options = {}) {
    this.detector = new CrisisDetector(options);
    this.activeAlerts = new Map();
    this.resolvedAlerts = [];
  }

  /**
   * Process a new message for crisis detection
   * @param {string} text - Input text
   * @param {string} userId - User identifier
   * @returns {Object} Processing result
   */
  processMessage(text, userId = 'default') {
    const analysis = this.detector.analyze(text);

    if (analysis.alert) {
      analysis.alert.userId = userId;
      this.activeAlerts.set(analysis.alert.id, analysis.alert);
    }

    return {
      ...analysis,
      activeAlertCount: this.activeAlerts.size,
    };
  }

  /**
   * Resolve a crisis alert
   * @param {string} alertId - Alert identifier
   * @param {Object} resolution - Resolution details
   * @returns {Object} Resolution result
   */
  resolveAlert(alertId, resolution) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return { success: false, error: 'Alert not found' };
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    alert.resolution = resolution;

    this.activeAlerts.delete(alertId);
    this.resolvedAlerts.push(alert);

    return { success: true, alert };
  }

  /**
   * Get active alerts count
   * @returns {number} Number of active alerts
   */
  getActiveAlertCount() {
    return this.activeAlerts.size;
  }
}

module.exports = { CrisisDetector, CrisisAlert };
