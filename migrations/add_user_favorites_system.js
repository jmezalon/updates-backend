const { getDb, initializeDatabase } = require('../db');

async function runMigration() {
  console.log('Starting user favorites system migration...');
  
  try {
    // Initialize database connection
    const db = await initializeDatabase();
    
    console.log('Adding avatar field to users table...');
    
    // Add avatar field to users table
    await db.run(`
      ALTER TABLE users ADD COLUMN avatar TEXT
    `);
    
    console.log('Creating user_church_follows table...');
    
    // Create table for users following churches
    await db.run(`
      CREATE TABLE IF NOT EXISTS user_church_follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        church_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE,
        UNIQUE(user_id, church_id)
      )
    `);
    
    console.log('Creating user_event_likes table...');
    
    // Create table for users liking events
    await db.run(`
      CREATE TABLE IF NOT EXISTS user_event_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        event_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        UNIQUE(user_id, event_id)
      )
    `);
    
    console.log('Creating indexes for better performance...');
    
    // Create indexes for better query performance
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_user_church_follows_user_id ON user_church_follows(user_id)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_user_church_follows_church_id ON user_church_follows(church_id)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_user_event_likes_user_id ON user_event_likes(user_id)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_user_event_likes_event_id ON user_event_likes(event_id)
    `);
    
    console.log('Migration completed successfully!');
    console.log('✅ Added avatar field to users table');
    console.log('✅ Created user_church_follows table');
    console.log('✅ Created user_event_likes table');
    console.log('✅ Created performance indexes');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
