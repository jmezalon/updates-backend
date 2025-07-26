const { getDb } = require('../db');

module.exports = {
  async getAll() {
    const db = getDb();
    const rows = await db.all(
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
    const db = getDb();
    const rows = await db.all(
      'SELECT * FROM events WHERE church_id = ? ORDER BY start_datetime',
      [churchId]
    );
    return rows;
  },
  async getById(id) {
    const db = getDb();
    const row = await db.get(
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
    const db = getDb();
    const { title, description, location, start_datetime, end_datetime, image_url, price, contact_email, contact_phone, website, favorites_count } = data;
    const result = await db.run(
      `INSERT INTO events (church_id, title, description, location, start_datetime, end_datetime, image_url, price, contact_email, contact_phone, website, favorites_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [churchId, title, description, location, start_datetime, end_datetime, image_url, price, contact_email, contact_phone, website, favorites_count || 0]
    );
    
    // Get the inserted record
    const inserted = await db.get('SELECT * FROM events WHERE id = ?', [result.lastID]);
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
    const { changes } = await db.run(
      `UPDATE events SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    // Get the updated record
    const updated = await db.get('SELECT * FROM events WHERE id = ?', [id]);
    return updated;
  },
  async remove(id) {
    const db = getDb();
    await db.run('DELETE FROM events WHERE id = ?', [id]);
    return true;
  }
};
