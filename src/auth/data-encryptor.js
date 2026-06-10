/**
 * 数据加密模块
 * 提供数据加密、解密和哈希功能
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

class DataEncryptor {
  constructor(options = {}) {
    this.masterKey = options.masterKey || null;
    if (this.masterKey && typeof this.masterKey === 'string') {
      this.masterKey = Buffer.from(this.masterKey, 'hex');
    }
  }

  /**
   * 设置主密钥
   * @param {string|Buffer} key - 主密钥（hex字符串或Buffer）
   */
  setMasterKey(key) {
    if (typeof key === 'string') {
      this.masterKey = Buffer.from(key, 'hex');
    } else {
      this.masterKey = key;
    }
    if (this.masterKey.length !== KEY_LENGTH) {
      throw new Error(`密钥长度必须为 ${KEY_LENGTH} 字节`);
    }
  }

  /**
   * 生成随机密钥
   * @returns {string} hex编码的密钥
   */
  static generateKey() {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }

  /**
   * 从密码派生密钥
   * @param {string} password - 密码
   * @param {string} salt - 盐值（可选）
   * @returns {Object} 密钥和盐值
   */
  static deriveKey(password, salt = null) {
    if (!password) throw new Error('密码不能为空');
    const useSalt = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(SALT_LENGTH);
    const key = crypto.pbkdf2Sync(password, useSalt, 100000, KEY_LENGTH, 'sha512');
    return {
      key: key.toString('hex'),
      salt: useSalt.toString('hex')
    };
  }

  /**
   * 加密数据
   * @param {string} plaintext - 明文
   * @param {Buffer} key - 加密密钥（可选，默认使用masterKey）
   * @returns {Object} 加密结果
   */
  encrypt(plaintext, key = null) {
    const encKey = key || this.masterKey;
    if (!encKey) throw new Error('未设置加密密钥');
    if (!plaintext) throw new Error('明文不能为空');

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, encKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex'),
      algorithm: ALGORITHM
    };
  }

  /**
   * 解密数据
   * @param {Object} encryptedData - 加密数据对象
   * @param {Buffer} key - 解密密钥（可选）
   * @returns {string} 解密后的明文
   */
  decrypt(encryptedData, key = null) {
    const decKey = key || this.masterKey;
    if (!decKey) throw new Error('未设置解密密钥');
    if (!encryptedData || !encryptedData.data) throw new Error('无效的加密数据');

    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, decKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 加密对象（JSON序列化后加密）
   * @param {Object} obj - 要加密的对象
   * @returns {Object} 加密结果
   */
  encryptObject(obj) {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * 解密为对象
   * @param {Object} encryptedData - 加密数据
   * @returns {Object} 解密后的对象
   */
  decryptToObject(encryptedData) {
    return JSON.parse(this.decrypt(encryptedData));
  }

  /**
   * 计算哈希值
   * @param {string} data - 数据
   * @param {string} algorithm - 哈希算法（默认sha256）
   * @returns {string} 哈希值
   */
  static hash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * HMAC签名
   * @param {string} data - 数据
   * @param {string} key - 密钥
   * @returns {string} HMAC签名
   */
  static hmac(data, key) {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * 验证HMAC签名
   * @param {string} data - 数据
   * @param {string} key - 密钥
   * @param {string} signature - 签名
   * @returns {boolean} 是否匹配
   */
  static verifyHmac(data, key, signature) {
    const expected = DataEncryptor.hmac(data, key);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}

module.exports = { DataEncryptor };
