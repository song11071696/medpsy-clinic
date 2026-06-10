/**
 * Cognitive Assessment Module
 * Provides standardized cognitive screening tools for mental health evaluation
 * Includes: PHQ-9 (depression), GAD-7 (anxiety), PCL-5 (PTSD), and custom assessments
 */

class CognitiveAssessor {
  constructor(options = {}) {
    this.language = options.language || 'zh';
    this.assessments = this._initializeAssessments();
  }

  /**
   * Initialize available assessment instruments
   * @returns {Object} Assessment definitions
   */
  _initializeAssessments() {
    return {
      'PHQ-9': {
        name: 'Patient Health Questionnaire-9',
        nameZh: '患者健康问卷-9（抑郁筛查）',
        category: 'depression',
        questions: [
          { id: 1, text: '做事时提不起劲或没有兴趣', textEn: 'Little interest or pleasure in doing things' },
          { id: 2, text: '感到心情低落、沮丧或绝望', textEn: 'Feeling down, depressed, or hopeless' },
          { id: 3, text: '入睡困难、睡不安稳或睡眠过多', textEn: 'Trouble falling or staying asleep, or sleeping too much' },
          { id: 4, text: '感觉疲倦或没有活力', textEn: 'Feeling tired or having little energy' },
          { id: 5, text: '食欲不振或吃太多', textEn: 'Poor appetite or overeating' },
          { id: 6, text: '觉得自己很糟糕或很失败，让自己或家人失望', textEn: 'Feeling bad about yourself' },
          { id: 7, text: '注意力难以集中，如阅读报纸或看电视', textEn: 'Trouble concentrating on things' },
          { id: 8, text: '动作或说话速度慢到别人能注意到，或坐立不安', textEn: 'Moving or speaking slowly/restlessly' },
          { id: 9, text: '有不如死掉或用某种方式伤害自己的念头', textEn: 'Thoughts of self-harm' },
        ],
        scoring: [
          { min: 0, max: 4, level: 'none', label: '无抑郁症状', labelEn: 'Minimal depression' },
          { min: 5, max: 9, level: 'mild', label: '轻度抑郁', labelEn: 'Mild depression' },
          { min: 10, max: 14, level: 'moderate', label: '中度抑郁', labelEn: 'Moderate depression' },
          { min: 15, max: 19, level: 'moderately_severe', label: '中重度抑郁', labelEn: 'Moderately severe depression' },
          { min: 20, max: 27, level: 'severe', label: '重度抑郁', labelEn: 'Severe depression' },
        ],
        maxScore: 27,
      },
      'GAD-7': {
        name: 'Generalized Anxiety Disorder-7',
        nameZh: '广泛性焦虑量表-7（焦虑筛查）',
        category: 'anxiety',
        questions: [
          { id: 1, text: '感觉紧张、焦虑或急切', textEn: 'Feeling nervous, anxious, or on edge' },
          { id: 2, text: '不能够停止或控制担忧', textEn: 'Not being able to stop or control worrying' },
          { id: 3, text: '对各种各样的事情担忧过多', textEn: 'Worrying too much about different things' },
          { id: 4, text: '很难放松下来', textEn: 'Trouble relaxing' },
          { id: 5, text: '坐立不安，很难静下来', textEn: 'Being so restless that it\'s hard to sit still' },
          { id: 6, text: '变得容易烦恼或急躁', textEn: 'Becoming easily annoyed or irritable' },
          { id: 7, text: '感到似乎将有可怕的事情发生', textEn: 'Feeling afraid as if something awful might happen' },
        ],
        scoring: [
          { min: 0, max: 4, level: 'none', label: '无焦虑症状', labelEn: 'Minimal anxiety' },
          { min: 5, max: 9, level: 'mild', label: '轻度焦虑', labelEn: 'Mild anxiety' },
          { min: 10, max: 14, level: 'moderate', label: '中度焦虑', labelEn: 'Moderate anxiety' },
          { min: 15, max: 21, level: 'severe', label: '重度焦虑', labelEn: 'Severe anxiety' },
        ],
        maxScore: 21,
      },
      'PCL-5': {
        name: 'PTSD Checklist for DSM-5',
        nameZh: 'PTSD检查表（创伤后应激障碍筛查）',
        category: 'ptsd',
        questions: [
          { id: 1, text: '反复出现令人不安的记忆', textEn: 'Repeated, disturbing memories' },
          { id: 2, text: '反复出现令人不安的梦境', textEn: 'Repeated, disturbing dreams' },
          { id: 3, text: '突然感觉创伤事件再次发生', textEn: 'Suddenly feeling like it\'s happening again' },
          { id: 4, text: '接触相关事物时感到非常不安', textEn: 'Feeling very upset when reminded' },
          { id: 5, text: '避免与创伤相关的记忆或感受', textEn: 'Avoiding memories or feelings' },
          { id: 6, text: '避免与创伤相关的人或地方', textEn: 'Avoiding external reminders' },
          { id: 7, text: '对外界事物失去兴趣', textEn: 'Loss of interest in activities' },
          { id: 8, text: '感觉与他人疏远', textEn: 'Feeling distant from others' },
          { id: 9, text: '对周围事物感到麻木', textEn: 'Feeling emotionally numb' },
          { id: 10, text: '对日常活动感到困难', textEn: 'Trouble with daily activities' },
          { id: 11, text: '容易被惊吓', textEn: 'Easily startled' },
          { id: 12, text: '难以集中注意力', textEn: 'Trouble concentrating' },
          { id: 13, text: '难以入睡或保持睡眠', textEn: 'Trouble falling/staying asleep' },
          { id: 14, text: '易怒或有愤怒爆发', textEn: 'Irritability or anger outbursts' },
          { id: 15, text: '对自己或他人有负面想法', textEn: 'Negative thoughts about self/others' },
          { id: 16, text: '对重要活动失去兴趣', textEn: 'Loss of interest in important activities' },
        ],
        scoring: [
          { min: 0, max: 30, level: 'none', label: '无PTSD症状', labelEn: 'No PTSD' },
          { min: 31, max: 50, level: 'mild', label: '轻度PTSD', labelEn: 'Mild PTSD' },
          { min: 51, max: 64, level: 'moderate', label: '中度PTSD', labelEn: 'Moderate PTSD' },
          { min: 65, max: 80, level: 'severe', label: '重度PTSD', labelEn: 'Severe PTSD' },
        ],
        maxScore: 80,
      },
      'WHO-5': {
        name: 'WHO Well-Being Index',
        nameZh: 'WHO幸福指数量表',
        category: 'wellbeing',
        questions: [
          { id: 1, text: '我感到心情愉快精神饱满', textEn: 'I have felt cheerful and in good spirits' },
          { id: 2, text: '我感到平静和放松', textEn: 'I have felt calm and relaxed' },
          { id: 3, text: '我感到充满活力', textEn: 'I have felt active and vigorous' },
          { id: 4, text: '我醒来时感到清新和休息充分', textEn: 'I woke up feeling fresh and rested' },
          { id: 5, text: '我的日常生活充满有趣的事情', textEn: 'My daily life has been full of things that interest me' },
        ],
        scoring: [
          { min: 0, max: 12, level: 'poor', label: '幸福感低', labelEn: 'Poor well-being' },
          { min: 13, max: 25, level: 'moderate', label: '幸福感一般', labelEn: 'Moderate well-being' },
          { min: 26, max: 50, level: 'good', label: '幸福感良好', labelEn: 'Good well-being' },
        ],
        maxScore: 50,
      },
    };
  }

