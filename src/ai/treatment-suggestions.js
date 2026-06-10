/**
 * Treatment Suggestions Module
 * AI-powered treatment recommendation engine for mental health conditions
 * Integrates evidence-based therapeutic approaches with personalized recommendations
 */

class TreatmentRecommender {
  constructor(options = {}) {
    this.language = options.language || 'zh';
    this.treatmentDatabase = this._buildTreatmentDatabase();
    this.therapyApproaches = this._buildTherapyApproaches();
  }

  /**
   * Build comprehensive treatment database
   * @returns {Object} Treatment options organized by condition
   */
  _buildTreatmentDatabase() {
    return {
      depression: {
        name: '抑郁症治疗方案',
        severityLevels: {
          mild: {
            primary: ['cbt', 'behavioral_activation', 'exercise'],
            secondary: ['mindfulness', 'social_support', 'sleep_hygiene'],
            description: '轻度抑郁建议以心理治疗和生活方式调整为主',
          },
          moderate: {
            primary: ['cbt', 'medication', 'interpersonal_therapy'],
            secondary: ['exercise', 'mindfulness', 'group_therapy'],
            description: '中度抑郁建议结合药物治疗和心理治疗',
          },
          severe: {
            primary: ['medication', 'cbt', 'crisis_intervention'],
            secondary: ['hospitalization_evaluation', 'support_network'],
            description: '重度抑郁建议药物治疗为主，配合心理治疗，评估是否需要住院',
          },
        },
      },
      anxiety: {
        name: '焦虑症治疗方案',
        severityLevels: {
          mild: {
            primary: ['cbt', 'relaxation_training', 'mindfulness'],
            secondary: ['lifestyle_changes', 'stress_management', 'exposure'],
            description: '轻度焦虑建议认知行为治疗和放松训练',
          },
          moderate: {
            primary: ['cbt', 'exposure_therapy', 'medication'],
            secondary: ['mindfulness', 'group_therapy', 'lifestyle'],
            description: '中度焦虑建议系统脱敏治疗结合药物',
          },
          severe: {
            primary: ['medication', 'cbt', 'crisis_management'],
            secondary: ['intensive_outpatient', 'support_network'],
            description: '重度焦虑建议药物控制症状，配合系统心理治疗',
          },
        },
      },
      ptsd: {
        name: 'PTSD治疗方案',
        severityLevels: {
          mild: {
            primary: ['emdr', 'trauma_focused_cbt', 'grounding'],
            secondary: ['mindfulness', 'support_groups', 'self_care'],
            description: '轻度PTSD建议创伤聚焦心理治疗',
          },
          moderate: {
            primary: ['emdr', 'pe', 'cpt'],
            secondary: ['medication', 'group_therapy', 'lifestyle'],
            description: '中度PTSD建议延长暴露疗法或认知加工治疗',
          },
          severe: {
            primary: ['medication', 'emdr', 'stabilization'],
            secondary: ['hospitalization_evaluation', 'support_network'],
            description: '重度PTSD建议先稳定症状，再进行创伤治疗',
          },
        },
      },
      insomnia: {
        name: '失眠治疗方案',
        severityLevels: {
          mild: {
            primary: ['cbt_i', 'sleep_hygiene', 'relaxation'],
            secondary: ['stimulus_control', 'sleep_restriction'],
            description: '轻度失眠建议认知行为治疗-失眠版（CBT-I）',
          },
          moderate: {
            primary: ['cbt_i', 'sleep_restriction', 'medication_short_term'],
            secondary: ['mindfulness', 'lifestyle'],
            description: '中度失眠建议CBT-I结合短期药物辅助',
          },
          severe: {
            primary: ['medication', 'cbt_i', 'sleep_study'],
            secondary: ['medical_evaluation', 'comorbidity_treatment'],
            description: '重度失眠建议药物治疗配合睡眠评估',
          },
        },
      },
      stress: {
        name: '压力管理方案',
        severityLevels: {
          mild: {
            primary: ['stress_management', 'time_management', 'relaxation'],
            secondary: ['exercise', 'social_support', 'hobbies'],
            description: '轻度压力建议压力管理和时间管理技巧',
          },
          moderate: {
            primary: ['cbt', 'mindfulness', 'stress_inoculation'],
            secondary: ['lifestyle_changes', 'boundary_setting'],
            description: '中度压力建议认知行为治疗和正念减压',
          },
          severe: {
            primary: ['professional_help', 'crisis_support', 'medical_evaluation'],
            secondary: ['workplace_intervention', 'support_network'],
            description: '重度压力建议寻求专业帮助，评估是否需要休假调整',
          },
        },
      },
    };
  }

