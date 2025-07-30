const { initializeDatabase, getDb } = require('../db');

/**
 * Migration: Add description field to announcements table (PostgreSQL compatible)
 * 
 * This migration adds the missing description column to the announcements table
 * for both SQLite and PostgreSQL databases to match the schema definition.
 */
async function addDescriptionToAnnouncementsPostgres() {
  // Set SSL configuration for PostgreSQL if needed
  if (process.env.DATABASE_URL) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  
  // Initialize database connection first
  await initializeDatabase();
  const db = getDb();
  const isPostgres = !!process.env.DATABASE_URL;
  
  try {
    console.log(`Starting migration: Adding description field to announcements table (${isPostgres ? 'PostgreSQL' : 'SQLite'})...`);
    
    if (isPostgres) {
      // PostgreSQL: Check if column exists
      const columnCheck = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'announcements' 
        AND column_name = 'description'
      `);
      
      if (columnCheck.rows && columnCheck.rows.length > 0) {
        console.log('✅ Description column already exists in PostgreSQL announcements table. No migration needed.');
        return;
      }
      
      // Add the description column to PostgreSQL announcements table
      await db.query(`
        ALTER TABLE announcements 
        ADD COLUMN description TEXT
      `);
      
      console.log('✅ Successfully added description column to PostgreSQL announcements table');
      
      // Verify the column was added
      const verifyColumn = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'announcements' 
        AND column_name = 'description'
      `);
      
      if (verifyColumn.rows && verifyColumn.rows.length > 0) {
        console.log(`✅ Verification successful: description column added as ${verifyColumn.rows[0].data_type}`);
      } else {
        throw new Error('Failed to verify description column was added to PostgreSQL');
      }
      
    } else {
      // SQLite: Check if column exists
      const tableInfo = await db.all(`PRAGMA table_info(announcements)`);
      const hasDescriptionColumn = tableInfo.some(column => column.name === 'description');
      
      if (hasDescriptionColumn) {
        console.log('✅ Description column already exists in SQLite announcements table. No migration needed.');
        return;
      }
      
      // Add the description column to SQLite announcements table
      await db.run(`
        ALTER TABLE announcements 
        ADD COLUMN description TEXT
      `);
      
      console.log('✅ Successfully added description column to SQLite announcements table');
      
      // Verify the column was added
      const updatedTableInfo = await db.all(`PRAGMA table_info(announcements)`);
      const descriptionColumn = updatedTableInfo.find(column => column.name === 'description');
      
      if (descriptionColumn) {
        console.log(`✅ Verification successful: description column added as ${descriptionColumn.type}`);
      } else {
        throw new Error('Failed to verify description column was added to SQLite');
      }
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
  addDescriptionToAnnouncementsPostgres()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addDescriptionToAnnouncementsPostgres };
