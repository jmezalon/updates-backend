const { getDb } = require('../db');

const Donations = {
  async findAllByChurch(churchId) {
    const db = getDb();
    const rows = await db.all(
      'SELECT * FROM donations WHERE church_id = ? ORDER BY method',
      [churchId]
    );
    return rows;
  },

  async create(churchId, data) {
    const db = getDb();
    const { method, contact_name, contact_info, note } = data;
    const result = await db.run(
      `INSERT INTO donations (church_id, method, contact_name, contact_info, note)
       VALUES (?, ?, ?, ?, ?)`,
      [churchId, method, contact_name, contact_info, note]
    );
    
    // Get the inserted record
    const inserted = await db.get('SELECT * FROM donations WHERE id = ?', [result.lastID]);
    return inserted;
  },

  async update(id, data) {
    const db = getDb();
    const { method, contact_name, contact_info, note } = data;
    await db.run(
      `UPDATE donations 
       SET method = ?, contact_name = ?, contact_info = ?, note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [method, contact_name, contact_info, note, id]
    );
    
    // Get the updated record
    const updated = await db.get('SELECT * FROM donations WHERE id = ?', [id]);
    return updated;
  },

  async remove(id) {
    const db = getDb();
    await db.run('DELETE FROM donations WHERE id = ?', [id]);
  }
};

module.exports = Donations;
