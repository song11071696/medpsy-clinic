/**
 * 治疗建议模块
 * 基于患者状态生成个性化治疗建议
 */

const THERAPY_TYPES = {
  CBT: 'cognitive_behavioral_therapy',
  DBT: 'dialectical_behavior_therapy',
  PSYCHODYNAMIC: 'psychodynamic_therapy',
  HUMANISTIC: 'humanistic_therapy',
  MINDFULNESS: 'mindfulness_based',
  EXPOSURE: 'exposure_therapy',
  INTERPERSONAL: 'interpersonal_therapy',
  SUPPORTIVE: 'supportive_therapy',
  BEHAVIORAL_ACTIVATION: 'behavioral_activation'
  };

const CONDITION_THERAPY_MAP = {
  anxiety: [THERAPY_TYPES.CBT, THERAPY_TYPES.EXPOSURE, THERAPY_TYPES.MINDFULNESS],
  depression: [THERAPY_TYPES.CBT, THERAPY_TYPES.BEHAVIORAL_ACTIVATION, THERAPY_TYPES.INTERPERSONAL],
  trauma: [THERAPY_TYPES.EXPOSURE, THERAPY_TYPES.PSYCHODYNAMIC, THERAPY_TYPES.CBT],
  personality: [THERAPY_TYPES.DBT, THERAPY_TYPES.PSYCHODYNAMIC],
  stress: [THERAPY_TYPES.MINDFULNESS, THERAPY_TYPES.SUPPORTIVE, THERAPY_TYPES.CBT],
  grief: [THERAPY_TYPES.SUPPORTIVE, THERAPY_TYPES.HUMANISTIC, THERAPY_TYPES.INTERPERSONAL],
  relationship: [THERAPY_TYPES.INTERPERSONAL, THERAPY_TYPES.HUMANISTIC]
};

class TherapyAdvisor {
  constructor(options = {}) {
    this.options = options;
    this.history = [];
    this.maxHistory = options.maxHistory || 500;
  }

  /**
   * 生成治疗建议
   * @param {Object} patientProfile - 患者画像
   * @returns {Object} 治疗建议
   */
  generateAdvice(patientProfile) {
    if (!patientProfile || typeof patientProfile !== 'object') {
      throw new Error('患者画像不能为空');
    }

    const { conditions = [], severity = 'moderate', preferences = {}, history = [] } = patientProfile;

    // 根据病症推荐疗法
    const recommendedTherapies = this._recommendTherapies(conditions, severity);

    // 排除历史失败的疗法
    const filtered = this._filterByHistory(recommendedTherapies, history);

    // 根据偏好排序
    const sorted = this._sortByPreferences(filtered, preferences);

    // 生成具体建议
    const recommendations = sorted.map(therapy => ({
      therapyType: therapy.type,
      matchScore: therapy.score,
      reason: therapy.reason,
      duration: this._estimateDuration(therapy.type, severity),
      frequency: this._recommendFrequency(therapy.type, severity),
      exercises: this._getExercises(therapy.type),
      contraindications: this._getContraindications(therapy.type, patientProfile)
    }));

    const result = {
      patientId: patientProfile.id,
      recommendations,
      primaryRecommendation: recommendations[0] || null,
      warnings: this._generateWarnings(patientProfile),
      timestamp: new Date().toISOString(),
      adviceId: `TA-${Date.now()}`
    };

    this.history.push(result);
    if (this.history.length > this.maxHistory) this.history.shift();

    return result;
  }

