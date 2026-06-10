/**
 * GAD-7 Generalized Anxiety Disorder Scale
 *
 * Standardized 7-item anxiety screening instrument.
 * Each item scored 0-3, total range 0-21.
 *
 * Scoring interpretation:
 *   0-4:   Minimal anxiety
 *   5-9:   Mild anxiety
 *   10-14: Moderate anxiety
 *   15-21: Severe anxiety
 */

const GAD7_QUESTIONS = [
  {
    id: 1,
    text: '感觉紧张、焦虑或急切',
    textEn: 'Feeling nervous, anxious, or on edge',
    domain: 'nervousness',
  },
  {
    id: 2,
    text: '不能停止或控制担忧',
    textEn: 'Not being able to stop or control worrying',
    domain: 'uncontrollable_worry',
  },
  {
    id: 3,
    text: '对各种各样的事情担忧过多',
    textEn: 'Worrying too much about different things',
    domain: 'excessive_worry',
  },
  {
    id: 4,
    text: '很难放松下来',
    textEn: 'Trouble relaxing',
    domain: 'relaxation_difficulty',
  },
  {
    id: 5,
    text: '由于不安而无法静坐',
    textEn: 'Being so restless that it is hard to sit still',
    domain: 'restlessness',
  },
  {
    id: 6,
    text: '变得容易烦恼或急躁',
    textEn: 'Becoming easily annoyed or irritable',
    domain: 'irritability',
  },
  {
    id: 7,
    text: '感到似乎将有可怕的事情发生',
    textEn: 'Feeling afraid as if something awful might happen',
    domain: 'dread',
  },
];

const RESPONSE_OPTIONS = [
  { value: 0, label: '完全不会', labelEn: 'Not at all' },
  { value: 1, label: '好几天', labelEn: 'Several days' },
  { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
  { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
];

const SEVERITY_LEVELS = {
  minimal: { min: 0, max: 4, label: '无/极轻微', labelEn: 'Minimal', color: '#4CAF50', action: 'monitoring' },
  mild: { min: 5, max: 9, label: '轻度', labelEn: 'Mild', color: '#FFC107', action: 'watchful_waiting' },
  moderate: { min: 10, max: 14, label: '中度', labelEn: 'Moderate', color: '#FF9800', action: 'treatment_plan' },
  severe: { min: 15, max: 21, label: '重度', labelEn: 'Severe', color: '#F44336', action: 'active_treatment' },
};

class GAD7 {
  constructor(options = {}) {
    this.language = options.language || 'zh';
  }

  /**
   * Get all questions
   */
  getQuestions() {
    return GAD7_QUESTIONS.map(q => ({
      ...q,
      text: this.language === 'zh' ? q.text : q.textEn,
      options: RESPONSE_OPTIONS.map(o => ({
        value: o.value,
        label: this.language === 'zh' ? o.label : o.labelEn,
      })),
    }));
  }

  /**
   * Validate response set
   */
  validate(responses) {
    const errors = [];

    if (!Array.isArray(responses) && typeof responses !== 'object') {
      return { valid: false, errors: ['Responses must be array or object'] };
    }

    const responseMap = Array.isArray(responses)
      ? Object.fromEntries(responses.map(r => [r.questionId, r.value]))
      : responses;

    for (const q of GAD7_QUESTIONS) {
      const value = responseMap[q.id];
      if (value === undefined || value === null) {
        errors.push(`Question ${q.id} not answered`);
      } else if (typeof value !== 'number' || value < 0 || value > 3) {
        errors.push(`Question ${q.id}: invalid value ${value} (expected 0-3)`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Calculate total score
   */
  calculateScore(responses) {
    const validation = this.validate(responses);
    if (!validation.valid) {
      throw new Error(`Invalid responses: ${validation.errors.join('; ')}`);
    }

    const responseMap = Array.isArray(responses)
      ? Object.fromEntries(responses.map(r => [r.questionId, r.value]))
      : responses;

    let totalScore = 0;
    const itemScores = {};

    for (const q of GAD7_QUESTIONS) {
      const score = responseMap[q.id];
      itemScores[q.domain] = score;
      totalScore += score;
    }

    // Determine severity
    let severity = 'minimal';
    for (const [level, range] of Object.entries(SEVERITY_LEVELS)) {
      if (totalScore >= range.min && totalScore <= range.max) {
        severity = level;
        break;
      }
    }

    const severityInfo = SEVERITY_LEVELS[severity];

    return {
      instrument: 'GAD-7',
      totalScore,
      maxScore: 21,
      severity,
      severityLabel: this.language === 'zh' ? severityInfo.label : severityInfo.labelEn,
      severityColor: severityInfo.color,
      recommendedAction: severityInfo.action,
      itemScores,
      functionalImpairment: this._assessFunctionalImpairment(itemScores),
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Assess functional impairment based on item scores
   */
  _assessFunctionalImpairment(itemScores) {
    const impairments = [];

    if (itemScores.restlessness >= 2) {
      impairments.push('坐立不安影响日常活动');
    }
    if (itemScores.irritability >= 2) {
      impairments.push('易怒影响人际关系');
    }
    if (itemScores.relaxation_difficulty >= 2) {
      impairments.push('无法放松影响休息和睡眠');
    }
    if (itemScores.uncontrollable_worry >= 2) {
      impairments.push('过度担忧影响专注力');
    }

    return impairments;
  }

  /**
   * Get severity levels
   */
  getSeverityLevels() {
    return { ...SEVERITY_LEVELS };
  }
}

module.exports = { GAD7, GAD7_QUESTIONS, RESPONSE_OPTIONS, SEVERITY_LEVELS };
