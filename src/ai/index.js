/**
 * AI功能模块入口
 * 汇总导出所有AI子模块
 */

const { EmotionAnalyzer, EMOTION_LABELS, INTENSITY_LEVELS } = require('./emotion-analyzer');
const { CognitiveAssessor, COGNITIVE_DOMAINS, SEVERITY_LEVELS } = require('./cognitive-assessor');
const { TherapyAdvisor, THERAPY_TYPES } = require('./therapy-advisor');
const { CrisisDetector, RISK_LEVELS } = require('./crisis-detector');

module.exports = {
  // 情绪分析
  EmotionAnalyzer,
  EMOTION_LABELS,
  INTENSITY_LEVELS,

  // 认知评估
  CognitiveAssessor,
  COGNITIVE_DOMAINS,
  SEVERITY_LEVELS,

  // 治疗建议
  TherapyAdvisor,
  THERAPY_TYPES,

  // 危机检测
  CrisisDetector,
  RISK_LEVELS
};
