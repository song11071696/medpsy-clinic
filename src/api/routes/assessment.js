/**
 * MedPsy Clinic - Assessment Routes
 * Psychological assessment tools (PHQ-9, GAD-7, etc.)
 */

const express = require('express');
const router = express.Router();

// In-memory assessment store
const assessments = new Map();

// Assessment templates
const templates = {
  'phq-9': {
    name: 'Patient Health Questionnaire-9',
    description: '抑郁症状筛查量表',
    questions: [
      { id: 1, text: '做事时提不起劲或没有兴趣', options: [0, 1, 2, 3] },
      { id: 2, text: '感到心情低落、沮丧或绝望', options: [0, 1, 2, 3] },
      { id: 3, text: '入睡困难、睡不安稳或睡眠过多', options: [0, 1, 2, 3] },
      { id: 4, text: '感觉疲倦或没有活力', options: [0, 1, 2, 3] },
      { id: 5, text: '食欲不振或吃太多', options: [0, 1, 2, 3] },
      { id: 6, text: '觉得自己很糟或很失败', options: [0, 1, 2, 3] },
      { id: 7, text: '注意力难以集中', options: [0, 1, 2, 3] },
      { id: 8, text: '动作或说话速度变慢/坐立不安', options: [0, 1, 2, 3] },
      { id: 9, text: '有不如死掉或伤害自己的念头', options: [0, 1, 2, 3] },
    ],
    maxScore: 27,
    severity: [
      { min: 0, max: 4, level: '无/极轻微', color: '#4CAF50' },
      { min: 5, max: 9, level: '轻度', color: '#FFC107' },
      { min: 10, max: 14, level: '中度', color: '#FF9800' },
      { min: 15, max: 19, level: '中重度', color: '#FF5722' },
      { min: 20, max: 27, level: '重度', color: '#F44336' },
    ],
  },
  'gad-7': {
    name: 'Generalized Anxiety Disorder-7',
    description: '广泛性焦虑障碍筛查量表',
    questions: [
      { id: 1, text: '感到紧张、焦虑或急切', options: [0, 1, 2, 3] },
      { id: 2, text: '不能停止或控制担忧', options: [0, 1, 2, 3] },
      { id: 3, text: '对各种各样的事情担忧过多', options: [0, 1, 2, 3] },
      { id: 4, text: '很难放松下来', options: [0, 1, 2, 3] },
      { id: 5, text: '坐立不安', options: [0, 1, 2, 3] },
      { id: 6, text: '变得容易烦恼或急躁', options: [0, 1, 2, 3] },
      { id: 7, text: '感到似乎将有可怕的事情发生', options: [0, 1, 2, 3] },
    ],
    maxScore: 21,
    severity: [
      { min: 0, max: 4, level: '无/极轻微', color: '#4CAF50' },
      { min: 5, max: 9, level: '轻度', color: '#FFC107' },
      { min: 10, max: 14, level: '中度', color: '#FF9800' },
      { min: 15, max: 21, level: '重度', color: '#F44336' },
    ],
  },
};

/**
 * POST /create - Create a new assessment
 */
router.post('/create', (req, res) => {
  const { templateId } = req.body;
  if (!templateId || !templates[templateId]) {
    return res.status(400).json({
      error: 'Invalid template',
      available: Object.keys(templates),
    });
  }

  const id = `asm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const assessment = {
    id,
    templateId,
    userId: req.user?.id || 'anonymous',
    status: 'in_progress',
    answers: {},
    createdAt: new Date(),
    completedAt: null,
    result: null,
  };
  assessments.set(id, assessment);

  const template = templates[templateId];
  res.status(201).json({
    assessmentId: id,
    template: {
      name: template.name,
      description: template.description,
      questions: template.questions,
    },
    status: assessment.status,
  });
});

/**
 * GET /:id - Get assessment details
 */
router.get('/:id', (req, res) => {
  const assessment = assessments.get(req.params.id);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
  res.json(assessment);
});

/**
 * POST /:id/submit - Submit assessment answers and get results
 */
router.post('/:id/submit', (req, res) => {
  const assessment = assessments.get(req.params.id);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
  if (assessment.status === 'completed') {
    return res.status(400).json({ error: 'Assessment already completed' });
  }

  const { answers } = req.body;
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Answers object is required' });
  }

  const template = templates[assessment.templateId];
  // Validate all questions answered
  for (const q of template.questions) {
    if (answers[q.id] === undefined) {
      return res.status(400).json({ error: `Missing answer for question ${q.id}` });
    }
    if (!q.options.includes(answers[q.id])) {
      return res.status(400).json({ error: `Invalid answer for question ${q.id}` });
    }
  }

  assessment.answers = answers;
  assessment.status = 'completed';
  assessment.completedAt = new Date();

  // Calculate score
  const totalScore = Object.values(answers).reduce((sum, v) => sum + v, 0);
  const severity = template.severity.find((s) => totalScore >= s.min && totalScore <= s.max);

  // Check crisis item (Q9 of PHQ-9)
  const crisisFlag = assessment.templateId === 'phq-9' && answers[9] > 0;

  assessment.result = {
    totalScore,
    maxScore: template.maxScore,
    severity: severity?.level || '未知',
    severityColor: severity?.color || '#999',
    percentage: Math.round((totalScore / template.maxScore) * 100),
    crisisFlag,
    interpretation: generateInterpretation(assessment.templateId, totalScore, severity),
  };

  if (crisisFlag) {
    assessment.result.crisisMessage = '您的回答中包含自伤相关的想法。如果您正在经历危机，请拨打24小时心理援助热线：400-161-9995';
  }

  res.json(assessment);
});

/**
 * GET /history - Get user's assessment history
 */
router.get('/history/list', (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const userAssessments = [...assessments.values()]
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    total: userAssessments.length,
    assessments: userAssessments.map((a) => ({
      id: a.id,
      templateId: a.templateId,
      status: a.status,
      createdAt: a.createdAt,
      completedAt: a.completedAt,
      result: a.result ? { totalScore: a.result.totalScore, severity: a.result.severity } : null,
    })),
  });
});

/**
 * GET /templates - List available assessment templates
 */
router.get('/templates/list', (req, res) => {
  res.json({
    templates: Object.entries(templates).map(([id, t]) => ({
      id,
      name: t.name,
      description: t.description,
      questionCount: t.questions.length,
      maxScore: t.maxScore,
    })),
  });
});

function generateInterpretation(templateId, score, severity) {
  if (!severity) return '评分结果无法解读';
  const level = severity.level;
  if (level === '无/极轻微') return '您目前的心理状态良好，建议保持健康的生活方式。';
  if (level === '轻度') return '您存在轻度症状，建议关注自身情绪变化，尝试放松训练。';
  if (level === '中度') return '您存在中度症状，建议寻求专业心理咨询师的帮助。';
  if (level === '中重度' || level === '重度') return '您的症状较为严重，强烈建议尽快寻求专业的精神卫生服务。';
  return '建议咨询专业人员获取个性化解读。';
}

module.exports = router;
