const dbWrapper = require('../db-wrapper');

const Donations = {
  async findAllByChurch(churchId) {
    await dbWrapper.initialize();
    const rows = await dbWrapper.all(
      'SELECT * FROM donations WHERE church_id = ? ORDER BY method',
      [churchId]
    );
    return rows;
  },

  async create(churchId, data) {
    await dbWrapper.initialize();
    const { method, contact_name, contact_info, note } = data;
    const result = await dbWrapper.insert(`INSERT INTO donations (church_id, method, contact_name, contact_info, note)
       VALUES (?, ?, ?, ?, ?)`,
      [churchId, method, contact_name, contact_info, note]
    );
    
    // Get the inserted record
    const inserted = await dbWrapper.get('SELECT * FROM donations WHERE id = ?', [result.lastID]);
    return inserted;
  },

  async update(id, data) {
    await dbWrapper.initialize();
    const { method, contact_name, contact_info, note } = data;
    await dbWrapper.run(
      `UPDATE donations 
       SET method = ?, contact_name = ?, contact_info = ?, note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [method, contact_name, contact_info, note, id]
    );
    
    // Get the updated record
    const updated = await dbWrapper.get('SELECT * FROM donations WHERE id = ?', [id]);
    return updated;
  },

  async remove(id) {
    await dbWrapper.initialize();
    await dbWrapper.run('DELETE FROM donations WHERE id = ?', [id]);
  }
};

module.exports = Donations;