  /**
   * Get available assessments
   * @returns {Array} List of assessment summaries
   */
  getAvailableAssessments() {
    return Object.entries(this.assessments).map(([id, config]) => ({
      id,
      name: config.name,
      nameZh: config.nameZh,
      category: config.category,
      questionCount: config.questions.length,
      maxScore: config.maxScore,
    }));
  }

  /**
   * Get questions for a specific assessment
   * @param {string} assessmentId - Assessment identifier (e.g., 'PHQ-9')
   * @returns {Object} Assessment questions
   */
  getQuestions(assessmentId) {
    const assessment = this.assessments[assessmentId];
    if (!assessment) {
      throw new Error(`Unknown assessment: ${assessmentId}`);
    }
    return {
      id: assessmentId,
      name: this.language === 'zh' ? assessment.nameZh : assessment.name,
      category: assessment.category,
      questions: assessment.questions.map(q => ({
        id: q.id,
        text: this.language === 'zh' ? q.text : q.textEn,
      })),
      options: this._getScoringOptions(assessmentId),
    };
  }

  /**
   * Get scoring options for an assessment
   * @param {string} assessmentId - Assessment identifier
   * @returns {Array} Scoring options
   */
  _getScoringOptions(assessmentId) {
    if (assessmentId === 'PHQ-9' || assessmentId === 'GAD-7') {
      return [
        { value: 0, label: '完全不会', labelEn: 'Not at all' },
        { value: 1, label: '好几天', labelEn: 'Several days' },
        { value: 2, label: '一半以上的天数', labelEn: 'More than half the days' },
        { value: 3, label: '几乎每天', labelEn: 'Nearly every day' },
      ];
    }
    if (assessmentId === 'PCL-5') {
      return [
        { value: 0, label: '完全没有', labelEn: 'Not at all' },
        { value: 1, label: '有一点', labelEn: 'A little bit' },
        { value: 2, label: '中等程度', labelEn: 'Moderately' },
        { value: 3, label: '相当多', labelEn: 'Quite a bit' },
        { value: 4, label: '极其严重', labelEn: 'Extremely' },
      ];
    }
    if (assessmentId === 'WHO-5') {
      return [
        { value: 0, label: '所有时候', labelEn: 'All of the time' },
        { value: 1, label: '大部分时候', labelEn: 'Most of the time' },
        { value: 2, label: '超过一半时候', labelEn: 'More than half of the time' },
        { value: 3, label: '少于一半时候', labelEn: 'Less than half of the time' },
        { value: 4, label: '有些时候', labelEn: 'Some of the time' },
        { value: 5, label: '从来没有', labelEn: 'At no time' },
      ];
    }
    return [];
  }

