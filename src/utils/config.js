/**
 * 配置管理模块
 * 管理应用配置的加载、验证和访问
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  server: {
    host: '0.0.0.0',
    port: 3000,
    cors: true,
    rateLimit: { windowMs: 60000, max: 100 }
  },
  database: {
    type: 'sqlite',
    path: './data/clinic.db',
    backup: { enabled: true, interval: 86400000, keepDays: 30 }
  },
  auth: {
    sessionTimeout: 3600000,
    maxLoginAttempts: 5,
    lockoutDuration: 900000,
    passwordMinLength: 8
  },
  ai: {
    emotionAnalysis: { enabled: true, threshold: 0.3 },
    cognitiveAssessment: { enabled: true },
    crisisDetection: { enabled: true, sensitivity: 'balanced' },
    therapyAdvice: { enabled: true }
  },
  logging: {
    level: 'info',
    maxBufferSize: 1000,
    file: null
  },
  security: {
    encryption: { enabled: true, algorithm: 'aes-256-gcm' },
    audit: { enabled: true, logAccess: true }
  }
};

class Config {
  constructor(options = {}) {
    this.config = this._deepMerge({}, DEFAULT_CONFIG);
    this.envPrefix = options.envPrefix || 'MEDPSY_';
    this.configPath = options.configPath || null;
    this.watchers = [];
  }

  /**
   * 从文件加载配置
   * @param {string} filePath - 配置文件路径
   */
  loadFromFile(filePath) {
    const resolvedPath = filePath || this.configPath;
    if (!resolvedPath) throw new Error('未指定配置文件路径');

    try {
      const content = fs.readFileSync(resolvedPath, 'utf8');
      let fileConfig;
      if (resolvedPath.endsWith('.json')) {
        fileConfig = JSON.parse(content);
      } else if (resolvedPath.endsWith('.yaml') || resolvedPath.endsWith('.yml')) {
        throw new Error('YAML支持需要额外安装yaml依赖');
      } else {
        throw new Error('不支持的配置文件格式');
      }
      this.config = this._deepMerge(this.config, fileConfig);
      return this;
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.warn(`配置文件不存在: ${resolvedPath}，使用默认配置`);
        return this;
      }
      throw err;
    }
  }

  /**
   * 从环境变量加载配置
   */
  loadFromEnv() {
    const env = process.env;
    const envConfig = {};

    for (const [key, value] of Object.entries(env)) {
      if (key.startsWith(this.envPrefix)) {
        const configKey = key.slice(this.envPrefix.length).toLowerCase().replace(/__/g, '.');
        this._setNestedValue(envConfig, configKey, this._parseEnvValue(value));
      }
    }

    if (Object.keys(envConfig).length > 0) {
      this.config = this._deepMerge(this.config, envConfig);
    }
    return this;
  }

  /**
   * 获取配置值
   * @param {string} keyPath - 点分路径，如 'server.port'
   * @param {*} defaultValue - 默认值
   * @returns {*}
   */
  get(keyPath, defaultValue = undefined) {
    const keys = keyPath.split('.');
    let value = this.config;
    for (const key of keys) {
      if (value === undefined || value === null) return defaultValue;
      value = value[key];
    }
    return value !== undefined ? value : defaultValue;
  }

  /**
   * 设置配置值
   * @param {string} keyPath - 点分路径
   * @param {*} value - 值
   */
  set(keyPath, value) {
    this._setNestedValue(this.config, keyPath, value);
    this._notifyWatchers(keyPath, value);
    return this;
  }

  /**
   * 监听配置变更
   * @param {Function} callback - 回调函数
   */
  watch(callback) {
    this.watchers.push(callback);
    return () => {
      this.watchers = this.watchers.filter(w => w !== callback);
    };
  }

  /**
   * 获取所有配置
   * @returns {Object}
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * 验证配置完整性
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = [];
    const port = this.get('server.port');
    if (port && (port < 1 || port > 65535)) {
      errors.push(`无效的端口号: ${port}`);
    }
    const timeout = this.get('auth.sessionTimeout');
    if (timeout && timeout < 60000) {
      errors.push('会话超时不能少于1分钟');
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * 导出配置为JSON文件
   * @param {string} filePath - 输出文件路径
   */
  exportToFile(filePath) {
    const content = JSON.stringify(this.config, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
    return this;
  }

  // --- 内部方法 ---

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  _setNestedValue(obj, keyPath, value) {
    const keys = keyPath.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  _parseEnvValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') return num;
    return value;
  }

  _notifyWatchers(keyPath, value) {
    for (const watcher of this.watchers) {
      try { watcher(keyPath, value); } catch (e) { /* ignore */ }
    }
  }
}

module.exports = { Config, DEFAULT_CONFIG };
