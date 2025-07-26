const { getDb } = require('../db');

const Announcements = {
  async findAll() {
    const db = getDb();
    const rows = await db.all(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      ORDER BY a.posted_at DESC, a.created_at DESC
    `);
    return rows;
  },

  async findAllByChurch(churchId) {
    const db = getDb();
    const rows = await db.all(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      WHERE a.church_id = ? 
      ORDER BY a.posted_at DESC, a.created_at DESC
    `, [churchId]);
    return rows;
  },

  async findWeeklyByChurch(churchId) {
    const db = getDb();
    const rows = await db.all(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      WHERE a.church_id = ? 
        AND (a.type = 'weekly' OR (a.is_special = 0 AND a.recurrence_rule IS NOT NULL))
      ORDER BY 
        CASE WHEN a.day IS NULL THEN 1 ELSE 0 END,
        a.day ASC,
        a.start_time ASC
    `, [churchId]);
    return rows;
  },

  async findByType(type) {
    const db = getDb();
    const rows = await db.all(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      WHERE a.type = ? 
      ORDER BY a.posted_at DESC, a.created_at DESC
    `, [type]);
    return rows;
  },

  async findSpecial() {
    const db = getDb();
    const rows = await db.all(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      WHERE a.is_special = 1 
      ORDER BY a.posted_at DESC, a.created_at DESC
    `);
    return rows;
  },

  async findById(id) {
    const db = getDb();
    const row = await db.get(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      WHERE a.id = ?
    `, [id]);
    return row;
  },

  async create(churchId, data) {
    const db = getDb();
    const { title, description, image_url, posted_at, type, subcategory, start_time, end_time, recurrence_rule, is_special, day } = data;
    const result = await db.run(`
      INSERT INTO announcements (church_id, title, description, image_url, posted_at, type, subcategory, start_time, end_time, recurrence_rule, is_special, day)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [churchId, title, description, image_url, posted_at, type, subcategory, start_time, end_time, recurrence_rule, is_special, day]);
    
    // Get the inserted record with church info
    const inserted = await this.findById(result.lastID);
    return inserted;
  },

  async update(id, data) {
    const db = getDb();
    const fields = [];
    const values = [];
    
    for (const key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
    values.push(id);
    
    await db.run(`
      UPDATE announcements SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, values);
    
    // Get the updated record
    const updated = await this.findById(id);
    return updated;
  },

  async remove(id) {
    const db = getDb();
    await db.run('DELETE FROM announcements WHERE id = ?', [id]);
  }
};

module.exports = Announcements;
