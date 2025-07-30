const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function migrateToPostgres() {
  let sqliteDb;
  
  try {
    // Connect to SQLite
    sqliteDb = await open({
      filename: path.join(__dirname, 'updates.db'),
      driver: sqlite3.Database
    });
    
    console.log('Connected to SQLite database');
    
    // Create PostgreSQL tables from PostgreSQL schema
    const fs = require('fs');
    const schema = fs.readFileSync(path.join(__dirname, 'schema-postgres.sql'), 'utf8');
    
    console.log('Creating PostgreSQL tables...');
    await pool.query(schema);
    
    // Get all table names
    const tables = await sqliteDb.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    // Migrate data for each table
    for (const table of tables) {
      const tableName = table.name;
      console.log(`Migrating table: ${tableName}`);
      
      // Get all data from SQLite table
      const rows = await sqliteDb.all(`SELECT * FROM ${tableName}`);
      
      if (rows.length > 0) {
        // Get column names from SQLite
        const sqliteColumns = Object.keys(rows[0]);
        
        // Get PostgreSQL table structure to match columns
        const pgTableInfo = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
        `, [tableName]);
        
        const pgColumns = pgTableInfo.rows.map(row => row.column_name);
        
        // Find matching columns (exclude auto-increment id and non-matching columns)
        const matchingColumns = sqliteColumns.filter(col => 
          pgColumns.includes(col) && col !== 'id'
        );
        
        if (matchingColumns.length > 0) {
          const columnList = matchingColumns.join(', ');
          const placeholders = matchingColumns.map((_, i) => `$${i + 1}`).join(', ');
          
          // Insert data into PostgreSQL
          for (const row of rows) {
            const values = matchingColumns.map(col => row[col]);
            try {
              await pool.query(
                `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`,
                values
              );
            } catch (insertError) {
              console.warn(`Failed to insert row in ${tableName}:`, insertError.message);
              // Continue with next row
            }
          }
          
          console.log(`Migrated ${rows.length} rows from ${tableName}`);
        } else {
          console.log(`No matching columns found for table ${tableName}, skipping data migration`);
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (sqliteDb) {
      await sqliteDb.close();
    }
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToPostgres();
}

module.exports = { migrateToPostgres };
