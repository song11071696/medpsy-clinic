/**
 * PHQ-9 Patient Health Questionnaire (Depression Scale)
 *
 * Standardized 9-item depression screening instrument.
 * Each item scored 0-3, total range 0-27.
 *
 * Scoring interpretation:
 *   0-4:   Minimal depression
 *   5-9:   Mild depression
 *   10-14: Moderate depression
 *   15-19: Moderately severe depression
 *   20-27: Severe depression
 */

const PHQ9_QUESTIONS = [
  {
    id: 1,
    text: '做事情时提不起劲或没有兴趣',
    textEn: 'Little interest or pleasure in doing things',
    domain: 'anhedonia',
  },
  {
    id: 2,
    text: '感到心情低落、沮丧或绝望',
    textEn: 'Feeling down, depressed, or hopeless',
    domain: 'depressed_mood',
  },
  {
    id: 3,
    text: '入睡困难、睡不安稳或睡眠过多',
    textEn: 'Trouble falling or staying asleep, or sleeping too much',
    domain: 'sleep',
  },
  {
    id: 4,
    text: '感觉疲倦或没有活力',
    textEn: 'Feeling tired or having little energy',
    domain: 'fatigue',
  },
  {
    id: 5,
    text: '食欲不振或吃太多',
    textEn: 'Poor appetite or overeating',
    domain: 'appetite',
  },
  {
    id: 6,
    text: '觉得自己很糟，是个失败者，或让自己或家人失望',
    textEn: 'Feeling bad about yourself - or that you are a failure',
    domain: 'self_worth',
  },
  {
    id: 7,
    text: '对事物专注有困难，如阅读报纸或看电视',
    textEn: 'Trouble concentrating on things',
    domain: 'concentration',
  },
  {
    id: 8,
    text: '动作或说话速度缓慢到别人已经注意到，或正好相反———烦躁或坐立不安',
    textEn: 'Moving or speaking slowly / being fidgety and restless',
    domain: 'psychomotor',
  },
  {
    id: 9,
    text: '有不如死掉或用某种方式伤害自己的念头',
    textEn: 'Thoughts that you would be better off dead or of hurting yourself',
    domain: 'suicidal_ideation',
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
  moderately_severe: { min: 15, max: 19, label: '中重度', labelEn: 'Moderately Severe', color: '#FF5722', action: 'active_treatment' },
  severe: { min: 20, max: 27, label: '重度', labelEn: 'Severe', color: '#F44336', action: 'immediate_referral' },
};

class PHQ9 {
  constructor(options = {}) {
    this.language = options.language || 'zh';
    this.includeItem9 = options.includeItem9 !== false;
  }

  /**
   * Get all questions
   */
  getQuestions() {
    return PHQ9_QUESTIONS.map(q => ({
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

    for (const q of PHQ9_QUESTIONS) {
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

    for (const q of PHQ9_QUESTIONS) {
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
      instrument: 'PHQ-9',
      totalScore,
      maxScore: 27,
      severity,
      severityLabel: this.language === 'zh' ? severityInfo.label : severityInfo.labelEn,
      severityColor: severityInfo.color,
      recommendedAction: severityInfo.action,
      itemScores,
      item9Score: responseMap[9], // Suicidal ideation item
      hasSuicidalIdeation: responseMap[9] >= 1,
      requiresImmediateAttention: responseMap[9] >= 2,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Get severity levels
   */
  getSeverityLevels() {
    return { ...SEVERITY_LEVELS };
  }
}

module.exports = { PHQ9, PHQ9_QUESTIONS, RESPONSE_OPTIONS, SEVERITY_LEVELS };
