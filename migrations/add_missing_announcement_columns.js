const { initializeDatabase, getDb } = require('../db');

/**
 * Migration: Add all missing columns to announcements table
 * 
 * This migration adds all the missing columns identified by the schema audit
 * to bring the PostgreSQL database in sync with the frontend expectations.
 */
async function addMissingAnnouncementColumns() {
  // Set SSL configuration for PostgreSQL if needed
  if (process.env.DATABASE_URL) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  
  // Initialize database connection first
  await initializeDatabase();
  const db = getDb();
  const isPostgres = !!process.env.DATABASE_URL;
  
  try {
    console.log(`Starting migration: Adding missing columns to announcements table (${isPostgres ? 'PostgreSQL' : 'SQLite'})...`);
    
    // Define the missing columns and their specifications
    const missingColumns = [
      { name: 'type', type: 'VARCHAR(100)', nullable: true },
      { name: 'subcategory', type: 'VARCHAR(100)', nullable: true },
      { name: 'start_time', type: isPostgres ? 'VARCHAR(50)' : 'TEXT', nullable: true },
      { name: 'end_time', type: isPostgres ? 'VARCHAR(50)' : 'TEXT', nullable: true },
      { name: 'recurrence_rule', type: isPostgres ? 'VARCHAR(255)' : 'TEXT', nullable: true },
      { name: 'is_special', type: 'BOOLEAN', nullable: true, default: 'FALSE' },
      { name: 'day', type: 'INTEGER', nullable: true, constraint: isPostgres ? 'CHECK (day >= 0 AND day <= 6)' : 'CHECK (day >= 0 AND day <= 6)' }
    ];
    
    // Check which columns already exist to avoid duplicate additions
    let existingColumns = [];
    
    if (isPostgres) {
      const result = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'announcements'
      `);
      existingColumns = result.rows.map(row => row.column_name);
    } else {
      const result = await db.all(`PRAGMA table_info(announcements)`);
      existingColumns = result.map(row => row.name);
    }
    
    console.log(`Found ${existingColumns.length} existing columns in announcements table.`);
    
    // Add each missing column
    for (const column of missingColumns) {
      if (existingColumns.includes(column.name)) {
        console.log(`✅ Column '${column.name}' already exists, skipping.`);
        continue;
      }
      
      try {
        let alterQuery;
        
        if (isPostgres) {
          // PostgreSQL syntax
          alterQuery = `ALTER TABLE announcements ADD COLUMN ${column.name} ${column.type}`;
          if (column.default) {
            alterQuery += ` DEFAULT ${column.default}`;
          }
          if (column.constraint) {
            // Add constraint in a separate statement for PostgreSQL
            await db.query(alterQuery);
            await db.query(`ALTER TABLE announcements ADD CONSTRAINT chk_${column.name} ${column.constraint}`);
            console.log(`✅ Added column '${column.name}' with constraint to PostgreSQL announcements table`);
            continue;
          }
        } else {
          // SQLite syntax
          alterQuery = `ALTER TABLE announcements ADD COLUMN ${column.name} ${column.type}`;
          if (column.default) {
            alterQuery += ` DEFAULT ${column.default}`;
          }
          if (column.constraint) {
            alterQuery += ` ${column.constraint}`;
          }
        }
        
        await db.query ? await db.query(alterQuery) : await db.run(alterQuery);
        console.log(`✅ Added column '${column.name}' (${column.type}) to announcements table`);
        
      } catch (error) {
        console.error(`❌ Failed to add column '${column.name}':`, error.message);
        throw error;
      }
    }
    
    // Verify all columns were added successfully
    console.log('\n=== VERIFICATION ===');
    let finalColumns = [];
    
    if (isPostgres) {
      const result = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'announcements'
        ORDER BY ordinal_position
      `);
      finalColumns = result.rows;
    } else {
      const result = await db.all(`PRAGMA table_info(announcements)`);
      finalColumns = result.map(row => ({ column_name: row.name, data_type: row.type }));
    }
    
    console.log(`Final column count: ${finalColumns.length}`);
    
    // Check that all required columns now exist
    const requiredColumns = ['type', 'subcategory', 'start_time', 'end_time', 'recurrence_rule', 'is_special', 'day'];
    const finalColumnNames = finalColumns.map(col => col.column_name);
    
    let allPresent = true;
    for (const required of requiredColumns) {
      if (finalColumnNames.includes(required)) {
        console.log(`✅ ${required} - present`);
      } else {
        console.log(`❌ ${required} - still missing!`);
        allPresent = false;
      }
    }
    
    if (allPresent) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('📝 All required columns are now present in the announcements table.');
      console.log('🚀 The frontend should now be able to create announcements without column errors.');
    } else {
      throw new Error('Some required columns are still missing after migration');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addMissingAnnouncementColumns()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addMissingAnnouncementColumns };
