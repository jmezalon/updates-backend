const dbWrapper = require('../db-wrapper');

module.exports = {
  async getAll() {
    await dbWrapper.initialize();
    const rows = await dbWrapper.all(
      `SELECT e.*, c.name as church_name, c.logo_url as church_logo,
              COUNT(uel.id) as like_count
       FROM events e 
       JOIN churches c ON e.church_id = c.id 
       LEFT JOIN user_event_likes uel ON e.id = uel.event_id
       GROUP BY e.id, c.id
       ORDER BY e.start_datetime ASC`
    );
    return rows;
  },
  async getAllByChurch(churchId) {
    await dbWrapper.initialize();
    const rows = await dbWrapper.all(
      'SELECT * FROM events WHERE church_id = ? ORDER BY start_datetime',
      [churchId]
    );
    return rows;
  },
  async getById(id) {
    await dbWrapper.initialize();
    const row = await dbWrapper.get(
      `SELECT e.*, c.name as church_name, c.logo_url as church_logo,
              COUNT(uel.id) as like_count
       FROM events e 
       JOIN churches c ON e.church_id = c.id 
       LEFT JOIN user_event_likes uel ON e.id = uel.event_id
       WHERE e.id = ?
       GROUP BY e.id, c.id`,
      [id]
    );
    return row;
  },
  async create(churchId, data) {
    await dbWrapper.initialize();
    const { title, description, location, start_datetime, end_datetime, image_url, price, contact_email, contact_phone, website, favorites_count } = data;
    
    // Validate date fields
    if (start_datetime && start_datetime !== null) {
      const startDate = new Date(start_datetime);
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start_datetime format');
      }
    }
    
    if (end_datetime && end_datetime !== null) {
      const endDate = new Date(end_datetime);
      if (isNaN(endDate.getTime())) {
        throw new Error('Invalid end_datetime format');
      }
    }
    const result = await dbWrapper.insert(`INSERT INTO events (church_id, title, description, location, start_datetime, end_datetime, image_url, price, contact_email, contact_phone, website, favorites_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [churchId, title, description, location, start_datetime, end_datetime, image_url, price, contact_email, contact_phone, website, favorites_count || 0]
    );
    
    // Get the inserted record
    const inserted = await dbWrapper.get('SELECT * FROM events WHERE id = ?', [result.lastID]);
    return inserted;
  },
  async update(id, data) {
    await dbWrapper.initialize();
    
    // Validate date fields if they exist in the update data
    if (data.start_datetime && data.start_datetime !== null) {
      const startDate = new Date(data.start_datetime);
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid start_datetime format');
      }
    }
    
    if (data.end_datetime && data.end_datetime !== null) {
      const endDate = new Date(data.end_datetime);
      if (isNaN(endDate.getTime())) {
        throw new Error('Invalid end_datetime format');
      }
    }
    
    const fields = [];
    const values = [];
    for (const key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
    values.push(id);
    const { changes } = await dbWrapper.run(
      `UPDATE events SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    // Get the updated record
    const updated = await dbWrapper.get('SELECT * FROM events WHERE id = ?', [id]);
    return updated;
  },
  async remove(id) {
    await dbWrapper.initialize();
    await dbWrapper.run('DELETE FROM events WHERE id = ?', [id]);
    return true;
  }
};
