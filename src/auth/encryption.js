/**
 * Data Encryption Module
 * Provides encryption/decryption for sensitive user data
 * Uses AES-256-GCM for authenticated encryption
 */

const crypto = require('crypto');

class DataEncryption {
  constructor(options = {}) {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.saltLength = 64;
    this.iterations = 100000;
    this.digest = 'sha512';

    // Master key from environment or generate one
    this.masterKey = options.masterKey || process.env.ENCRYPTION_KEY || this._generateKey();
  }

  /**
   * Generate a random encryption key
   * @returns {string} Hex-encoded key
   */
  _generateKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Derive an encryption key from a password
   * @param {string} password - User password
   * @param {string} salt - Salt for key derivation
   * @returns {Buffer} Derived key
   */
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest
    );
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string} plaintext - Data to encrypt
   * @param {string} password - Optional password (uses masterKey if not provided)
   * @returns {Object} Encrypted data with metadata
   */
  encrypt(plaintext, password = null) {
    if (!plaintext) {
      throw new Error('Cannot encrypt empty data');
    }

    const salt = crypto.randomBytes(this.saltLength).toString('hex');
    const iv = crypto.randomBytes(this.ivLength);

    const key = password
      ? this.deriveKey(password, salt)
      : Buffer.from(this.masterKey, 'hex').slice(0, this.keyLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: password ? salt : undefined,
      algorithm: this.algorithm,
    };
  }

  /**
   * Decrypt data
   * @param {Object} encryptedData - Encrypted data object
   * @param {string} password - Optional password
   * @returns {string} Decrypted plaintext
   */
  decrypt(encryptedData, password = null) {
    const { encrypted, iv, tag, salt } = encryptedData;

    const key = password
      ? this.deriveKey(password, salt)
      : Buffer.from(this.masterKey, 'hex').slice(0, this.keyLength);

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Hash a password with salt
   * @param {string} password - Password to hash
   * @returns {Object} Hash and salt
   */
  hashPassword(password) {
    const salt = crypto.randomBytes(this.saltLength).toString('hex');
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest
    ).toString('hex');

    return {
      hash,
      salt,
      iterations: this.iterations,
      algorithm: this.digest,
    };
  }

  /**
   * Verify a password against a hash
   * @param {string} password - Password to verify
   * @param {string} hash - Stored hash
   * @param {string} salt - Stored salt
   * @returns {boolean} Whether the password matches
   */
  verifyPassword(password, hash, salt) {
    const verifyHash = crypto.pbkdf2Sync(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest
    ).toString('hex');

    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(verifyHash, 'hex')
    );
  }

  /**
   * Generate a secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Hex-encoded token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a UUID v4
   * @returns {string} UUID
   */
  generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * Create HMAC signature
   * @param {string} data - Data to sign
   * @param {string} key - Signing key
   * @returns {string} HMAC signature
   */
  createHMAC(data, key) {
    return crypto
      .createHmac('sha256', key)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify HMAC signature
   * @param {string} data - Original data
   * @param {string} signature - Signature to verify
   * @param {string} key - Signing key
   * @returns {boolean} Whether the signature is valid
   */
  verifyHMAC(data, signature, key) {
    const expected = this.createHMAC(data, key);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  }
}

module.exports = { DataEncryption };
