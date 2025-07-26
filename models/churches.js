const { getDb } = require('../db');

module.exports = {
  async getAll() {
    const db = getDb();
    const rows = await db.all('SELECT * FROM churches ORDER BY id');
    return rows;
  },
  async getById(id) {
    const db = getDb();
    const row = await db.get(
      `SELECT c.*, COUNT(ucf.id) as follower_count
       FROM churches c 
       LEFT JOIN user_church_follows ucf ON c.id = ucf.church_id
       WHERE c.id = ?
       GROUP BY c.id`, 
      [id]
    );
    return row;
  },
  async create(data) {
    const db = getDb();
    const { name, senior_pastor, senior_pastor_avatar, pastor, pastor_avatar, assistant_pastor, assistant_pastor_avatar, address, city, state, zip, contact_email, contact_phone, website, logo_url, banner_url, description } = data;
    const result = await db.run(
      `INSERT INTO churches (name, senior_pastor, senior_pastor_avatar, pastor, pastor_avatar, assistant_pastor, assistant_pastor_avatar, address, city, state, zip, contact_email, contact_phone, website, logo_url, banner_url, description)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, senior_pastor, senior_pastor_avatar, pastor, pastor_avatar, assistant_pastor, assistant_pastor_avatar, address, city, state, zip, contact_email, contact_phone, website, logo_url, banner_url, description]
    );
    
    // Get the inserted record
    const inserted = await db.get('SELECT * FROM churches WHERE id = ?', [result.lastID]);
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
    await db.run(
      `UPDATE churches SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    // Get the updated record
    const updated = await db.get('SELECT * FROM churches WHERE id = ?', [id]);
    return updated;
  },
  async remove(id) {
    const db = getDb();
    
    // First, get all users assigned to this church so we can update their enrollment status
    const assignedUsers = await db.all(
      'SELECT user_id FROM church_admin_assignments WHERE church_id = ?', 
      [id]
    );
    
    // Remove all admin assignments for this church
    await db.run('DELETE FROM church_admin_assignments WHERE church_id = ?', [id]);
    
    // Update enrollment status for users who were assigned to this church
    // Set them back to 'none' so they can enroll in a different church if needed
    for (const assignment of assignedUsers) {
      await db.run(
        'UPDATE users SET enrollment_status = ? WHERE id = ?',
        ['none', assignment.user_id]
      );
    }
    
    // Finally, delete the church
    await db.run('DELETE FROM churches WHERE id = ?', [id]);
    
    return {
      success: true,
      removedAssignments: assignedUsers.length
    };
  }
};
