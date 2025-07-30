const { initializeDatabase, getDb } = require('../db');

/**
 * Schema Audit: Check events table schema and data types
 * 
 * This script examines the events table to identify any schema issues
 * that might cause datetime fields to be returned as empty objects.
 */
async function auditEventsSchema() {
  // Set SSL configuration for PostgreSQL if needed
  if (process.env.DATABASE_URL) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  
  // Initialize database connection first
  await initializeDatabase();
  const db = getDb();
  const isPostgres = !!process.env.DATABASE_URL;
  
  try {
    console.log(`Auditing events table schema (${isPostgres ? 'PostgreSQL' : 'SQLite'})...`);
    
    // Expected fields from frontend ManageEvents.tsx
    const expectedFields = [
      'id',
      'church_id', 
      'title',
      'description',
      'location',
      'start_datetime',
      'end_datetime',
      'image_url',
      'price',
      'contact_email',
      'contact_phone',
      'website',
      'favorites_count',
      'created_at',
      'updated_at'
    ];
    
    let existingColumns = [];
    
    if (isPostgres) {
      // PostgreSQL: Get column information
      const result = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'events'
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
      const result = await db.all(`PRAGMA table_info(events)`);
      existingColumns = result.map(row => ({
        name: row.name,
        type: row.type,
        nullable: !row.notnull,
        default: row.dflt_value
      }));
    }
    
    console.log('\n=== EXISTING COLUMNS ===');
    existingColumns.forEach(col => {
      const isDatetime = col.name.includes('datetime') || col.name.includes('_at');
      const marker = isDatetime ? '📅' : '📝';
      console.log(`${marker} ${col.name} (${col.type}${col.nullable ? ', nullable' : ', not null'}${col.default ? `, default: ${col.default}` : ''})`);
    });
    
    console.log('\n=== MISSING COLUMNS ===');
    const existingColumnNames = existingColumns.map(col => col.name);
    const missingColumns = expectedFields.filter(field => !existingColumnNames.includes(field));
    
    if (missingColumns.length === 0) {
      console.log('✅ No missing columns! All expected fields exist in the database.');
    } else {
      missingColumns.forEach(col => {
        console.log(`❌ ${col} - MISSING`);
      });
    }
    
    // Check datetime column types specifically
    console.log('\n=== DATETIME COLUMN ANALYSIS ===');
    const datetimeColumns = existingColumns.filter(col => 
      col.name.includes('datetime') || col.name.includes('_at')
    );
    
    datetimeColumns.forEach(col => {
      console.log(`📅 ${col.name}: ${col.type}`);
      if (isPostgres && !col.type.includes('timestamp')) {
        console.log(`   ⚠️  Warning: PostgreSQL datetime column should be 'timestamp' type, found '${col.type}'`);
      }
    });
    
    // Test a sample query to see what's returned
    console.log('\n=== SAMPLE DATA TEST ===');
    try {
      let sampleQuery;
      if (isPostgres) {
        sampleQuery = await db.query('SELECT id, start_datetime, end_datetime FROM events LIMIT 1');
      } else {
        sampleQuery = await db.get('SELECT id, start_datetime, end_datetime FROM events LIMIT 1');
      }
      
      const sampleData = isPostgres ? sampleQuery.rows[0] : sampleQuery;
      if (sampleData) {
        console.log('Sample event data:');
        console.log(`  ID: ${sampleData.id}`);
        console.log(`  start_datetime: ${JSON.stringify(sampleData.start_datetime)} (type: ${typeof sampleData.start_datetime})`);
        console.log(`  end_datetime: ${JSON.stringify(sampleData.end_datetime)} (type: ${typeof sampleData.end_datetime})`);
      } else {
        console.log('No events found in database for testing.');
      }
    } catch (sampleError) {
      console.log('Could not retrieve sample data:', sampleError.message);
    }
    
    return {
      existingColumns,
      missingColumns,
      isPostgres
    };
    
  } catch (error) {
    console.error('❌ Schema audit failed:', error);
    throw error;
  }
}

// Run audit if called directly
if (require.main === module) {
  auditEventsSchema()
    .then(() => {
      console.log('\nEvents schema audit completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Events schema audit failed:', error);
      process.exit(1);
    });
}

module.exports = { auditEventsSchema };
