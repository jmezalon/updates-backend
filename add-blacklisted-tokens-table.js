const { initializeDatabase } = require('./db');

async function addBlacklistedTokensTable() {
  console.log('Adding blacklisted_tokens table...');
  
  try {
    const db = await initializeDatabase();
    
    // Create the blacklisted_tokens table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS blacklisted_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_hash TEXT NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        blacklisted_at INTEGER NOT NULL,
        expires_at INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    
    // Create indexes for performance
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_hash ON blacklisted_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_expires ON blacklisted_tokens(expires_at);
    `);
    
    console.log('✅ blacklisted_tokens table created successfully!');
    
    // Verify the table was created
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='blacklisted_tokens'");
    if (tables.length > 0) {
      console.log('✅ Table verification passed');
    } else {
      console.log('❌ Table verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error creating blacklisted_tokens table:', error);
  }
}

// Run the migration
addBlacklistedTokensTable().then(() => {
  console.log('Migration completed');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
