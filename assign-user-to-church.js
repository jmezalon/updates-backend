const { initializeDatabase } = require('./db');

async function assignUserToChurch() {
  try {
    const db = await initializeDatabase();
    
    // Get all users and churches for reference
    const users = await db.all('SELECT id, email, name, role FROM users');
    const churches = await db.all('SELECT id, name FROM churches');
    
    console.log('\n=== SUPERUSER CHURCH ASSIGNMENT TOOL ===\n');
    
    console.log('Available Users:');
    users.forEach(user => {
      console.log(`  ID: ${user.id} | Email: ${user.email} | Name: ${user.name} | Role: ${user.role}`);
    });
    
    console.log('\nAvailable Churches:');
    churches.forEach(church => {
      console.log(`  ID: ${church.id} | Name: ${church.name}`);
    });
    
    console.log('\nCurrent Church Assignments:');
    const assignments = await db.all(`
      SELECT ca.id, ca.user_id, ca.church_id, u.email, u.name as user_name, c.name as church_name
      FROM church_admin_assignments ca
      JOIN users u ON ca.user_id = u.id
      JOIN churches c ON ca.church_id = c.id
    `);
    
    if (assignments.length > 0) {
      assignments.forEach(assignment => {
        console.log(`  Assignment ID: ${assignment.id} | User: ${assignment.user_name} (${assignment.email}) | Church: ${assignment.church_name}`);
      });
    } else {
      console.log('  No assignments found.');
    }
    
    console.log('\n=== EXAMPLE COMMANDS ===');
    console.log('To assign unassigned user to a church:');
    console.log('node assign-user-to-church.js assign 5 1');
    console.log('(This would assign user ID 5 to church ID 1)');
    
    // Check for command line arguments
    const args = process.argv.slice(2);
    if (args.length === 3 && args[0] === 'assign') {
      const userId = parseInt(args[1]);
      const churchId = parseInt(args[2]);
      
      // Verify user and church exist
      const user = users.find(u => u.id === userId);
      const church = churches.find(c => c.id === churchId);
      
      if (!user) {
        console.log(`\n❌ Error: User with ID ${userId} not found`);
        return;
      }
      
      if (!church) {
        console.log(`\n❌ Error: Church with ID ${churchId} not found`);
        return;
      }
      
      // Check if assignment already exists
      const existingAssignment = await db.get(
        'SELECT * FROM church_admin_assignments WHERE user_id = ? AND church_id = ?',
        [userId, churchId]
      );
      
      if (existingAssignment) {
        console.log(`\n⚠️  Assignment already exists: ${user.name} is already assigned to ${church.name}`);
        return;
      }
      
      // Create the assignment
      const result = await db.run(
        'INSERT INTO church_admin_assignments (user_id, church_id) VALUES (?, ?)',
        [userId, churchId]
      );
      
      console.log(`\n✅ SUCCESS: Assigned ${user.name} (${user.email}) to ${church.name}`);
      console.log(`Assignment ID: ${result.lastID}`);
      console.log('\n📧 In a real system, an email notification would be sent to:');
      console.log(`   ${user.email} - "You have been assigned as admin for ${church.name}"`);
      console.log('\n🔄 The user should now see the dashboard instead of enrollment form when they log in.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

assignUserToChurch();
