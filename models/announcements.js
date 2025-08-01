const dbWrapper = require('../db-wrapper');

const Announcements = {
  async findAll() {
    await dbWrapper.initialize();
    const rows = await dbWrapper.all(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      ORDER BY a.posted_at DESC, a.created_at DESC
    `);
    return rows;
  },

  async findAllByChurch(churchId) {
    await dbWrapper.initialize();
    const rows = await dbWrapper.all(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      WHERE a.church_id = ? 
      ORDER BY a.posted_at DESC, a.created_at DESC
    `, [churchId]);
    return rows;
  },

  async findWeeklyByChurch(churchId) {
    await dbWrapper.initialize();
    const rows = await dbWrapper.all(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      WHERE a.church_id = ? 
        AND (a.type = 'weekly' OR (a.is_special = false AND a.recurrence_rule IS NOT NULL))
      ORDER BY 
        CASE WHEN a.day IS NULL THEN 1 ELSE 0 END,
        a.day ASC,
        CASE 
          WHEN a.start_time IS NULL THEN '99:99'
          WHEN UPPER(a.start_time) LIKE '%AM' THEN 
            CASE 
              WHEN SUBSTR(a.start_time, 1, INSTR(a.start_time, ':') - 1) = '12' THEN 
                '00' || SUBSTR(a.start_time, INSTR(a.start_time, ':'), LENGTH(a.start_time) - INSTR(a.start_time, ':') - 2)
              ELSE 
                PRINTF('%02d', CAST(SUBSTR(a.start_time, 1, INSTR(a.start_time, ':') - 1) AS INTEGER)) || SUBSTR(a.start_time, INSTR(a.start_time, ':'), LENGTH(a.start_time) - INSTR(a.start_time, ':') - 2)
            END
          WHEN UPPER(a.start_time) LIKE '%PM' THEN 
            CASE 
              WHEN SUBSTR(a.start_time, 1, INSTR(a.start_time, ':') - 1) = '12' THEN 
                '12' || SUBSTR(a.start_time, INSTR(a.start_time, ':'), LENGTH(a.start_time) - INSTR(a.start_time, ':') - 2)
              ELSE 
                PRINTF('%02d', CAST(SUBSTR(a.start_time, 1, INSTR(a.start_time, ':') - 1) AS INTEGER) + 12) || SUBSTR(a.start_time, INSTR(a.start_time, ':'), LENGTH(a.start_time) - INSTR(a.start_time, ':') - 2)
            END
          ELSE a.start_time
        END ASC
    `, [churchId]);
    return rows;
  },

  async findByType(type) {
    await dbWrapper.initialize();
    const rows = await dbWrapper.all(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      WHERE a.type = ? 
      ORDER BY a.posted_at DESC, a.created_at DESC
    `, [type]);
    return rows;
  },

  async findSpecial() {
    await dbWrapper.initialize();
    const rows = await dbWrapper.all(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      WHERE a.is_special = true 
      ORDER BY a.posted_at DESC, a.created_at DESC
    `);
    return rows;
  },

  async findById(id) {
    await dbWrapper.initialize();
    const row = await dbWrapper.get(`
      SELECT a.*, c.name as church_name, c.logo_url as church_logo 
      FROM announcements a 
      JOIN churches c ON a.church_id = c.id 
      WHERE a.id = ?
    `, [id]);
    return row;
  },

  async create(churchId, data) {
    await dbWrapper.initialize();
    const { title, description, image_url, posted_at, type, subcategory, start_time, end_time, recurrence_rule, is_special, day } = data;
    
    // Validate date fields
    if (posted_at && posted_at !== null) {
      const postedDate = new Date(posted_at);
      if (isNaN(postedDate.getTime())) {
        throw new Error('Invalid posted_at format');
      }
    }
    
    if (start_time && start_time !== null) {
      const startTime = new Date(start_time);
      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid start_time format');
      }
    }
    
    if (end_time && end_time !== null) {
      const endTime = new Date(end_time);
      if (isNaN(endTime.getTime())) {
        throw new Error('Invalid end_time format');
      }
    }
    const result = await dbWrapper.run(`
      INSERT INTO announcements (church_id, title, description, image_url, posted_at, type, subcategory, start_time, end_time, recurrence_rule, is_special, day)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [churchId, title, description, image_url, posted_at, type, subcategory, start_time, end_time, recurrence_rule, is_special, day]);
    
    // Get the inserted record with church info
    const inserted = await this.findById(result.lastID);
    return inserted;
  },

  async update(id, data) {
    await dbWrapper.initialize();
    
    // Validate date fields if they exist in the update data
    if (data.posted_at && data.posted_at !== null) {
      const postedDate = new Date(data.posted_at);
      if (isNaN(postedDate.getTime())) {
        throw new Error('Invalid posted_at format');
      }
    }
    
    if (data.start_time && data.start_time !== null) {
      const startTime = new Date(data.start_time);
      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid start_time format');
      }
    }
    
    if (data.end_time && data.end_time !== null) {
      const endTime = new Date(data.end_time);
      if (isNaN(endTime.getTime())) {
        throw new Error('Invalid end_time format');
      }
    }
    
    const fields = [];
    const values = [];
    
    for (const key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
    values.push(id);
    
    await dbWrapper.run(`
      UPDATE announcements SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, values);
    
    // Get the updated record
    const updated = await this.findById(id);
    return updated;
  },

  async remove(id) {
    await dbWrapper.initialize();
    await dbWrapper.run('DELETE FROM announcements WHERE id = ?', [id]);
  }
};

module.exports = Announcements;
