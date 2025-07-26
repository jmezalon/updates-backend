const { initializeDatabase } = require('./db');

async function migrateEnrollmentStatus() {
  try {
    const db = await initializeDatabase();
    
    console.log('Adding enrollment_status column to users table...');
    
    // Add the enrollment_status column if it doesn't exist
    await db.exec(`
      ALTER TABLE users ADD COLUMN enrollment_status TEXT DEFAULT 'none' 
      CHECK (enrollment_status IN ('none', 'pending', 'assigned'));
    `);
    
    console.log('✅ Successfully added enrollment_status column');
    
    // Update existing users based on their current church assignments
    console.log('Updating existing users enrollment status...');
    
    // Get all users with their church assignments
    const users = await db.all(`
      SELECT u.id, u.email, u.name, 
             COUNT(ca.id) as assignment_count
      FROM users u
      LEFT JOIN church_admin_assignments ca ON u.id = ca.user_id
      GROUP BY u.id, u.email, u.name
    `);
    
    for (const user of users) {
      let status = 'none';
      
      // If user has church assignments, they are 'assigned'
      if (user.assignment_count > 0) {
        status = 'assigned';
      }
      // For now, we'll set unassigned church_admins to 'none' 
      // They will be set to 'pending' when they submit enrollment
      
      await db.run(
        'UPDATE users SET enrollment_status = ? WHERE id = ?',
        [status, user.id]
      );
      
      console.log(`Updated user ${user.email}: ${status}`);
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Show final status
    const updatedUsers = await db.all(`
      SELECT email, name, role, enrollment_status 
      FROM users 
      ORDER BY role, email
    `);
    
    console.log('\n📊 Final user enrollment status:');
    updatedUsers.forEach(user => {
      console.log(`  ${user.email} (${user.role}): ${user.enrollment_status}`);
    });
    
    await db.close();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateEnrollmentStatus();
}

module.exports = { migrateEnrollmentStatus };
