const { Pool } = require('pg');
require('dotenv').config();

async function addPasswordResetColumn() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found. This script is for production PostgreSQL only.');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password_reset_requested_at';
    `;
    
    const columnExists = await pool.query(checkColumnQuery);
    
    if (columnExists.rows.length > 0) {
      console.log('✅ Column password_reset_requested_at already exists');
    } else {
      console.log('Adding password_reset_requested_at column to users table...');
      
      const addColumnQuery = `
        ALTER TABLE users 
        ADD COLUMN password_reset_requested_at BIGINT DEFAULT NULL;
      `;
      
      await pool.query(addColumnQuery);
      console.log('✅ Successfully added password_reset_requested_at column');
    }

    // Also check and add other password reset columns if missing
    const checkTokenColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password_reset_token';
    `;
    
    const tokenColumnExists = await pool.query(checkTokenColumn);
    
    if (tokenColumnExists.rows.length === 0) {
      console.log('Adding password_reset_token column...');
      await pool.query('ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) DEFAULT NULL;');
      console.log('✅ Successfully added password_reset_token column');
    }

    const checkExpiresColumn = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'password_reset_expires';
    `;
    
    const expiresColumnExists = await pool.query(checkExpiresColumn);
    
    if (expiresColumnExists.rows.length === 0) {
      console.log('Adding password_reset_expires column...');
      await pool.query('ALTER TABLE users ADD COLUMN password_reset_expires BIGINT DEFAULT NULL;');
      console.log('✅ Successfully added password_reset_expires column');
    }

    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
addPasswordResetColumn();
