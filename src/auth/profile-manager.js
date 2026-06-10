/**
 * User Profile Manager Module
 * Manages user profiles, preferences, and personal data with encryption
 */

const { DataEncryption } = require('./encryption');

class UserProfile {
  constructor(userId, data = {}) {
    this.userId = userId;
    this.basicInfo = {
      displayName: data.displayName || '',
      age: data.age || null,
      gender: data.gender || '',
      phone: data.phone || '',
      emergencyContact: data.emergencyContact || null,
    };
    this.preferences = {
      language: data.language || 'zh',
      theme: data.theme || 'light',
      notifications: data.notifications !== false,
      fontSize: data.fontSize || 'medium',
      communicationPreference: data.communicationPreference || 'text',
    };
    this.healthInfo = {
      conditions: data.conditions || [],
      medications: data.medications || [],
      allergies: data.allergies || [],
      therapistName: data.therapistName || '',
      therapyStartDate: data.therapyStartDate || null,
    };
    this.privacy = {
      shareDataForResearch: data.shareDataForResearch || false,
      anonymousMode: data.anonymousMode || false,
      dataRetentionDays: data.dataRetentionDays || 365,
    };
    this.metadata = {
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      lastActiveAt: data.lastActiveAt || new Date().toISOString(),
    };
  }

  /**
   * Update basic information
   * @param {Object} updates - Fields to update
   */
  updateBasicInfo(updates) {
    Object.assign(this.basicInfo, updates);
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Update preferences
   * @param {Object} updates - Preference updates
   */
  updatePreferences(updates) {
    Object.assign(this.preferences, updates);
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Update health information
   * @param {Object} updates - Health info updates
   */
  updateHealthInfo(updates) {
    Object.assign(this.healthInfo, updates);
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Update privacy settings
   * @param {Object} updates - Privacy setting updates
   */
  updatePrivacy(updates) {
    Object.assign(this.privacy, updates);
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Record last active time
   */
  touch() {
    this.metadata.lastActiveAt = new Date().toISOString();
  }

  /**
   * Export profile data (for data portability)
   * @returns {Object} Complete profile data
   */
  export() {
    return {
      userId: this.userId,
      basicInfo: { ...this.basicInfo },
      preferences: { ...this.preferences },
      healthInfo: { ...this.healthInfo },
      privacy: { ...this.privacy },
      metadata: { ...this.metadata },
    };
  }

  /**
   * Get sanitized profile for public display
   * @returns {Object} Public-safe profile data
   */
  toPublic() {
    return {
      userId: this.userId,
      displayName: this.basicInfo.displayName,
      preferences: {
        language: this.preferences.language,
        theme: this.preferences.theme,
      },
      metadata: {
        createdAt: this.metadata.createdAt,
        lastActiveAt: this.metadata.lastActiveAt,
      },
    };
  }
}

/**
 * Profile Manager
 * Manages multiple user profiles with encrypted storage
 */
class ProfileManager {
  constructor(options = {}) {
    this.profiles = new Map();
    this.encryption = new DataEncryption(options);
    this.encryptionEnabled = options.encryptionEnabled !== false;
  }

  /**
   * Create a new profile
   * @param {string} userId - User ID
   * @param {Object} data - Initial profile data
   * @returns {UserProfile} Created profile
   */
  createProfile(userId, data = {}) {
    if (this.profiles.has(userId)) {
      throw new Error('Profile already exists for this user');
    }

    const profile = new UserProfile(userId, data);
    this.profiles.set(userId, profile);
    return profile;
  }

  /**
   * Get a user profile
   * @param {string} userId - User ID
   * @returns {UserProfile|null} User profile
   */
  getProfile(userId) {
    return this.profiles.get(userId) || null;
  }

  /**
   * Update a profile
   * @param {string} userId - User ID
   * @param {string} section - Profile section
   * @param {Object} updates - Updates to apply
   * @returns {UserProfile} Updated profile
   */
  updateProfile(userId, section, updates) {
    const profile = this.profiles.get(userId);
    if (!profile) throw new Error('Profile not found');

    switch (section) {
      case 'basicInfo':
        profile.updateBasicInfo(updates);
        break;
      case 'preferences':
        profile.updatePreferences(updates);
        break;
      case 'healthInfo':
        profile.updateHealthInfo(updates);
        break;
      case 'privacy':
        profile.updatePrivacy(updates);
        break;
      default:
        throw new Error(`Unknown profile section: ${section}`);
    }

    return profile;
  }

  /**
   * Delete a profile
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  deleteProfile(userId) {
    return this.profiles.delete(userId);
  }

  /**
   * Export profile data (encrypted)
   * @param {string} userId - User ID
   * @param {string} password - Encryption password
   * @returns {Object} Encrypted profile data
   */
  exportProfile(userId, password = null) {
    const profile = this.profiles.get(userId);
    if (!profile) throw new Error('Profile not found');

    const data = JSON.stringify(profile.export());

    if (this.encryptionEnabled && password) {
      return {
        encrypted: true,
        data: this.encryption.encrypt(data, password),
      };
    }

    return {
      encrypted: false,
      data: JSON.parse(data),
    };
  }

  /**
   * Import profile data
   * @param {string} userId - User ID
   * @param {Object} importData - Data to import
   * @param {string} password - Decryption password if encrypted
   * @returns {UserProfile} Imported profile
   */
  importProfile(userId, importData, password = null) {
    let data;

    if (importData.encrypted) {
      if (!password) throw new Error('Password required for encrypted data');
      const decrypted = this.encryption.decrypt(importData.data, password);
      data = JSON.parse(decrypted);
    } else {
      data = importData.data;
    }

    const profile = new UserProfile(userId, data);
    this.profiles.set(userId, profile);
    return profile;
  }

  /**
   * Search profiles by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array} Matching profiles
   */
  search(criteria = {}) {
    const results = [];
    for (const profile of this.profiles.values()) {
      let match = true;

      if (criteria.language && profile.preferences.language !== criteria.language) {
        match = false;
      }
      if (criteria.therapistName && profile.healthInfo.therapistName !== criteria.therapistName) {
        match = false;
      }
      if (criteria.activeSince) {
        const since = new Date(criteria.activeSince);
        if (new Date(profile.metadata.lastActiveAt) < since) {
          match = false;
        }
      }

      if (match) {
        results.push(profile.toPublic());
      }
    }

    return results;
  }

  /**
   * Get statistics about profiles
   * @returns {Object} Profile statistics
   */
  getStatistics() {
    const profiles = [...this.profiles.values()];
    const languageCounts = {};
    const themeCounts = {};

    for (const profile of profiles) {
      const lang = profile.preferences.language;
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;

      const theme = profile.preferences.theme;
      themeCounts[theme] = (themeCounts[theme] || 0) + 1;
    }

    return {
      totalProfiles: profiles.length,
      languageDistribution: languageCounts,
      themeDistribution: themeCounts,
      activeToday: profiles.filter(p => {
        const lastActive = new Date(p.metadata.lastActiveAt);
        const today = new Date();
        return lastActive.toDateString() === today.toDateString();
      }).length,
    };
  }
}

module.exports = { UserProfile, ProfileManager };