  /**
   * Build therapy approach descriptions
   * @returns {Object} Therapy approaches with details
   */
  _buildTherapyApproaches() {
    return {
      cbt: {
        name: '认知行为治疗（CBT）',
        nameEn: 'Cognitive Behavioral Therapy',
        description: '通过识别和改变不良思维模式和行为习惯来改善心理健康',
        evidence: 'A级证据，对抑郁和焦虑有显著效果',
        duration: '通常12-20次，每次50分钟',
        techniques: ['认知重建', '行为激活', '暴露训练', '问题解决'],
      },
      emdr: {
        name: '眼动脱敏再加工（EMDR）',
        nameEn: 'Eye Movement Desensitization and Reprocessing',
        description: '通过双侧刺激帮助大脑重新加工创伤记忆',
        evidence: 'A级证据，对PTSD有显著效果',
        duration: '通常6-12次，每次60-90分钟',
        techniques: ['眼动', '双侧刺激', '创伤记忆加工', '资源安装'],
      },
      mindfulness: {
        name: '正念疗法',
        nameEn: 'Mindfulness-Based Therapy',
        description: '通过培养对当下经验的非评判性觉察来减轻心理痛苦',
        evidence: 'B级证据，对复发预防有效',
        duration: '8周课程，每周2-2.5小时',
        techniques: ['正念冥想', '身体扫描', '正念行走', '正念进食'],
      },
      behavioral_activation: {
        name: '行为激活',
        nameEn: 'Behavioral Activation',
        description: '通过增加积极活动和减少回避行为来改善情绪',
        evidence: 'A级证据，对抑郁有良好效果',
        duration: '通常12-16次',
        techniques: ['活动计划', '愉悦活动清单', '价值导向活动', '行为实验'],
      },
      exposure_therapy: {
        name: '暴露治疗',
        nameEn: 'Exposure Therapy',
        description: '通过系统暴露于恐惧刺激来减少焦虑反应',
        evidence: 'A级证据，对焦虑障碍效果显著',
        duration: '通常8-15次',
        techniques: ['系统脱敏', '逐级暴露', '满灌疗法', '虚拟现实暴露'],
      },
      interpersonal_therapy: {
        name: '人际关系治疗（IPT）',
        nameEn: 'Interpersonal Therapy',
        description: '通过改善人际关系来缓解抑郁症状',
        evidence: 'A级证据，对抑郁有效',
        duration: '通常12-16次，每次50分钟',
        techniques: ['人际关系分析', '沟通技巧', '角色扮演', '哀伤处理'],
      },
      relaxation_training: {
        name: '放松训练',
        nameEn: 'Relaxation Training',
        description: '通过渐进性肌肉放松、呼吸训练等技术减轻生理紧张',
        evidence: 'B级证据，对焦虑和压力有效',
        duration: '4-8次训练',
        techniques: ['渐进性肌肉放松', '腹式呼吸', '引导想象', '自生训练'],
      },
      cbt_i: {
        name: '失眠认知行为治疗（CBT-I）',
        nameEn: 'CBT for Insomnia',
        description: '通过改变与睡眠相关的不良认知和行为来改善睡眠',
        evidence: 'A级证据，失眠一线治疗',
        duration: '通常4-8次',
        techniques: ['睡眠限制', '刺激控制', '睡眠卫生', '认知重建'],
      },
      group_therapy: {
        name: '团体心理治疗',
        nameEn: 'Group Therapy',
        description: '在治疗师引导下，通过团体互动获得支持和洞察',
        evidence: 'B级证据，社交焦虑和抑郁有效',
        duration: '通常8-16次，每次90-120分钟',
        techniques: ['团体讨论', '角色扮演', '同伴支持', '社交技能训练'],
      },
      medication: {
        name: '药物治疗',
        nameEn: 'Pharmacotherapy',
        description: '在精神科医生指导下使用抗抑郁药、抗焦虑药等',
        evidence: 'A级证据，需医生处方',
        duration: '根据病情，通常至少6-12个月',
        techniques: ['SSRI', 'SNRI', '苯二氮卓类（短期）', '其他处方药'],
        note: '药物治疗必须在专业精神科医生指导下进行',
      },
      crisis_intervention: {
        name: '危机干预',
        nameEn: 'Crisis Intervention',
        description: '为处于心理危机状态的个体提供紧急支持和干预',
        evidence: '标准治疗',
        duration: '即时介入',
        techniques: ['安全评估', '情绪稳定', '资源链接', '后续随访'],
      },
    };
  }

