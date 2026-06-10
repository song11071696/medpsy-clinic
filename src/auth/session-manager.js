/**
 * 会话管理模块
 * 管理用户会话的生命周期
 */

const crypto = require('crypto');

const SESSION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked'
};

const DEFAULT_SESSION_CONFIG = {
  maxAge: 3600 * 1000,        // 1小时（毫秒）
  maxIdleTime: 1800 * 1000,   // 30分钟空闲超时
  maxConcurrentSessions: 5,    // 最大并发会话数
  renewalThreshold: 300 * 1000 // 续期阈值：5分钟
};

class SessionManager {
  constructor(options = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...options };
    this.sessions = new Map();
    this.userSessions = new Map(); // userId -> Set<sessionId>
  }

  /**
   * 创建会话
   * @param {string} userId - 用户ID
   * @param {Object} metadata - 会话元数据
   * @returns {Object} 会话信息
   */
  createSession(userId, metadata = {}) {
    if (!userId) throw new Error('用户ID不能为空');

    // 检查并发会话数限制
    const userSessionSet = this.userSessions.get(userId) || new Set();
    if (userSessionSet.size >= this.config.maxConcurrentSessions) {
      // 移除最旧的会话
      const oldestId = userSessionSet.values().next().value;
      this.revokeSession(oldestId);
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();

    const session = {
      sessionId,
      userId,
      status: SESSION_STATUS.ACTIVE,
      createdAt: now,
      expiresAt: now + this.config.maxAge,
      lastActivityAt: now,
      metadata: {
        ip: metadata.ip || null,
        userAgent: metadata.userAgent || null,
        device: metadata.device || null,
        ...metadata
      }
    };

    this.sessions.set(sessionId, session);

    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId).add(sessionId);

    return {
      sessionId,
      userId,
      expiresAt: new Date(session.expiresAt).toISOString(),
      createdAt: new Date(session.createdAt).toISOString()
    };
  }

  /**
   * 验证并获取会话
   * @param {string} sessionId - 会话ID
   * @returns {Object|null} 会话信息或null
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const now = Date.now();

    // 检查是否过期
    if (now > session.expiresAt || now - session.lastActivityAt > this.config.maxIdleTime) {
      this._expireSession(sessionId);
      return null;
    }

    if (session.status !== SESSION_STATUS.ACTIVE) return null;

    // 更新最后活动时间
    session.lastActivityAt = now;

    // 检查是否需要续期
    if (session.expiresAt - now < this.config.renewalThreshold) {
      session.expiresAt = now + this.config.maxAge;
    }

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      status: session.status,
      expiresAt: new Date(session.expiresAt).toISOString(),
      metadata: session.metadata
    };
  }

  /**
   * 撤销会话
   * @param {string} sessionId - 会话ID
   */
  revokeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = SESSION_STATUS.REVOKED;
    session.revokedAt = Date.now();

    const userSet = this.userSessions.get(session.userId);
    if (userSet) userSet.delete(sessionId);

    return true;
  }

  /**
   * 撤销用户所有会话
   * @param {string} userId - 用户ID
   */
  revokeAllUserSessions(userId) {
    const userSet = this.userSessions.get(userId);
    if (!userSet) return 0;

    let count = 0;
    for (const sid of userSet) {
      this.revokeSession(sid);
      count++;
    }
    return count;
  }

  /**
   * 获取用户所有活跃会话
   * @param {string} userId - 用户ID
   */
  getUserSessions(userId) {
    const userSet = this.userSessions.get(userId);
    if (!userSet) return [];

    const activeSessions = [];
    for (const sid of userSet) {
      const session = this.getSession(sid);
      if (session) activeSessions.push(session);
    }
    return activeSessions;
  }

  /**
   * 清理过期会话
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, session] of this.sessions) {
      if (now > session.expiresAt ||
          now - session.lastActivityAt > this.config.maxIdleTime ||
          session.status !== SESSION_STATUS.ACTIVE) {
        this._expireSession(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  /**
   * 获取会话统计
   */
  getStats() {
    let active = 0, expired = 0, revoked = 0;
    for (const session of this.sessions.values()) {
      if (session.status === SESSION_STATUS.ACTIVE) active++;
      else if (session.status === SESSION_STATUS.EXPIRED) expired++;
      else revoked++;
    }
    return { total: this.sessions.size, active, expired, revoked };
  }

  // --- 内部方法 ---

  _expireSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = SESSION_STATUS.EXPIRED;
      const userSet = this.userSessions.get(session.userId);
      if (userSet) userSet.delete(sessionId);
    }
  }
}

module.exports = { SessionManager, SESSION_STATUS };
