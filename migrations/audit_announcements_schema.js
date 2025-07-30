const { initializeDatabase, getDb } = require('../db');

/**
 * Schema Audit: Check which columns exist in announcements table
 * 
 * This script compares the expected frontend fields with the actual database schema
 * to identify missing columns that need to be added.
 */
async function auditAnnouncementsSchema() {
  // Set SSL configuration for PostgreSQL if needed
  if (process.env.DATABASE_URL) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  
  // Initialize database connection first
  await initializeDatabase();
  const db = getDb();
  const isPostgres = !!process.env.DATABASE_URL;
  
  try {
    console.log(`Auditing announcements table schema (${isPostgres ? 'PostgreSQL' : 'SQLite'})...`);
    
    // Expected fields from frontend ManageAnnouncements.tsx
    const expectedFields = [
      'id',
      'church_id', 
      'title',
      'description',
      'image_url',
      'type',
      'subcategory',
      'start_time',
      'end_time',
      'recurrence_rule',
      'is_special',
      'posted_at',
      'day',
      'created_at',
      'updated_at'
    ];
    
    let existingColumns = [];
    
    if (isPostgres) {
      // PostgreSQL: Get column information
      const result = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'announcements'
        ORDER BY ordinal_position
      `);
      
      existingColumns = result.rows.map(row => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default
      }));
      
    } else {
      // SQLite: Get table info
      const result = await db.all(`PRAGMA table_info(announcements)`);
      existingColumns = result.map(row => ({
        name: row.name,
        type: row.type,
        nullable: !row.notnull,
        default: row.dflt_value
      }));
    }
    
    console.log('\n=== EXISTING COLUMNS ===');
    existingColumns.forEach(col => {
      console.log(`✅ ${col.name} (${col.type}${col.nullable ? ', nullable' : ', not null'}${col.default ? `, default: ${col.default}` : ''})`);
    });
    
    console.log('\n=== MISSING COLUMNS ===');
    const existingColumnNames = existingColumns.map(col => col.name);
    const missingColumns = expectedFields.filter(field => !existingColumnNames.includes(field));
    
    if (missingColumns.length === 0) {
      console.log('🎉 No missing columns! All expected fields exist in the database.');
    } else {
      missingColumns.forEach(col => {
        console.log(`❌ ${col} - MISSING`);
      });
      
      console.log(`\n📝 Found ${missingColumns.length} missing column(s) that need to be added.`);
    }
    
    console.log('\n=== UNEXPECTED COLUMNS ===');
    const unexpectedColumns = existingColumnNames.filter(col => !expectedFields.includes(col));
    if (unexpectedColumns.length === 0) {
      console.log('✅ No unexpected columns found.');
    } else {
      unexpectedColumns.forEach(col => {
        console.log(`⚠️  ${col} - exists in database but not expected by frontend`);
      });
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Expected fields: ${expectedFields.length}`);
    console.log(`Existing columns: ${existingColumns.length}`);
    console.log(`Missing columns: ${missingColumns.length}`);
    console.log(`Unexpected columns: ${unexpectedColumns.length}`);
    
    return {
      existingColumns,
      missingColumns,
      unexpectedColumns,
      isPostgres
    };
    
  } catch (error) {
    console.error('❌ Schema audit failed:', error);
    throw error;
  }
}

// Run audit if called directly
if (require.main === module) {
  auditAnnouncementsSchema()
    .then(() => {
      console.log('\nSchema audit completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Schema audit failed:', error);
      process.exit(1);
    });
}

module.exports = { auditAnnouncementsSchema };
