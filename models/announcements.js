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
        a.day ASC
    `, [churchId]);
    
    // Sort by time in JavaScript to handle AM/PM properly across databases
    const sortedRows = rows.sort((a, b) => {
      // First sort by day (already handled in SQL, but ensure consistency)
      const dayA = a.day === null ? 999 : a.day;
      const dayB = b.day === null ? 999 : b.day;
      if (dayA !== dayB) return dayA - dayB;
      
      // Then sort by time with AM/PM handling
      const timeA = this.convertTo24Hour(a.start_time);
      const timeB = this.convertTo24Hour(b.start_time);
      return timeA.localeCompare(timeB);
    });
    
    return sortedRows;
  },
  
  // Helper function to convert 12-hour time to 24-hour format for sorting
  convertTo24Hour(timeStr) {
    if (!timeStr || timeStr === '') return '99:99'; // Sort empty times last
    
    const upperTime = timeStr.toUpperCase().trim();
    if (!upperTime.includes('AM') && !upperTime.includes('PM')) {
      return timeStr; // Return as-is if no AM/PM
    }
    
    const isAM = upperTime.includes('AM');
    const isPM = upperTime.includes('PM');
    
    // Extract time part (remove AM/PM)
    const timePart = upperTime.replace(/\s*(AM|PM)\s*/g, '').trim();
    const [hours, minutes = '00'] = timePart.split(':');
    
    let hour24 = parseInt(hours, 10);
    
    if (isAM) {
      if (hour24 === 12) hour24 = 0; // 12 AM = 00:xx
    } else if (isPM) {
      if (hour24 !== 12) hour24 += 12; // PM times except 12 PM
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
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
    // Allow time-only formats like "11:00 AM" or "5:00 PM" as well as full datetime strings
    if (typeof start_time === 'string' && start_time.trim() !== '') {
      // If it's a time-only format (contains AM/PM), don't validate as Date
      const isTimeOnly = /\b(AM|PM)\b/i.test(start_time) || /^\d{1,2}:\d{2}$/.test(start_time.trim());
      if (!isTimeOnly) {
        const startTime = new Date(start_time);
        if (isNaN(startTime.getTime())) {
          throw new Error('Invalid start_time format');
        }
      }
    }
  }
  
  if (end_time && end_time !== null) {
    // Allow time-only formats like "11:00 AM" or "5:00 PM" as well as full datetime strings
    if (typeof end_time === 'string' && end_time.trim() !== '') {
      // If it's a time-only format (contains AM/PM), don't validate as Date
      const isTimeOnly = /\b(AM|PM)\b/i.test(end_time) || /^\d{1,2}:\d{2}$/.test(end_time.trim());
      if (!isTimeOnly) {
        const endTime = new Date(end_time);
        if (isNaN(endTime.getTime())) {
          throw new Error('Invalid end_time format');
        }
      }
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
    // Allow time-only formats like "11:00 AM" or "5:00 PM" as well as full datetime strings
    if (typeof data.start_time === 'string' && data.start_time.trim() !== '') {
      // If it's a time-only format (contains AM/PM), don't validate as Date
      const isTimeOnly = /\b(AM|PM)\b/i.test(data.start_time) || /^\d{1,2}:\d{2}$/.test(data.start_time.trim());
      if (!isTimeOnly) {
        const startTime = new Date(data.start_time);
        if (isNaN(startTime.getTime())) {
          throw new Error('Invalid start_time format');
        }
      }
    }
  }
  
  if (data.end_time && data.end_time !== null) {
    // Allow time-only formats like "11:00 AM" or "5:00 PM" as well as full datetime strings
    if (typeof data.end_time === 'string' && data.end_time.trim() !== '') {
      // If it's a time-only format (contains AM/PM), don't validate as Date
      const isTimeOnly = /\b(AM|PM)\b/i.test(data.end_time) || /^\d{1,2}:\d{2}$/.test(data.end_time.trim());
      if (!isTimeOnly) {
        const endTime = new Date(data.end_time);
        if (isNaN(endTime.getTime())) {
          throw new Error('Invalid end_time format');
        }
      }
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
