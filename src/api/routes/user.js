/**
 * MedPsy Clinic - User Routes
 * User registration, login, and profile management
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { generateToken, revokeToken, authMiddleware } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimit');
const { sanitize, validateChatMessage, validateUsername } = require('../../utils/validators');

// In-memory user store (use DB in production)
const users = new Map();

const BCRYPT_SALT_ROUNDS = 12;

/**
 * POST /register - Register a new user
 */
router.post('/register', strictLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check uniqueness
    for (const u of users.values()) {
      if (u.email === email) return res.status(409).json({ error: 'Email already registered' });
      if (u.username === username) return res.status(409).json({ error: 'Username taken' });
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = {
      id,
      username,
      email,
      passwordHash,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: { displayName: username, avatar: null, bio: '' },
    };
    users.set(id, user);

    const token = generateToken({ id: user.id, username: user.username, role: user.role });
    res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error('[User] Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /login - User login
 */
router.post('/login', strictLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = [...users.values()].find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role });
    res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error('[User] Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /logout - Revoke current token
 */
router.post('/logout', authMiddleware, (req, res) => {
  if (req.token) revokeToken(req.token);
  res.json({ message: 'Logged out successfully' });
});

/**
 * GET /profile - Get current user profile
 */
router.get('/profile', authMiddleware, (req, res) => {
  const user = users.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
});

/**
 * PUT /profile - Update current user profile
 */
router.put('/profile', authMiddleware, (req, res) => {
  const user = users.get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { displayName, avatar, bio } = req.body;
  // 安全修复：对用户输入进行XSS净化，防止存储型XSS
  if (displayName) {
    const nameCheck = validateUsername(displayName);
    if (!nameCheck.valid) return res.status(400).json({ error: nameCheck.error });
    user.profile.displayName = sanitize(displayName, 100);
  }
  if (avatar !== undefined) {
    // 安全修复：限制avatar为安全URL格式
    if (typeof avatar === 'string' && avatar.length > 0) {
      if (!/^https?:\/\/.+/.test(avatar) && !avatar.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Avatar must be a valid URL or data URI' });
      }
      user.profile.avatar = avatar.substring(0, 2048);
    } else {
      user.profile.avatar = null;
    }
  }
  if (bio !== undefined) {
    user.profile.bio = sanitize(String(bio), 500);
  }
  user.updatedAt = new Date();

  res.json({ message: 'Profile updated', profile: user.profile });
});

module.exports = router;
