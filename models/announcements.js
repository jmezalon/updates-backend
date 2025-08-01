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
  
  // Helper function to normalize time values - convert datetime strings to time-only format
  normalizeTimeValue(timeValue) {
    if (!timeValue || timeValue === '') return timeValue;
    
    // If it's already a time-only string (contains AM/PM or is HH:MM format), return as-is
    if (typeof timeValue === 'string') {
      const trimmed = timeValue.trim();
      if (/\b(AM|PM)\b/i.test(trimmed) || /^\d{1,2}:\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      
      // If it's an ISO datetime string, extract just the time part
      if (trimmed.includes('T') && (trimmed.includes('Z') || trimmed.includes('+') || trimmed.includes('-'))) {
        try {
          const date = new Date(trimmed);
          if (!isNaN(date.getTime())) {
            // Convert to 12-hour format with AM/PM
            return date.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            });
          }
        } catch (e) {
          // If parsing fails, return original value
          return trimmed;
        }
      }
    }
    
    return timeValue;
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
    
    // Normalize time values to convert datetime strings to time-only format
    const normalizedStartTime = this.normalizeTimeValue(start_time);
    const normalizedEndTime = this.normalizeTimeValue(end_time);
    
    // Validate date fields
    if (posted_at && posted_at !== null) {
      const postedDate = new Date(posted_at);
      if (isNaN(postedDate.getTime())) {
        throw new Error('Invalid posted_at format');
      }
    }
    
    if (normalizedStartTime && normalizedStartTime !== null) {
    // Allow time-only formats like "11:00 AM" or "5:00 PM" as well as full datetime strings
    if (typeof normalizedStartTime === 'string' && normalizedStartTime.trim() !== '') {
      // If it's a time-only format (contains AM/PM), don't validate as Date
      const isTimeOnly = /\b(AM|PM)\b/i.test(normalizedStartTime) || /^\d{1,2}:\d{2}$/.test(normalizedStartTime.trim());
      if (!isTimeOnly) {
        const startTime = new Date(normalizedStartTime);
        if (isNaN(startTime.getTime())) {
          throw new Error('Invalid start_time format');
        }
      }
    }
  }
  
  if (normalizedEndTime && normalizedEndTime !== null) {
    // Allow time-only formats like "11:00 AM" or "5:00 PM" as well as full datetime strings
    if (typeof normalizedEndTime === 'string' && normalizedEndTime.trim() !== '') {
      // If it's a time-only format (contains AM/PM), don't validate as Date
      const isTimeOnly = /\b(AM|PM)\b/i.test(normalizedEndTime) || /^\d{1,2}:\d{2}$/.test(normalizedEndTime.trim());
      if (!isTimeOnly) {
        const endTime = new Date(normalizedEndTime);
        if (isNaN(endTime.getTime())) {
          throw new Error('Invalid end_time format');
        }
      }
    }
  }
    const result = await dbWrapper.run(`
      INSERT INTO announcements (church_id, title, description, image_url, posted_at, type, subcategory, start_time, end_time, recurrence_rule, is_special, day)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [churchId, title, description, image_url, posted_at, type, subcategory, normalizedStartTime, normalizedEndTime, recurrence_rule, is_special, day]);
    
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
    
    // Normalize time values before validation and saving
    const normalizedData = { ...data };
    if (data.start_time) {
      normalizedData.start_time = this.normalizeTimeValue(data.start_time);
    }
    if (data.end_time) {
      normalizedData.end_time = this.normalizeTimeValue(data.end_time);
    }
    
    if (normalizedData.start_time && normalizedData.start_time !== null) {
      // Allow time-only formats like "11:00 AM" or "5:00 PM" as well as full datetime strings
      if (typeof normalizedData.start_time === 'string' && normalizedData.start_time.trim() !== '') {
        // If it's a time-only format (contains AM/PM), don't validate as Date
        const isTimeOnly = /\b(AM|PM)\b/i.test(normalizedData.start_time) || /^\d{1,2}:\d{2}$/.test(normalizedData.start_time.trim());
        if (!isTimeOnly) {
          const startTime = new Date(normalizedData.start_time);
          if (isNaN(startTime.getTime())) {
            throw new Error('Invalid start_time format');
          }
        }
      }
    }
    
    if (normalizedData.end_time && normalizedData.end_time !== null) {
      // Allow time-only formats like "11:00 AM" or "5:00 PM" as well as full datetime strings
      if (typeof normalizedData.end_time === 'string' && normalizedData.end_time.trim() !== '') {
        // If it's a time-only format (contains AM/PM), don't validate as Date
        const isTimeOnly = /\b(AM|PM)\b/i.test(normalizedData.end_time) || /^\d{1,2}:\d{2}$/.test(normalizedData.end_time.trim());
        if (!isTimeOnly) {
          const endTime = new Date(normalizedData.end_time);
          if (isNaN(endTime.getTime())) {
            throw new Error('Invalid end_time format');
          }
        }
      }
    }
    
    const fields = [];
    const values = [];
    
    for (const key in normalizedData) {
      fields.push(`${key} = ?`);
      values.push(normalizedData[key]);
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
