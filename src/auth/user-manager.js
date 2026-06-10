/**
 * 用户管理模块
 * 处理用户注册、认证和角色管理
 */

const crypto = require('crypto');

const ROLES = {
  PATIENT: 'patient',
  THERAPIST: 'therapist',
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor'
};

const PERMISSIONS = {
  [ROLES.PATIENT]: ['read_own', 'write_own', 'view_progress'],
  [ROLES.THERAPIST]: ['read_patients', 'write_patients', 'create_assessments', 'view_reports'],
  [ROLES.ADMIN]: ['manage_users', 'manage_system', 'view_all_data'],
  [ROLES.SUPERVISOR]: ['supervise_therapists', 'review_cases', 'manage_therapists']
};

class UserManager {
  constructor(options = {}) {
    this.users = new Map();
    this.saltRounds = options.saltRounds || 10;
  }

  /**
   * 注册新用户
   * @param {Object} userData - 用户数据
   * @returns {Object} 创建的用户信息
   */
  register(userData) {
    const { username, email, password, role = ROLES.PATIENT, profile = {} } = userData;

    if (!username || !email || !password) {
      throw new Error('用户名、邮箱和密码不能为空');
    }

    if (this._findByEmail(email)) {
      throw new Error('该邮箱已被注册');
    }

    if (this._findByUsername(username)) {
      throw new Error('该用户名已被使用');
    }

    const userId = `USR-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const passwordHash = this._hashPassword(password);

    const user = {
      userId,
      username,
      email,
      passwordHash,
      role,
      permissions: PERMISSIONS[role] || [],
      profile: {
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || null,
        ...profile
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };

    this.users.set(userId, user);
    return this._sanitizeUser(user);
  }

  /**
   * 用户认证
   * @param {string} login - 用户名或邮箱
   * @param {string} password - 密码
   * @returns {Object} 认证结果
   */
  authenticate(login, password) {
    const user = this._findByEmail(login) || this._findByUsername(login);
    if (!user) return { success: false, error: '用户不存在' };

    if (user.status !== 'active') {
      return { success: false, error: '账户已被禁用' };
    }

    const isValid = this._verifyPassword(password, user.passwordHash);
    if (!isValid) return { success: false, error: '密码错误' };

    user.lastLoginAt = new Date().toISOString();
    return {
      success: true,
      user: this._sanitizeUser(user),
      token: this._generateToken(user)
    };
  }

  /**
   * 更新用户信息
   * @param {string} userId - 用户ID
   * @param {Object} updates - 更新数据
   */
  updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) throw new Error('用户不存在');

    const allowedFields = ['profile', 'status', 'role'];
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'profile') {
          user.profile = { ...user.profile, ...value };
        } else {
          user[key] = value;
        }
      }
    }
    user.updatedAt = new Date().toISOString();

    if (updates.role) {
      user.permissions = PERMISSIONS[updates.role] || [];
    }

    return this._sanitizeUser(user);
  }

  /**
   * 检查权限
   * @param {string} userId - 用户ID
   * @param {string} permission - 权限名称
   */
  hasPermission(userId, permission) {
    const user = this.users.get(userId);
    if (!user) return false;
    return user.permissions.includes(permission);
  }

  /**
   * 获取用户列表
   * @param {Object} filter - 过滤条件
   */
  listUsers(filter = {}) {
    let users = Array.from(this.users.values());
    if (filter.role) users = users.filter(u => u.role === filter.role);
    if (filter.status) users = users.filter(u => u.status === filter.status);
    return users.map(u => this._sanitizeUser(u));
  }

  /**
   * 删除用户
   */
  deleteUser(userId) {
    if (!this.users.has(userId)) throw new Error('用户不存在');
    this.users.delete(userId);
    return { success: true, userId };
  }

  // --- 内部方法 ---

  _findByEmail(email) {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  _findByUsername(username) {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  _hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  _verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const verify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verify;
  }

  _generateToken(user) {
    const payload = {
      userId: user.userId,
      role: user.role,
      iat: Date.now()
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  _sanitizeUser(user) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}

module.exports = { UserManager, ROLES, PERMISSIONS };