  /**
   * Generate treatment recommendations based on assessment results
   * @param {Object} assessmentData - Assessment results
   * @returns {Object} Personalized treatment plan
   */
  recommend(assessmentData) {
    const { condition, severity, userProfile = {} } = assessmentData;

    const conditionData = this.treatmentDatabase[condition];
    if (!conditionData) {
      return {
        success: false,
        error: `Unknown condition: ${condition}`,
        availableConditions: Object.keys(this.treatmentDatabase),
      };
    }

    const severityData = conditionData.severityLevels[severity];
    if (!severityData) {
      return {
        success: false,
        error: `Unknown severity level: ${severity}`,
        availableLevels: Object.keys(conditionData.severityLevels),
      };
    }

    // Build personalized recommendations
    const primaryTreatments = severityData.primary.map(id => ({
      id,
      ...this.therapyApproaches[id],
      priority: 'primary',
    }));

    const secondaryTreatments = severityData.secondary.map(id => ({
      id,
      ...this.therapyApproaches[id],
      priority: 'secondary',
    }));

    // Apply personalization based on user profile
    const personalized = this._personalize(primaryTreatments, secondaryTreatments, userProfile);

    return {
      success: true,
      condition: conditionData.name,
      severity,
      description: severityData.description,
      primaryRecommendations: personalized.primary,
      secondaryRecommendations: personalized.secondary,
      disclaimer: '以上建议仅供参考，具体治疗方案请咨询专业心理健康工作者。',
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Personalize recommendations based on user profile
   * @param {Array} primary - Primary treatment options
   * @param {Array} secondary - Secondary treatment options
   * @param {Object} profile - User profile
   * @returns {Object} Personalized recommendations
   */
  _personalize(primary, secondary, profile) {
    let personalizedPrimary = [...primary];
    let personalizedSecondary = [...secondary];

    // Age-based adjustments
    if (profile.age && profile.age < 18) {
      personalizedPrimary = personalizedPrimary.map(t => ({
        ...t,
        note: '未成年人治疗需家长知情同意，优先考虑心理治疗',
      }));
    }

    // Pregnancy considerations
    if (profile.pregnant) {
      personalizedPrimary = personalizedPrimary.filter(t => t.id !== 'medication');
      personalizedSecondary = personalizedSecondary.map(t => ({
        ...t,
        note: t.id === 'medication' ? '孕期用药需特别谨慎，必须由医生评估' : t.note,
      }));
    }

    // Previous treatment history
    if (profile.previousTreatments) {
      for (const treatment of profile.previousTreatments) {
        const inPrimary = personalizedPrimary.find(t => t.id === treatment.id);
        if (inPrimary && treatment.effective === false) {
          inPrimary.note = '您此前尝试过此方法效果不佳，建议与治疗师讨论调整方案';
        }
      }
    }

    return { primary: personalizedPrimary, secondary: personalizedSecondary };
  }

  /**
   * Get self-help suggestions
   * @param {string} category - Mental health category
   * @returns {Array} Self-help suggestions
   */
  getSelfHelp(category) {
    const suggestions = {
      depression: [
        { title: '行为激活计划', description: '每天安排至少1项愉悦活动', category: 'behavioral' },
        { title: '运动处方', description: '每周至少150分钟中等强度有氧运动', category: 'lifestyle' },
        { title: '社交联系', description: '每周至少与亲友联系3次', category: 'social' },
        { title: '睡眠规律', description: '固定就寝和起床时间，避免午睡超过30分钟', category: 'sleep' },
        { title: '正念冥想', description: '每天10分钟正念呼吸练习', category: 'mindfulness' },
      ],
      anxiety: [
        { title: '深呼吸练习', description: '每天3次4-7-8呼吸法', category: 'relaxation' },
        { title: '渐进性肌肉放松', description: '每天睡前进行15分钟PMR', category: 'relaxation' },
        { title: '正念减压', description: '每天15分钟正念冥想', category: 'mindfulness' },
        { title: '限制咖啡因', description: '减少咖啡因摄入，下午2点后不摄入', category: 'lifestyle' },
        { title: '焦虑日记', description: '记录焦虑触发因素和应对方式', category: 'cognitive' },
      ],
      insomnia: [
        { title: '睡眠卫生', description: '保持卧室凉爽、黑暗、安静', category: 'environment' },
        { title: '刺激控制', description: '只在困倦时上床，20分钟无法入睡则离开', category: 'behavioral' },
        { title: '限制屏幕时间', description: '睡前1小时避免电子屏幕', category: 'lifestyle' },
        { title: '睡前仪式', description: '建立固定的睡前放松流程', category: 'behavioral' },
        { title: '避免时钟', description: '不要在夜间看时间', category: 'cognitive' },
      ],
    };

    return suggestions[category] || suggestions.depression;
  }
}

/**
 * Treatment Plan
 * Manages a structured treatment plan for a user
 */
class TreatmentPlan {
  constructor(userId, options = {}) {
    this.userId = userId;
    this.recommender = new TreatmentRecommender(options);
    this.plans = [];
    this.goals = [];
    this.sessions = [];
  }

  /**
   * Create a new treatment plan
   * @param {Object} assessmentData - Assessment results
   * @returns {Object} Created plan
   */
  createPlan(assessmentData) {
    const recommendation = this.recommender.recommend(assessmentData);
    if (!recommendation.success) return recommendation;

    const plan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: this.userId,
      condition: assessmentData.condition,
      severity: assessmentData.severity,
      recommendation,
      goals: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.plans.push(plan);
    return plan;
  }

  /**
   * Add a goal to a treatment plan
   * @param {string} planId - Plan identifier
   * @param {Object} goal - Goal details
   * @returns {Object} Updated plan
   */
  addGoal(planId, goal) {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const newGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      description: goal.description,
      targetDate: goal.targetDate,
      metrics: goal.metrics || [],
      status: 'active',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    plan.goals.push(newGoal);
    plan.updatedAt = new Date().toISOString();
    return plan;
  }

  /**
   * Record a therapy session
   * @param {Object} sessionData - Session details
   * @returns {Object} Recorded session
   */
  recordSession(sessionData) {
    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId: this.userId,
      planId: sessionData.planId,
      type: sessionData.type || 'individual',
      duration: sessionData.duration || 50,
      notes: sessionData.notes || '',
      moodBefore: sessionData.moodBefore,
      moodAfter: sessionData.moodAfter,
      homework: sessionData.homework || [],
      timestamp: new Date().toISOString(),
    };

    this.sessions.push(session);
    return session;
  }

  /**
   * Get treatment progress summary
   * @returns {Object} Progress summary
   */
  getProgressSummary() {
    const activePlans = this.plans.filter(p => p.status === 'active');
    const totalGoals = activePlans.reduce((sum, p) => sum + p.goals.length, 0);
    const completedGoals = activePlans.reduce((sum, p) =>
      sum + p.goals.filter(g => g.status === 'completed').length, 0);

    return {
      userId: this.userId,
      activePlans: activePlans.length,
      totalSessions: this.sessions.length,
      totalGoals,
      completedGoals,
      goalCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      recentSessions: this.sessions.slice(-5),
    };
  }
}

module.exports = { TreatmentRecommender, TreatmentPlan };
