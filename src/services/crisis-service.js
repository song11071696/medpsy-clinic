// src/services/crisis-service.js
/**
 * 统一危机检测服务
 * 合并 crisis-detection.js / crisis-detector.js / crisis.js / crisis-intervention.js
 * 唯一被 api-server.js 引用的危机检测入口
 */

const { CrisisDetector } = require('../ai/crisis-detection');
const { DataEncryption } = require('../privacy/data-encryption');

// 统一热线配置（Single Source of Truth）
const CRISIS_HOTLINES = {
  zh: [
    { name: '全国24小时心理援助热线', phone: '400-161-9995' },
    { name: '北京心理危机研究与干预中心', phone: '010-82951332' },
    { name: '生命热线', phone: '400-821-1215' },
    { name: '希望24热线', phone: '400-161-9995' },
    { name: '青少年服务热线', phone: '12355' },
    { name: '紧急救援', phone: '120' },
  ],
  en: [
    { name: '988 Suicide & Crisis Lifeline', phone: '988' },
    { name: 'Crisis Text Line', phone: 'Text HOME to 741741' },
    { name: 'International Association for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres/' },
  ],
};

const encryption = new DataEncryption();

class CrisisService {
  constructor() {
    this.detector = new CrisisDetector({ sensitivity: 'high', language: 'zh' });
    this.crisisLog = [];
  }

  /**
   * 分析用户输入，返回危机检测结果
   * @param {string} query - 用户输入
   * @param {string} userId - 用户标识
   * @returns {{ level: string, detected: boolean, hotlines: Array, shouldBlock: boolean }}
   */
  analyze(query, userId = 'anonymous') {
    const result = this.detector.analyze(query);
    const detected = result.severity && result.severity !== 'low' && result.severity !== 'none';

    if (detected) {
      this.crisisLog.push({
        timestamp: new Date().toISOString(),
        userId,
        severity: result.severity,
        maskedQuery: encryption.maskSensitiveData(query),
        categories: result.categories || [],
      });
    }

    return {
      level: result.severity || 'none',
      detected,
      categories: result.categories || [],
      score: result.score || 0,
      hotlines: CRISIS_HOTLINES,
      shouldBlock: result.severity === 'critical',
      message: this._getCrisisMessage(result.severity),
    };
  }

  _getCrisisMessage(severity) {
    switch (severity) {
      case 'critical':
        return '⚠️ 我注意到您可能正在经历非常困难的时刻。您的安全是最重要的。请立即联系以下专业热线获取帮助：';
      case 'high':
        return '💙 我感受到您正在经历很大的痛苦。请考虑联系专业心理健康服务获取支持：';
      case 'moderate':
        return '🤝 您分享的内容让我关心您的状态。如果您需要倾诉，以下资源可以提供帮助：';
      default:
        return null;
    }
  }
}

module.exports = { CrisisService, CRISIS_HOTLINES };
