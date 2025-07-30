const { initializeDatabase, getDb } = require('../db');

/**
 * Migration: Remove unused content column from announcements table
 * 
 * The content column is not used by the frontend form and is redundant
 * since we have a description field that serves the same purpose.
 */
async function removeCreatedByColumn() {
  // Set SSL configuration for PostgreSQL if needed
  if (process.env.DATABASE_URL) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  
  // Initialize database connection first
  await initializeDatabase();
  const db = getDb();
  const isPostgres = !!process.env.DATABASE_URL;
  
  try {
    console.log(`Starting migration: Removing unused created_by column from announcements table (${isPostgres ? 'PostgreSQL' : 'SQLite'})...`);
    
    // Check if the created_by column exists
    let hasCreatedByColumn = false;
    
    if (isPostgres) {
      const result = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'announcements' 
        AND column_name = 'created_by'
      `);
      hasCreatedByColumn = result.rows && result.rows.length > 0;
    } else {
      const result = await db.all(`PRAGMA table_info(announcements)`);
      hasCreatedByColumn = result.some(column => column.name === 'created_by');
    }
    
    if (!hasCreatedByColumn) {
      console.log('✅ Created_by column does not exist in announcements table. No migration needed.');
      return;
    }
    
    console.log('📋 Created_by column found. Checking if it contains any data...');
    
    // Drop the created_by column
    if (isPostgres) {
      await db.query(`ALTER TABLE announcements DROP COLUMN created_by`);
    } else {
      // SQLite doesn't support DROP COLUMN directly, need to recreate table
      console.log('⚠️  SQLite detected. This requires table recreation...');
      
      // Get current table structure
      const tableInfo = await db.all(`PRAGMA table_info(announcements)`);
      const columnsToKeep = tableInfo.filter(col => col.name !== 'created_by');
      
      // Create new table without created_by column
      const columnDefs = columnsToKeep.map(col => {
        let def = `${col.name} ${col.type}`;
        if (col.pk) def += ' PRIMARY KEY';
        if (col.notnull && !col.pk) def += ' NOT NULL';
        if (col.dflt_value) def += ` DEFAULT ${col.dflt_value}`;
        return def;
      }).join(', ');
      
      await db.run(`CREATE TABLE announcements_new (${columnDefs})`);
      
      // Copy data
      const columnNames = columnsToKeep.map(col => col.name).join(', ');
      await db.run(`INSERT INTO announcements_new (${columnNames}) SELECT ${columnNames} FROM announcements`);
      
      // Replace old table
      await db.run(`DROP TABLE announcements`);
      await db.run(`ALTER TABLE announcements_new RENAME TO announcements`);
      
      console.log('✅ Table recreated without created_by column (SQLite).');
    }
    
    console.log('✅ Successfully removed created_by column from announcements table');
    
    // Verify the column was removed
    let finalColumns = [];
    if (isPostgres) {
      const result = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'announcements'
        ORDER BY ordinal_position
      `);
      finalColumns = result.rows.map(row => row.column_name);
    } else {
      const result = await db.all(`PRAGMA table_info(announcements)`);
      finalColumns = result.map(row => row.name);
    }
    
    if (finalColumns.includes('created_by')) {
      throw new Error('created_by column still exists after migration');
    } else {
      console.log('✅ Verification successful: created_by column has been removed');
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📝 The announcements table no longer has the unused created_by column.');
    console.log(`📊 Final column count: ${finalColumns.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  removeCreatedByColumn()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { removeCreatedByColumn };
