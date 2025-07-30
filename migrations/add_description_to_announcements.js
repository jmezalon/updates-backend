const { initializeDatabase, getDb } = require('../db');

/**
 * Migration: Add description field to announcements table
 * 
 * This migration adds the missing description column to the announcements table
 * to match the schema definition and support the frontend functionality.
 */
async function addDescriptionToAnnouncements() {
  // Initialize database connection first
  await initializeDatabase();
  const db = getDb();
  
  try {
    console.log('Starting migration: Adding description field to announcements table...');
    
    // Check if the column already exists
    const tableInfo = await db.all(`PRAGMA table_info(announcements)`);
    const hasDescriptionColumn = tableInfo.some(column => column.name === 'description');
    
    if (hasDescriptionColumn) {
      console.log('✅ Description column already exists in announcements table. No migration needed.');
      return;
    }
    
    // Add the description column to announcements table
    await db.run(`
      ALTER TABLE announcements 
      ADD COLUMN description TEXT
    `);
    
    console.log('✅ Successfully added description column to announcements table');
    
    // Verify the column was added
    const updatedTableInfo = await db.all(`PRAGMA table_info(announcements)`);
    const descriptionColumn = updatedTableInfo.find(column => column.name === 'description');
    
    if (descriptionColumn) {
      console.log(`✅ Verification successful: description column added as ${descriptionColumn.type}`);
    } else {
      throw new Error('Failed to verify description column was added');
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📝 The announcements table now supports description fields from the frontend.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addDescriptionToAnnouncements()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addDescriptionToAnnouncements };
