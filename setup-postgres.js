const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupPostgres() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found, skipping PostgreSQL setup');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Setting up PostgreSQL database...');
    
    // Read and execute PostgreSQL schema
    const schemaPath = path.join(__dirname, 'schema-postgres.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('PostgreSQL database setup completed successfully!');
    
  } catch (error) {
    console.error('Error setting up PostgreSQL database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupPostgres();
}

module.exports = { setupPostgres };