  /**
   * Score an assessment
   * @param {string} assessmentId - Assessment identifier
   * @param {Array} responses - Array of {questionId, score} objects
   * @returns {Object} Scored assessment result
   */
  score(assessmentId, responses) {
    const assessment = this.assessments[assessmentId];
    if (!assessment) {
      throw new Error(`Unknown assessment: ${assessmentId}`);
    }

    if (!Array.isArray(responses) || responses.length !== assessment.questions.length) {
      throw new Error(`Expected ${assessment.questions.length} responses, got ${responses ? responses.length : 0}`);
    }

    // Calculate total score
    const totalScore = responses.reduce((sum, r) => sum + (r.score || 0), 0);

    // Find severity level
    const severity = assessment.scoring.find(s => totalScore >= s.min && totalScore <= s.max);

    // Check for critical items (e.g., PHQ-9 question 9 about self-harm)
    const criticalItems = this._checkCriticalItems(assessmentId, responses);

    // Generate recommendations
    const recommendations = this._generateRecommendations(assessmentId, totalScore, severity, criticalItems);

    return {
      assessmentId,
      assessmentName: this.language === 'zh' ? assessment.nameZh : assessment.name,
      category: assessment.category,
      totalScore,
      maxScore: assessment.maxScore,
      percentage: Math.round((totalScore / assessment.maxScore) * 100),
      severity: severity ? {
        level: severity.level,
        label: this.language === 'zh' ? severity.label : severity.labelEn,
      } : null,
      criticalItems,
      recommendations,
      timestamp: new Date().toISOString(),
      disclaimer: '本评估仅为筛查工具，不能替代专业诊断。如有疑虑，请咨询专业心理健康工作者。',
    };
  }

  /**
   * Check for critical items that require immediate attention
   * @param {string} assessmentId - Assessment identifier
   * @param {Array} responses - User responses
   * @returns {Array} Critical items found
   */
  _checkCriticalItems(assessmentId, responses) {
    const critical = [];

    // PHQ-9: Question 9 is about suicidal ideation
    if (assessmentId === 'PHQ-9') {
      const q9 = responses.find(r => r.questionId === 9);
      if (q9 && q9.score > 0) {
        critical.push({
          questionId: 9,
          severity: q9.score >= 2 ? 'critical' : 'warning',
          message: '检测到自伤意念，建议立即寻求专业帮助',
          score: q9.score,
        });
      }
    }

    return critical;
  }

