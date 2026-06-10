/**
 * 认知评估模块
 * 评估用户的认知功能状态
 */

const COGNITIVE_DOMAINS = [
  'attention',      // 注意力
  'memory',         // 记忆力
  'executive',      // 执行功能
  'language',       // 语言能力
  'visuospatial',   // 视空间能力
  'processing_speed' // 处理速度
];

const SEVERITY_LEVELS = ['normal', 'mild', 'moderate', 'severe'];

class CognitiveAssessor {
  constructor(options = {}) {
    this.baselines = {};
    this.assessments = [];
    this.maxAssessments = options.maxAssessments || 500;
  }

  /**
   * 设置基线认知水平
   * @param {string} userId - 用户ID
   * @param {Object} baseline - 基线数据
   */
  setBaseline(userId, baseline) {
    if (!userId) throw new Error('用户ID不能为空');
    const validated = this._validateDomainScores(baseline);
    this.baselines[userId] = {
      scores: validated,
      timestamp: new Date().toISOString()
    };
    return this.baselines[userId];
  }

  /**
   * 执行认知评估
   * @param {string} userId - 用户ID
   * @param {Object} testData - 测试数据
   * @returns {Object} 评估结果
   */
  assess(userId, testData) {
    if (!userId) throw new Error('用户ID不能为空');
    const scores = this._validateDomainScores(testData);
    const baseline = this.baselines[userId];

    const domainResults = {};
    for (const domain of COGNITIVE_DOMAINS) {
      const currentScore = scores[domain] || 0;
      const baselineScore = baseline ? baseline.scores[domain] || 0 : currentScore;
      const change = currentScore - baselineScore;
      const severity = this._classifySeverity(currentScore);

      domainResults[domain] = {
        score: currentScore,
        baseline: baselineScore,
        change,
        severity,
        isDecline: change < -10,
        isImprovement: change > 10
      };
    }

    const overallScore = this._calculateOverallScore(scores);
    const overallSeverity = this._classifySeverity(overallScore);

    const result = {
      userId,
      domains: domainResults,
      overallScore,
      overallSeverity,
      recommendations: this._generateRecommendations(domainResults),
      timestamp: new Date().toISOString(),
      assessmentId: `CA-${Date.now()}`
    };

    this.assessments.push(result);
    if (this.assessments.length > this.maxAssessments) {
      this.assessments.shift();
    }

    return result;
  }

  /**
   * 验证认知领域分数
   */
  _validateDomainScores(scores) {
    if (!scores || typeof scores !== 'object') {
      throw new Error('认知分数必须是对象');
    }
    const validated = {};
    for (const domain of COGNITIVE_DOMAINS) {
      const val = scores[domain];
      if (val !== undefined) {
        validated[domain] = Math.max(0, Math.min(100, Number(val)));
      }
    }
    return validated;
  }

  /**
   * 分类严重程度
   */
  _classifySeverity(score) {
    if (score >= 80) return 'normal';
    if (score >= 60) return 'mild';
    if (score >= 40) return 'moderate';
    return 'severe';
  }

  /**
   * 计算综合分数
   */
  _calculateOverallScore(scores) {
    const values = Object.values(scores).filter(v => typeof v === 'number');
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * 生成建议
   */
  _generateRecommendations(domainResults) {
    const recs = [];
    for (const [domain, result] of Object.entries(domainResults)) {
      if (result.severity === 'severe') {
        recs.push({ domain, priority: 'high', message: `${domain}功能严重受损，建议立即专业评估` });
      } else if (result.severity === 'moderate') {
        recs.push({ domain, priority: 'medium', message: `${domain}功能中度受损，建议针对性训练` });
      } else if (result.isDecline) {
        recs.push({ domain, priority: 'low', message: `${domain}功能较基线下降，建议持续监测` });
      }
    }
    return recs.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
  }

  /**
   * 获取用户评估历史
   */
  getUserHistory(userId, limit = 20) {
    return this.assessments
      .filter(a => a.userId === userId)
      .slice(-limit);
  }

  /**
   * 比较两次评估
   */
  compareAssessments(assessmentId1, assessmentId2) {
    const a1 = this.assessments.find(a => a.assessmentId === assessmentId1);
    const a2 = this.assessments.find(a => a.assessmentId === assessmentId2);
    if (!a1 || !a2) throw new Error('未找到评估记录');

    const changes = {};
    for (const domain of COGNITIVE_DOMAINS) {
      const s1 = a1.domains[domain]?.score || 0;
      const s2 = a2.domains[domain]?.score || 0;
      changes[domain] = { previous: s1, current: s2, change: s2 - s1 };
    }
    return { assessment1: assessmentId1, assessment2: assessmentId2, changes };
  }
}

module.exports = { CognitiveAssessor, COGNITIVE_DOMAINS, SEVERITY_LEVELS };