  /**
   * 推荐疗法
   */
  _recommendTherapies(conditions, severity) {
    const therapyScores = {};
    for (const condition of conditions) {
      const therapies = CONDITION_THERAPY_MAP[condition] || [THERAPY_TYPES.SUPPORTIVE];
      for (const therapy of therapies) {
        therapyScores[therapy] = (therapyScores[therapy] || 0) + 1;
      }
    }
    return Object.entries(therapyScores)
      .map(([type, score]) => ({
        type,
        score: score / conditions.length,
        reason: `适用于${conditions.join('、')}的治疗`
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * 根据历史过滤
   */
  _filterByHistory(therapies, history) {
    const failedTherapies = new Set(
      (history || []).filter(h => h.outcome === 'failed').map(h => h.type)
    );
    return therapies.filter(t => !failedTherapies.has(t.type));
  }

  /**
   * 根据偏好排序
   */
  _sortByPreferences(therapies, preferences) {
    if (!preferences.preferred) return therapies;
    return therapies.sort((a, b) => {
      const aPref = preferences.preferred.includes(a.type) ? 1 : 0;
      const bPref = preferences.preferred.includes(b.type) ? 1 : 0;
      return bPref - aPref || b.score - a.score;
    });
  }

  /**
   * 估计治疗时长
   */
  _estimateDuration(therapyType, severity) {
    const baseWeeks = {
      [THERAPY_TYPES.CBT]: 12,
      [THERAPY_TYPES.DBT]: 24,
      [THERAPY_TYPES.PSYCHODYNAMIC]: 52,
      [THERAPY_TYPES.MINDFULNESS]: 8,
      [THERAPY_TYPES.EXPOSURE]: 10,
      [THERAPY_TYPES.INTERPERSONAL]: 16,
      [THERAPY_TYPES.HUMANISTIC]: 20,
      [THERAPY_TYPES.SUPPORTIVE]: 8,
      [THERAPY_TYPES.BEHAVIORAL_ACTIVATION]: 12,
    };
    const severityMultiplier = { mild: 0.75, moderate: 1, severe: 1.5 };
    const weeks = (baseWeeks[therapyType] || 12) * (severityMultiplier[severity] || 1);
    return { weeks: Math.round(weeks), sessions: Math.round(weeks * 0.75) };
  }

  /**
   * 推荐频率
   */
  _recommendFrequency(therapyType, severity) {
    if (severity === 'severe') return '每周2-3次';
    if (severity === 'moderate') return '每周1-2次';
    return '每周1次或双周1次';
  }

  /**
   * 获取练习建议
   */
  _getExercises(therapyType) {
    const exercises = {
      [THERAPY_TYPES.CBT]: ['思维记录', '行为实验', '认知重构练习'],
      [THERAPY_TYPES.DBT]: ['正念练习', '痛苦耐受训练', '情绪调节技巧'],
      [THERAPY_TYPES.MINDFULNESS]: ['呼吸冥想', '身体扫描', '正念行走'],
      [THERAPY_TYPES.EXPOSURE]: ['放松训练', '渐进式暴露', '系统脱敏'],
      [THERAPY_TYPES.INTERPERSONAL]: ['角色扮演', '沟通技巧训练', '社交技能练习'],
      [THERAPY_TYPES.HUMANISTIC]: ['自我反思日记', '价值观探索', '自我接纳练习'],
      [THERAPY_TYPES.SUPPORTIVE]: ['情绪日志', '压力管理', '社交支持网络建设'],
      [THERAPY_TYPES.BEHAVIORAL_ACTIVATION]: ['活动计划', '愉悦感追踪', '渐进式任务安排', '行为日记'],
    };
    return exercises[therapyType] || ['一般性心理健康练习'];
  }

  /**
   * 获取禁忌症
   */
  _getContraindications(therapyType, profile) {
    const contras = [];
    if (therapyType === THERAPY_TYPES.EXPOSURE && profile.conditions?.includes('psychosis')) {
      contras.push('精神病性症状患者慎用暴露疗法');
    }
    if (therapyType === THERAPY_TYPES.MINDFULNESS && profile.conditions?.includes('dissociation')) {
      contras.push('解离症状患者需谨慎使用冥想练习');
    }
    return contras;
  }

  /**
   * 生成警告
   */
  _generateWarnings(profile) {
    const warnings = [];
    if (profile.severity === 'severe') {
      warnings.push('严重症状患者建议优先考虑药物治疗与心理治疗结合');
    }
    if (profile.conditions?.includes('suicidal')) {
      warnings.push('⚠️ 检测到自杀风险，建议立即进行危机干预');
    }
    return warnings;
  }

  /**
   * 获取历史
   */
  getHistory(limit = 20) {
    return this.history.slice(-limit);
  }
}

module.exports = { TherapyAdvisor, THERAPY_TYPES };