  /**
   * Generate recommendations based on assessment results
   * @param {string} assessmentId - Assessment type
   * @param {number} totalScore - Total score
   * @param {Object} severity - Severity level
   * @param {Array} criticalItems - Critical items found
   * @returns {Array} Recommendations
   */
  _generateRecommendations(assessmentId, totalScore, severity, criticalItems) {
    const recommendations = [];

    // Critical items always require immediate attention
    if (criticalItems.length > 0) {
      recommendations.push({
        priority: 'urgent',
        action: '立即联系专业心理危机干预热线（如：全国24小时心理援助热线 400-161-9995）',
        actionEn: 'Contact crisis hotline immediately',
      });
    }

    // Severity-based recommendations
    if (severity) {
      switch (severity.level) {
        case 'severe':
        case 'moderately_severe':
          recommendations.push({
            priority: 'high',
            action: '建议尽快预约专业心理医生或精神科医生进行评估',
            actionEn: 'Schedule appointment with mental health professional',
          });
          recommendations.push({
            priority: 'medium',
            action: '考虑寻求系统的心理治疗（如认知行为治疗CBT）',
            actionEn: 'Consider structured psychotherapy',
          });
          break;
        case 'moderate':
          recommendations.push({
            priority: 'medium',
            action: '建议预约心理咨询师进行评估和咨询',
            actionEn: 'Consider scheduling counseling appointment',
          });
          recommendations.push({
            priority: 'low',
            action: '尝试规律运动、充足睡眠和社交活动',
            actionEn: 'Try regular exercise, sleep, and social activities',
          });
          break;
        case 'mild':
          recommendations.push({
            priority: 'low',
            action: '可以尝试自助策略：规律作息、运动、正念冥想等',
            actionEn: 'Try self-help strategies: routine, exercise, mindfulness',
          });
          recommendations.push({
            priority: 'low',
            action: '如果症状持续或加重，建议咨询专业人士',
            actionEn: 'Consult professional if symptoms persist or worsen',
          });
          break;
        default:
          recommendations.push({
            priority: 'info',
            action: '继续保持健康的生活方式，定期进行心理健康自评',
            actionEn: 'Maintain healthy lifestyle, continue regular self-assessment',
          });
      }
    }

    return recommendations;
  }
}

/**
 * Cognitive Profile
 * Maintains a user's cognitive assessment history and progress
 */
class CognitiveProfile {
  constructor(userId, options = {}) {
    this.userId = userId;
    this.assessor = new CognitiveAssessor(options);
    this.history = [];
  }

  /**
   * Add an assessment result to the profile
   * @param {string} assessmentId - Assessment type
   * @param {Array} responses - User responses
   * @returns {Object} Assessment result
   */
  addAssessment(assessmentId, responses) {
    const result = this.assessor.score(assessmentId, responses);
    const entry = {
      id: `cog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: this.userId,
      ...result,
    };
    this.history.push(entry);
    return entry;
  }

  /**
   * Get progress over time for a specific assessment type
   * @param {string} assessmentId - Assessment type
   * @returns {Object} Progress data
   */
  getProgress(assessmentId) {
    const relevant = this.history.filter(h => h.assessmentId === assessmentId);
    if (relevant.length === 0) {
      return { assessmentId, dataPoints: 0, trend: 'insufficient_data', history: [] };
    }

    const dataPoints = relevant.map(r => ({
      score: r.totalScore,
      percentage: r.percentage,
      severity: r.severity,
      timestamp: r.timestamp,
    }));

    const trend = dataPoints.length >= 2
      ? (dataPoints[dataPoints.length - 1].score < dataPoints[0].score ? 'improving' :
         dataPoints[dataPoints.length - 1].score > dataPoints[0].score ? 'worsening' : 'stable')
      : 'insufficient_data';

    return {
      assessmentId,
      dataPoints: dataPoints.length,
      trend,
      latest: dataPoints[dataPoints.length - 1],
      history: dataPoints,
    };
  }

  /**
   * Get summary of all assessments
   * @returns {Object} Profile summary
   */
  getSummary() {
    const assessmentTypes = [...new Set(this.history.map(h => h.assessmentId))];
    const summary = {};

    for (const type of assessmentTypes) {
      const progress = this.getProgress(type);
      summary[type] = {
        totalAssessments: progress.dataPoints,
        latestScore: progress.latest ? progress.latest.score : null,
        latestSeverity: progress.latest ? progress.latest.severity : null,
        trend: progress.trend,
      };
    }

    return {
      userId: this.userId,
      totalAssessments: this.history.length,
      assessmentTypes: assessmentTypes.length,
      assessments: summary,
      lastAssessment: this.history.length > 0 ? this.history[this.history.length - 1].timestamp : null,
    };
  }
}

module.exports = { CognitiveAssessor, CognitiveProfile };
