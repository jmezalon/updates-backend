const { getDb } = require('../db');
const bcrypt = require('bcryptjs');

module.exports = {
  async getAll() {
    const db = getDb();
    const rows = await db.all('SELECT id, email, name, role, enrollment_status, avatar, created_at, updated_at FROM users ORDER BY id');
    return rows;
  },

  async getById(id) {
    const db = getDb();
    const row = await db.get('SELECT id, email, name, role, enrollment_status, avatar, created_at, updated_at FROM users WHERE id = ?', [id]);
    return row;
  },

  async getByIdWithPassword(id) {
    const db = getDb();
    const row = await db.get('SELECT id, email, name, role, enrollment_status, password_hash, created_at, updated_at FROM users WHERE id = ?', [id]);
    return row;
  },

  async getByEmail(email) {
    const db = getDb();
    const row = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    return row;
  },

  async create(data) {
    const db = getDb();
    const { email, password, name, role = 'church_admin' } = data;
    
    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const result = await db.run(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES (?, ?, ?, ?)`,
      [email, password_hash, name, role]
    );
    
    // Get the inserted record (without password hash)
    const inserted = await db.get(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?', 
      [result.lastID]
    );
    return inserted;
  },

  async update(id, data) {
    const db = getDb();
    const fields = [];
    const values = [];
    
    // Handle password update separately
    if (data.password) {
      const saltRounds = 10;
      data.password_hash = await bcrypt.hash(data.password, saltRounds);
      delete data.password; // Remove plain password from data
    }
    
    for (const key in data) {
      if (key !== 'id') { // Don't update ID
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    values.push(id);
    await db.run(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    // Get the updated record (without password hash)
    const updated = await db.get(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?', 
      [id]
    );
    return updated;
  },

  async remove(id) {
    const db = getDb();
    await db.run('DELETE FROM users WHERE id = ?', [id]);
    return true;
  },

  async validatePassword(email, password) {
    const db = getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }
    
    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async getChurchAssignments(userId) {
    const db = getDb();
    const assignments = await db.all(`
      SELECT ca.*, c.name as church_name 
      FROM church_admin_assignments ca
      JOIN churches c ON ca.church_id = c.id
      WHERE ca.user_id = ?
    `, [userId]);
    return assignments;
  },

  async assignToChurch(userId, churchId) {
    const db = getDb();
    const result = await db.run(
      'INSERT INTO church_admin_assignments (user_id, church_id) VALUES (?, ?)',
      [userId, churchId]
    );
    
    // Update user enrollment status to 'assigned'
    await db.run(
      'UPDATE users SET enrollment_status = ? WHERE id = ?',
      ['assigned', userId]
    );
    
    return result.lastID;
  },

  async updateEnrollmentStatus(userId, status) {
    const db = await getDb();
    await db.run(
      'UPDATE users SET enrollment_status = ? WHERE id = ?',
      [status, userId]
    );
  },

  async updatePassword(id, newPasswordHash) {
    const db = getDb();
    await db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newPasswordHash, id]);
    return true;
  },

  async setPasswordResetToken(email, token, expiresAt) {
    const db = getDb();
    const now = Date.now();
    await db.run(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ?, password_reset_requested_at = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      [token, expiresAt, now, email]
    );
    return true;
  },

  async getByPasswordResetToken(token) {
    const db = getDb();
    const row = await db.get(
      'SELECT id, email, name, role, password_reset_token, password_reset_expires FROM users WHERE password_reset_token = ?',
      [token]
    );
    return row;
  },

  async clearPasswordResetToken(id) {
    const db = getDb();
    await db.run(
      'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    return true;
  },

  async canRequestPasswordReset(email) {
    const db = getDb();
    const user = await db.get(
      'SELECT password_reset_requested_at FROM users WHERE email = ?',
      [email]
    );
    
    if (!user || !user.password_reset_requested_at) {
      return true; // No previous request
    }
    
    const twelveMinutesAgo = Date.now() - (12 * 60 * 1000); // 12 minutes in milliseconds (5 requests per hour)
    return user.password_reset_requested_at < twelveMinutesAgo;
  },

  async removeChurchAssignment(userId, churchId) {
    const db = getDb();
    await db.run(
      'DELETE FROM church_admin_assignments WHERE user_id = ? AND church_id = ?',
      [userId, churchId]
    );
    return true;
  },

  // Church Following Methods
  async followChurch(userId, churchId) {
    const db = getDb();
    try {
      const result = await db.run(
        'INSERT INTO user_church_follows (user_id, church_id) VALUES (?, ?)',
        [userId, churchId]
      );
      return result.lastID;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('User is already following this church');
      }
      throw error;
    }
  },

  async unfollowChurch(userId, churchId) {
    const db = getDb();
    const result = await db.run(
      'DELETE FROM user_church_follows WHERE user_id = ? AND church_id = ?',
      [userId, churchId]
    );
    return result.changes > 0;
  },

  async getFollowedChurches(userId) {
    const db = getDb();
    const churches = await db.all(`
      SELECT c.*, ucf.created_at as followed_at
      FROM churches c
      JOIN user_church_follows ucf ON c.id = ucf.church_id
      WHERE ucf.user_id = ?
      ORDER BY ucf.created_at DESC
    `, [userId]);
    return churches;
  },

  async isFollowingChurch(userId, churchId) {
    const db = getDb();
    const follow = await db.get(
      'SELECT id FROM user_church_follows WHERE user_id = ? AND church_id = ?',
      [userId, churchId]
    );
    return !!follow;
  },

  // Event Liking Methods
  async likeEvent(userId, eventId) {
    const db = getDb();
    try {
      const result = await db.run(
        'INSERT INTO user_event_likes (user_id, event_id) VALUES (?, ?)',
        [userId, eventId]
      );
      return result.lastID;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('User has already liked this event');
      }
      throw error;
    }
  },

  async unlikeEvent(userId, eventId) {
    const db = getDb();
    const result = await db.run(
      'DELETE FROM user_event_likes WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );
    return result.changes > 0;
  },

  async getLikedEvents(userId) {
    const db = getDb();
    const events = await db.all(`
      SELECT e.*, c.name as church_name, c.logo_url as church_logo, uel.created_at as liked_at
      FROM events e
      JOIN churches c ON e.church_id = c.id
      JOIN user_event_likes uel ON e.id = uel.event_id
      WHERE uel.user_id = ?
      ORDER BY uel.created_at DESC
    `, [userId]);
    return events;
  },

  async isLikingEvent(userId, eventId) {
    const db = getDb();
    const like = await db.get(
      'SELECT id FROM user_event_likes WHERE user_id = ? AND event_id = ?',
      [userId, eventId]
    );
    return !!like;
  }
};
