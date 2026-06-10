/**
 * 日志工具模块
 * 提供结构化日志记录功能
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

const LEVEL_LABELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

class Logger {
  constructor(options = {}) {
    this.level = options.level !== undefined ? options.level : LOG_LEVELS.INFO;
    this.prefix = options.prefix || '';
    this.output = options.output || console;
    this.buffer = [];
    this.maxBufferSize = options.maxBufferSize || 1000;
    this.sensitiveFields = options.sensitiveFields || ['password', 'token', 'secret', 'key'];
  }

  /**
   * 设置日志级别
   * @param {string} level - 日志级别名称
   */
  setLevel(level) {
    const key = level.toUpperCase();
    if (LOG_LEVELS[key] !== undefined) {
      this.level = LOG_LEVELS[key];
    }
  }

  /**
   * DEBUG级别日志
   */
  debug(message, meta = {}) {
    this._log(LOG_LEVELS.DEBUG, message, meta);
  }

  /**
   * INFO级别日志
   */
  info(message, meta = {}) {
    this._log(LOG_LEVELS.INFO, message, meta);
  }

  /**
   * WARN级别日志
   */
  warn(message, meta = {}) {
    this._log(LOG_LEVELS.WARN, message, meta);
  }

  /**
   * ERROR级别日志
   */
  error(message, meta = {}) {
    this._log(LOG_LEVELS.ERROR, message, meta);
  }

  /**
   * FATAL级别日志
   */
  fatal(message, meta = {}) {
    this._log(LOG_LEVELS.FATAL, message, meta);
  }

  /**
   * 计时器 - 开始计时
   * @param {string} label - 计时标签
   */
  timer(label) {
    if (!this._timers) this._timers = {};
    this._timers[label] = Date.now();
    return label;
  }

  /**
   * 计时器 - 结束并输出
   * @param {string} label - 计时标签
   */
  timerEnd(label) {
    if (!this._timers || !this._timers[label]) return null;
    const elapsed = Date.now() - this._timers[label];
    delete this._timers[label];
    this.info(`${label} completed`, { elapsed: `${elapsed}ms` });
    return elapsed;
  }

  /**
   * 获取日志缓冲区
   * @param {number} limit - 最多返回条数
   */
  getBuffer(limit = 100) {
    return this.buffer.slice(-limit);
  }

  /**
   * 清空缓冲区
   */
  clearBuffer() {
    this.buffer = [];
  }

  /**
   * 内部日志方法
   */
  _log(level, message, meta) {
    if (level < this.level) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: LEVEL_LABELS[level],
      message,
      meta: this._sanitizeMeta(meta)
    };

    if (this.prefix) entry.prefix = this.prefix;

    // 存入缓冲区
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // 输出到目标
    const formatted = this._format(entry);
    switch (level) {
      case LOG_LEVELS.DEBUG: this.output.debug(formatted); break;
      case LOG_LEVELS.INFO: this.output.info(formatted); break;
      case LOG_LEVELS.WARN: this.output.warn(formatted); break;
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.FATAL: this.output.error(formatted); break;
    }
  }

  /**
   * 格式化日志条目
   */
  _format(entry) {
    const metaStr = Object.keys(entry.meta).length > 0 ? ` ${JSON.stringify(entry.meta)}` : '';
    const prefixStr = entry.prefix ? `[${entry.prefix}] ` : '';
    return `${entry.timestamp} [${entry.level}] ${prefixStr}${entry.message}${metaStr}`;
  }

  /**
   * 清理敏感字段
   */
  _sanitizeMeta(meta) {
    if (!meta || typeof meta !== 'object') return {};
    const sanitized = { ...meta };
    for (const field of this.sensitiveFields) {
      if (sanitized[field]) sanitized[field] = '***REDACTED***';
    }
    return sanitized;
  }
}

module.exports = { Logger, LOG_LEVELS };
