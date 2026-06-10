/**
 * 验证工具模块
 * 提供常用的数据验证功能
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^1[3-9]\d{9}$/;
const ID_CARD_REGEX = /^\d{17}[\dXx]$/;

const DANGEROUS_PATTERNS = [
  /<script\b/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
  /vbscript:/i,
];

const MAX_INPUT_LENGTH = 10000;
const MAX_NAME_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 5000;

const validators = {
  /** Constants */
  MAX_INPUT_LENGTH,
  MAX_NAME_LENGTH,
  MAX_MESSAGE_LENGTH,

  /**
   * 验证邮箱格式
   * @param {string} email
   * @returns {boolean}
   */
  isEmail(email) {
    return typeof email === 'string' && EMAIL_REGEX.test(email);
  },

  /**
   * 验证手机号格式（中国大陆）
   * @param {string} phone
   * @returns {boolean}
   */
  isPhone(phone) {
    return typeof phone === 'string' && PHONE_REGEX.test(phone);
  },

  /**
   * 验证身份证号
   * @param {string} idCard
   * @returns {Object} 验证结果
   */
  validateIdCard(idCard) {
    if (!idCard || typeof idCard !== 'string') {
      return { valid: false, error: '身份证号不能为空' };
    }
    if (!ID_CARD_REGEX.test(idCard)) {
      return { valid: false, error: '身份证号格式不正确' };
    }
    // 校验码验证
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checksums = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * weights[i];
    }
    const expected = checksums[sum % 11];
    if (idCard[17].toUpperCase() !== expected) {
      return { valid: false, error: '身份证号校验码不正确' };
    }
    return { valid: true, birthday: idCard.substring(6, 14), gender: parseInt(idCard[16]) % 2 === 0 ? 'female' : 'male' };
  },

  /**
   * 验证密码强度
   * @param {string} password
   * @returns {Object} 验证结果
   */
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { valid: false, error: '密码不能为空', strength: 'none' };
    }
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const strength = passed <= 2 ? 'weak' : passed <= 3 ? 'medium' : passed <= 4 ? 'strong' : 'very_strong';

    return {
      valid: checks.length && passed >= 3,
      strength,
      checks,
      error: !checks.length ? '密码至少8个字符' : passed < 3 ? '密码强度不足' : null
    };
  },

  /**
   * 验证日期范围
   * @param {string} dateStr - 日期字符串
   * @param {Object} options - { min, max }
   * @returns {boolean}
   */
  isValidDate(dateStr, options = {}) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    if (options.min && date < new Date(options.min)) return false;
    if (options.max && date > new Date(options.max)) return false;
    return true;
  },

  /**
   * 验证分数范围（0-100）
   * @param {number} score
   * @returns {boolean}
   */
  isValidScore(score) {
    return typeof score === 'number' && !isNaN(score) && score >= 0 && score <= 100;
  },

  /**
   * 验证非空字符串
   * @param {string} str
   * @returns {boolean}
   */
  isNonEmptyString(str) {
    return typeof str === 'string' && str.trim().length > 0;
  },

  /**
   * 验证对象是否有必需字段
   * @param {Object} obj
   * @param {string[]} requiredFields
   * @returns {Object} 验证结果
   */
  validateRequired(obj, requiredFields) {
    if (!obj || typeof obj !== 'object') {
      return { valid: false, missing: requiredFields };
    }
    const missing = requiredFields.filter(f => obj[f] === undefined || obj[f] === null || obj[f] === '');
    return { valid: missing.length === 0, missing };
  },

  /**
   * 清理和截断字符串
   * @param {string} str
   * @param {number} maxLength
   * @returns {string}
   */
  sanitize(str, maxLength = 1000) {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, maxLength)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  /**
   * 检测输入是否包含潜在的XSS/注入内容
   * @param {string} input
   * @returns {Object} { safe: boolean, reason?: string }
   */
  isSafeInput(input) {
    if (typeof input !== 'string') return { safe: false, reason: '输入类型无效' };
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        return { safe: false, reason: '检测到不安全的内容' };
      }
    }
    return { safe: true };
  },

  /**
   * 验证并清理聊天消息输入
   * @param {string} message - 用户消息
   * @returns {Object} { valid: boolean, sanitized: string, error?: string }
   */
  validateChatMessage(message) {
    if (!message || typeof message !== 'string') {
      return { valid: false, sanitized: '', error: '消息不能为空' };
    }
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return { valid: false, sanitized: '', error: '消息不能为空' };
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, sanitized: '', error: `消息过长，最多 ${MAX_MESSAGE_LENGTH} 字符` };
    }
    const safetyCheck = this.isSafeInput(trimmed);
    if (!safetyCheck.safe) {
      return { valid: false, sanitized: '', error: safetyCheck.reason };
    }
    return { valid: true, sanitized: this.sanitize(trimmed, MAX_MESSAGE_LENGTH) };
  },

  /**
   * 验证用户名
   * @param {string} name
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateUsername(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: '用户名不能为空' };
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      return { valid: false, error: '用户名至少2个字符' };
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      return { valid: false, error: `用户名过长，最多 ${MAX_NAME_LENGTH} 字符` };
    }
    if (!/^[\u4e00-\u9fff\w-]+$/.test(trimmed)) {
      return { valid: false, error: '用户名只能包含中文、字母、数字、下划线和连字符' };
    }
    return { valid: true };
  },
};

module.exports = validators;
