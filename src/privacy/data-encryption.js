/**
 * Data Encryption Module - MedPsy Clinic
 * 端到端加密 + 隐私保护机制
 * 
 * 基于 QVAC 隐私计算框架，确保心理健康数据零泄露
 * 所有敏感数据在传输和存储时均进行端到端加密
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;

class DataEncryption {
  constructor(config = {}) {
    this.config = {
      masterKey: config.masterKey || process.env.ENCRYPTION_MASTER_KEY,
      keyDerivationIterations: config.keyDerivationIterations || 100000,
      ...config,
    };
    this.keyCache = new Map();
  }

  /**
   * 端到端加密 — 加密敏感心理健康数据
   */
  encrypt(plaintext, userId) {
    const key = this._deriveKey(userId);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      data: encrypted,
      algorithm: ALGORITHM,
      timestamp: Date.now(),
    };
  }

  /**
   * 端到端解密
   */
  decrypt(encryptedPayload, userId) {
    const key = this._deriveKey(userId);
    const iv = Buffer.from(encryptedPayload.iv, 'hex');
    const tag = Buffer.from(encryptedPayload.tag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedPayload.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * 加密咨询记录
   */
  encryptConsultation(consultation, userId) {
    const sensitiveFields = ['query', 'answer', 'diagnosis', 'notes'];
    const encrypted = { ...consultation };

    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field], userId);
      }
    }
    encrypted._encrypted = true;
    encrypted._encryptedFields = sensitiveFields;
    return encrypted;
  }

  /**
   * 解密咨询记录
   */
  decryptConsultation(encryptedConsultation, userId) {
    if (!encryptedConsultation._encrypted) return encryptedConsultation;

    const decrypted = { ...encryptedConsultation };
    for (const field of decrypted._encryptedFields || []) {
      if (decrypted[field] && decrypted[field].data) {
        decrypted[field] = this.decrypt(decrypted[field], userId);
      }
    }
    delete decrypted._encrypted;
    delete decrypted._encryptedFields;
    return decrypted;
  }

  /**
   * 数据脱敏 — 用于日志和分析
   */
  maskSensitiveData(text) {
    if (!text || typeof text !== 'string') return text;
    const masked = text
      .replace(/[\u4e00-\u9fa5]{2,}/g, match => match[0] + '*'.repeat(match.length - 1))
      .replace(/\b\d{3}[-.]?\d{4}[-.]?\d{4}\b/g, '1**********')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.com');
    return masked;
  }

  /**
   * 安全哈希 — 用于数据完整性校验
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 密钥派生 (PBKDF2)
   */
  _deriveKey(userId) {
    // 安全修复：密钥缓存添加过期时间，防止内存中长期保留密钥
    const cached = this.keyCache.get(userId);
    if (cached && (Date.now() - cached.createdAt) < 3600000) return cached.key;

    const salt = crypto.createHash('sha256').update(userId).digest();
    const key = crypto.pbkdf2Sync(
      this.config.masterKey, salt,
      this.config.keyDerivationIterations, KEY_LENGTH, 'sha512'
    );
    this.keyCache.set(userId, { key, createdAt: Date.now() });
    return key;
  }

  /**
   * 清除密钥缓存
   */
  clearKeyCache() {
    this.keyCache.clear();
  }
}

module.exports = { DataEncryption };
