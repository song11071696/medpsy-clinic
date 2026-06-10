/**
 * Assessment Scorer
 *
 * Unified scoring system for psychological assessment instruments.
 * Handles PHQ-9, GAD-7, and supports custom scales.
 */

const { PHQ9 } = require('./phq9');
const { GAD7 } = require('./gad7');

/**
 * Available instruments
 */
const INSTRUMENTS = {
  'PHQ-9': PHQ9,
  'GAD-7': GAD7,
};

/**
 * Clinical interpretation guidelines
 */
const CLINICAL_GUIDELINES = {
  'PHQ-9': {
    followUp: {
      minimal: '1个月后复查',
      mild: '2周后复查，观察症状变化',
      moderate: '建议心理咨询或治疗',
      moderately_severe: '建议药物治疗联合心理咨询',
      severe: '立即转介精神科评估',
    },
    emergencyThreshold: {
      item9Score: 2,  // Item 9 (suicidal ideation) >= 2 triggers alert
    },
  },
  'GAD-7': {
    followUp: {
      minimal: '1个月后复查',
      mild: '2周后复查，建议放松训练',
      moderate: '建议认知行为治疗',
      severe: '建议药物治疗联合心理治疗',
    },
  },
};

class Scorer {
  constructor(options = {}) {
    this.language = options.language || 'zh';
    this.instruments = {};
    this.history = new Map(); // patientId -> assessments[]

    // Initialize standard instruments
    for (const [name, Class] of Object.entries(INSTRUMENTS)) {
      this.instruments[name] = new Class({ language: this.language });
    }
  }

  /**
   * Register a custom instrument
   */
  registerInstrument(name, instrument) {
    this.instruments[name] = instrument;
  }

  /**
   * Score an assessment
   * @param {string} instrument - Instrument name (PHQ-9, GAD-7, etc.)
   * @param {Array|Object} responses - Patient responses
   * @param {string} patientId - Optional patient ID for history tracking
   * @returns {Object} Scoring result with interpretation
   */
  score(instrument, responses, patientId = null) {
    const inst = this.instruments[instrument];
    if (!inst) {
      throw new Error(`Unknown instrument: ${instrument}. Available: ${Object.keys(this.instruments).join(', ')}`);
    }

    const result = inst.calculateScore(responses);

    // Add clinical interpretation
    const guidelines = CLINICAL_GUIDELINES[instrument];
    if (guidelines) {
      result.followUp = guidelines.followUp[result.severity] || '遵医嘱';
    }

    // Check for emergency alerts
    result.alerts = this._checkAlerts(instrument, result);

    // Store in history
    if (patientId) {
      if (!this.history.has(patientId)) {
        this.history.set(patientId, []);
      }
      this.history.get(patientId).push({
        instrument,
        result,
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  }

  /**
   * Score multiple instruments at once
   */
  scoreMultiple(assessments, patientId = null) {
    const results = {};

    for (const { instrument, responses } of assessments) {
      results[instrument] = this.score(instrument, responses, patientId);
    }

    // Cross-instrument analysis
    results._composite = this._analyzeComposite(results);
    return results;
  }

  /**
   * Get patient's assessment history
   */
  getHistory(patientId, instrument = null) {
    const records = this.history.get(patientId) || [];
    if (instrument) {
      return records.filter(r => r.instrument === instrument);
    }
    return records;
  }

  /**
   * Analyze trends over time
   */
  analyzeTrend(patientId, instrument) {
    const records = this.getHistory(patientId, instrument);
    if (records.length < 2) {
      return { trend: 'insufficient_data', records: records.length };
    }

    const scores = records.map(r => r.result.totalScore);
    const recent = scores.slice(-3);
    const previous = scores.slice(-6, -3);

    const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
    const previousAvg = previous.length > 0
      ? previous.reduce((s, v) => s + v, 0) / previous.length
      : recentAvg;

    const change = recentAvg - previousAvg;
    let trend;
    if (change < -2) trend = 'improving';
    else if (change > 2) trend = 'worsening';
    else trend = 'stable';

    return {
      trend,
      currentScore: scores[scores.length - 1],
      previousScore: scores.length >= 2 ? scores[scores.length - 2] : null,
      change,
      changePercent: previousAvg > 0 ? ((change / previousAvg) * 100).toFixed(1) + '%' : 'N/A',
      records: records.length,
      scores,
    };
  }

  /**
   * Generate clinical summary
   */
  generateSummary(patientId) {
    const allRecords = this.history.get(patientId) || [];
    if (allRecords.length === 0) return null;

    const instruments = [...new Set(allRecords.map(r => r.instrument))];
    const summary = {
      patientId,
      totalAssessments: allRecords.length,
      instruments,
      latestResults: {},
      trends: {},
    };

    for (const inst of instruments) {
      const instRecords = allRecords.filter(r => r.instrument === inst);
      const latest = instRecords[instRecords.length - 1];
      summary.latestResults[inst] = latest.result;
      summary.trends[inst] = this.analyzeTrend(patientId, inst);
    }

    return summary;
  }

  /**
   * Check for emergency alerts
   */
  _checkAlerts(instrument, result) {
    const alerts = [];

    // PHQ-9 Item 9 (suicidal ideation) check
    if (instrument === 'PHQ-9' && result.hasSuicidalIdeation) {
      alerts.push({
        level: result.requiresImmediateAttention ? 'critical' : 'warning',
        type: 'suicidal_ideation',
        message: '患者报告存在自伤想法，建议立即评估',
        action: result.requiresImmediateAttention
          ? '立即进行自杀风险评估并考虑转介'
          : '密切关注患者状态，详细询问自伤想法',
      });
    }

    // Severe score alert
    if (result.severity === 'severe') {
      alerts.push({
        level: 'high',
        type: 'severe_score',
        message: `${instrument} 评分达到重度水平 (${result.totalScore}/${result.maxScore})`,
        action: '建议尽快安排专业评估',
      });
    }

    return alerts;
  }

  /**
   * Composite analysis across instruments
   */
  _analyzeComposite(results) {
    const severities = {};
    const hasEmergency = false;

    for (const [inst, result] of Object.entries(results)) {
      if (inst.startsWith('_')) continue;
      severities[inst] = result.severity;

      if (result.alerts && result.alerts.some(a => a.level === 'critical')) {
        return {
          overallRisk: 'critical',
          recommendation: '存在紧急风险信号，建议立即专业介入',
          severities,
        };
      }
    }

    const severityOrder = ['minimal', 'mild', 'moderate', 'moderately_severe', 'severe'];
    let maxSeverityIndex = 0;

    for (const sev of Object.values(severities)) {
      const idx = severityOrder.indexOf(sev);
      if (idx > maxSeverityIndex) maxSeverityIndex = idx;
    }

    const overallLevels = ['low', 'mild', 'moderate', 'high', 'critical'];
    const overallRisk = overallLevels[maxSeverityIndex];

    return {
      overallRisk,
      recommendation: this._getCompositeRecommendation(overallRisk),
      severities,
    };
  }

  _getCompositeRecommendation(risk) {
    const recommendations = {
      low: '继续定期监测，维持健康生活方式',
      mild: '建议2周后复查，可进行放松训练和心理教育',
      moderate: '建议进行专业心理咨询评估',
      high: '建议尽快安排专业评估和治疗',
      critical: '立即进行专业评估和干预',
    };
    return recommendations[risk] || '请咨询专业人员';
  }
}

module.exports = { Scorer, INSTRUMENTS, CLINICAL_GUIDELINES };
