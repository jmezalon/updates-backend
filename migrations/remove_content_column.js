const { initializeDatabase, getDb } = require('../db');

/**
 * Migration: Remove unused content column from announcements table
 * 
 * The content column is not used by the frontend form and is redundant
 * since we have a description field that serves the same purpose.
 */
async function removeContentColumn() {
  // Set SSL configuration for PostgreSQL if needed
  if (process.env.DATABASE_URL) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  
  // Initialize database connection first
  await initializeDatabase();
  const db = getDb();
  const isPostgres = !!process.env.DATABASE_URL;
  
  try {
    console.log(`Starting migration: Removing unused content column from announcements table (${isPostgres ? 'PostgreSQL' : 'SQLite'})...`);
    
    // Check if the content column exists
    let hasContentColumn = false;
    
    if (isPostgres) {
      const result = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'announcements' 
        AND column_name = 'content'
      `);
      hasContentColumn = result.rows && result.rows.length > 0;
    } else {
      const result = await db.all(`PRAGMA table_info(announcements)`);
      hasContentColumn = result.some(column => column.name === 'content');
    }
    
    if (!hasContentColumn) {
      console.log('✅ Content column does not exist in announcements table. No migration needed.');
      return;
    }
    
    console.log('📋 Content column found. Checking if it contains any data...');
    
    // Check if there's any data in the content column before dropping it
    let contentRows;
    if (isPostgres) {
      const result = await db.query(`
        SELECT COUNT(*) as count 
        FROM announcements 
        WHERE content IS NOT NULL AND content != ''
      `);
      contentRows = parseInt(result.rows[0].count);
    } else {
      const result = await db.get(`
        SELECT COUNT(*) as count 
        FROM announcements 
        WHERE content IS NOT NULL AND content != ''
      `);
      contentRows = result.count;
    }
    
    if (contentRows > 0) {
      console.log(`⚠️  Warning: Found ${contentRows} announcements with content data.`);
      console.log('🔄 Migrating content data to description field where description is empty...');
      
      // Migrate content to description where description is empty
      if (isPostgres) {
        await db.query(`
          UPDATE announcements 
          SET description = content 
          WHERE (description IS NULL OR description = '') 
          AND content IS NOT NULL 
          AND content != ''
        `);
      } else {
        await db.run(`
          UPDATE announcements 
          SET description = content 
          WHERE (description IS NULL OR description = '') 
          AND content IS NOT NULL 
          AND content != ''
        `);
      }
      
      console.log('✅ Content data migrated to description field.');
    } else {
      console.log('✅ No content data found. Safe to drop column.');
    }
    
    // Drop the content column
    if (isPostgres) {
      await db.query(`ALTER TABLE announcements DROP COLUMN content`);
    } else {
      // SQLite doesn't support DROP COLUMN directly, need to recreate table
      console.log('⚠️  SQLite detected. This requires table recreation...');
      
      // Get current table structure
      const tableInfo = await db.all(`PRAGMA table_info(announcements)`);
      const columnsToKeep = tableInfo.filter(col => col.name !== 'content');
      
      // Create new table without content column
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
      
      console.log('✅ Table recreated without content column (SQLite).');
    }
    
    console.log('✅ Successfully removed content column from announcements table');
    
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
    
    if (finalColumns.includes('content')) {
      throw new Error('Content column still exists after migration');
    } else {
      console.log('✅ Verification successful: content column has been removed');
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📝 The announcements table no longer has the unused content column.');
    console.log(`📊 Final column count: ${finalColumns.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  removeContentColumn()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { removeContentColumn };
