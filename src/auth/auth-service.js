/**
 * Authentication Service Module
 * Handles user registration, login, session management, and authorization
 */

const { DataEncryption } = require('./encryption');

class AuthService {
  constructor(options = {}) {
    this.encryption = new DataEncryption(options);
    this.userStore = new UserStore(options);
    this.sessions = new Map();
    this.sessionDuration = options.sessionDuration || 24 * 60 * 60 * 1000; // 24 hours
    this.maxLoginAttempts = options.maxLoginAttempts || 5;
    this.lockoutDuration = options.lockoutDuration || 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Registration result
   */
  async register(userData) {
    const { username, email, password, displayName } = userData;

    // Validate input
    const validation = this._validateRegistrationData(userData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Check if username or email already exists
    if (this.userStore.findByUsername(username)) {
      return { success: false, error: '用户名已存在' };
    }
    if (this.userStore.findByEmail(email)) {
      return { success: false, error: '邮箱已被注册' };
    }

    // Hash password
    const { hash, salt } = this.encryption.hashPassword(password);

    // Create user
    const user = {
      id: this.encryption.generateUUID(),
      username,
      email,
      displayName: displayName || username,
      passwordHash: hash,
      passwordSalt: salt,
      role: 'user',
      status: 'active',
      loginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.userStore.add(user);

    // Return user without sensitive data
    return {
      success: true,
      user: this._sanitizeUser(user),
      token: this._generateSession(user),
    };
  }

  /**
   * Login a user
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @returns {Object} Login result
   */
  async login(username, password) {
    // Find user
    const user = this.userStore.findByUsername(username) || this.userStore.findByEmail(username);
    if (!user) {
      return { success: false, error: '用户名或密码错误' };
    }

    // Check lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      return {
        success: false,
        error: `账户已锁定，请在${remainingMinutes}分钟后重试`,
        locked: true,
        remainingMinutes,
      };
    }

    // Verify password
    const isValid = this.encryption.verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= this.maxLoginAttempts) {
        user.lockedUntil = new Date(Date.now() + this.lockoutDuration).toISOString();
        user.loginAttempts = 0;
      }
      this.userStore.update(user);

      return {
        success: false,
        error: '用户名或密码错误',
        remainingAttempts: Math.max(0, this.maxLoginAttempts - user.loginAttempts),
      };
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date().toISOString();
    this.userStore.update(user);

    return {
      success: true,
      user: this._sanitizeUser(user),
      token: this._generateSession(user),
    };
  }

  /**
   * Logout a user
   * @param {string} token - Session token
   * @returns {Object} Logout result
   */
  logout(token) {
    if (this.sessions.has(token)) {
      this.sessions.delete(token);
      return { success: true };
    }
    return { success: false, error: '无效的会话' };
  }

  /**
   * Validate a session token
   * @param {string} token - Session token
   * @returns {Object} Validation result
   */
  validateSession(token) {
    const session = this.sessions.get(token);
    if (!session) {
      return { valid: false, error: '无效的会话' };
    }

    if (new Date(session.expiresAt) < new Date()) {
      this.sessions.delete(token);
      return { valid: false, error: '会话已过期' };
    }

    return {
      valid: true,
      userId: session.userId,
      user: this._sanitizeUser(this.userStore.findById(session.userId)),
    };
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Change result
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = this.userStore.findById(userId);
    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    // Verify old password
    const isValid = this.encryption.verifyPassword(oldPassword, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return { success: false, error: '当前密码错误' };
    }

    // Validate new password
    const validation = this._validatePassword(newPassword);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Hash new password
    const { hash, salt } = this.encryption.hashPassword(newPassword);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.updatedAt = new Date().toISOString();
    this.userStore.update(user);

    return { success: true };
  }

  /**
   * Reset password (admin function)
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Object} Reset result
   */
  async resetPassword(userId, newPassword) {
    const user = this.userStore.findById(userId);
    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    const validation = this._validatePassword(newPassword);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { hash, salt } = this.encryption.hashPassword(newPassword);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.updatedAt = new Date().toISOString();
    this.userStore.update(user);

    return { success: true };
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object|null} User data (sanitized)
   */
  getUser(userId) {
    const user = this.userStore.findById(userId);
    return user ? this._sanitizeUser(user) : null;
  }

  // Private helper methods

  _validateRegistrationData(data) {
    const { username, email, password } = data;

    if (!username || username.length < 3 || username.length > 30) {
      return { valid: false, error: '用户名长度应为3-30个字符' };
    }

    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
      return { valid: false, error: '用户名只能包含字母、数字、下划线和中文' };
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, error: '请输入有效的邮箱地址' };
    }

    const passwordValidation = this._validatePassword(password);
    if (!passwordValidation.valid) {
      return passwordValidation;
    }

    return { valid: true };
  }

  _validatePassword(password) {
    if (!password || password.length < 8) {
      return { valid: false, error: '密码长度至少8个字符' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: '密码需包含至少一个大写字母' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, error: '密码需包含至少一个小写字母' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, error: '密码需包含至少一个数字' };
    }
    return { valid: true };
  }

  _generateSession(user) {
    const token = this.encryption.generateToken(32);
    this.sessions.set(token, {
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.sessionDuration).toISOString(),
    });
    return token;
  }

  _sanitizeUser(user) {
    const { passwordHash, passwordSalt, loginAttempts, lockedUntil, ...safe } = user;
    return safe;
  }
}

/**
 * User Store - In-memory user storage with file persistence option
 */
class UserStore {
  constructor(options = {}) {
    this.users = new Map();
    this.emailIndex = new Map();
    this.usernameIndex = new Map();
  }

  add(user) {
    this.users.set(user.id, { ...user });
    this.emailIndex.set(user.email, user.id);
    this.usernameIndex.set(user.username, user.id);
  }

  update(user) {
    this.users.set(user.id, { ...user });
  }

  findById(id) {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  findByUsername(username) {
    const id = this.usernameIndex.get(username);
    return id ? this.findById(id) : null;
  }

  findByEmail(email) {
    const id = this.emailIndex.get(email);
    return id ? this.findById(id) : null;
  }

  delete(id) {
    const user = this.users.get(id);
    if (user) {
      this.users.delete(id);
      this.emailIndex.delete(user.email);
      this.usernameIndex.delete(user.username);
      return true;
    }
    return false;
  }

  count() {
    return this.users.size;
  }

  list(options = {}) {
    const { page = 1, limit = 20, role, status } = options;
    let users = [...this.users.values()];

    if (role) users = users.filter(u => u.role === role);
    if (status) users = users.filter(u => u.status === status);

    const start = (page - 1) * limit;
    const paginated = users.slice(start, start + limit);

    return {
      users: paginated.map(u => {
        const { passwordHash, passwordSalt, ...safe } = u;
        return safe;
      }),
      total: users.length,
      page,
      limit,
      totalPages: Math.ceil(users.length / limit),
    };
  }
}

module.exports = { AuthService, UserStore };
