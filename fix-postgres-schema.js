// Script to fix PostgreSQL schema mismatches
const { Client } = require('pg');

async function fixPostgresSchema() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found, skipping PostgreSQL schema fix');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Check current schema and add missing columns
    console.log('Checking and fixing users table schema...');
    
    // Add missing columns if they don't exist
    const alterQueries = [
      // Ensure all users columns exist
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires BIGINT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS church_id INTEGER`,
      
      // Ensure all churches columns exist  
      `ALTER TABLE churches ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)`,
      `ALTER TABLE churches ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500)`,
      `ALTER TABLE churches ADD COLUMN IF NOT EXISTS description TEXT`,
      `ALTER TABLE churches ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE churches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      
      // Create missing tables if they don't exist
      `CREATE TABLE IF NOT EXISTS church_admin_assignments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, church_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )`,
      
      `CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date TIMESTAMP NOT NULL,
        location VARCHAR(255),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )`,
      
      `CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
        donor_name VARCHAR(255),
        amount DECIMAL(10,2) NOT NULL,
        donation_type VARCHAR(100),
        message TEXT,
        is_anonymous BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_church_follows (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        church_id INTEGER REFERENCES churches(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, church_id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_event_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, event_id)
      )`
    ];

    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log('✓ Executed:', query.substring(0, 50) + '...');
      } catch (error) {
        console.log('⚠ Warning:', error.message.substring(0, 100));
      }
    }

    console.log('PostgreSQL schema fix completed!');
    
  } catch (error) {
    console.error('Error fixing PostgreSQL schema:', error);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  fixPostgresSchema();
}

module.exports = { fixPostgresSchema };
