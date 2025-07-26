const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'updates.db');

async function migratePasswordReset() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database for password reset migration');
    });

    db.serialize(() => {
      // Add password reset fields to users table
      db.run(`
        ALTER TABLE users 
        ADD COLUMN password_reset_token TEXT DEFAULT NULL;
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding password_reset_token column:', err.message);
          reject(err);
          return;
        }
        console.log('Added password_reset_token column');
      });

      db.run(`
        ALTER TABLE users 
        ADD COLUMN password_reset_expires INTEGER DEFAULT NULL;
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding password_reset_expires column:', err.message);
          reject(err);
          return;
        }
        console.log('Added password_reset_expires column');
      });

      db.run(`
        ALTER TABLE users 
        ADD COLUMN password_reset_requested_at INTEGER DEFAULT NULL;
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding password_reset_requested_at column:', err.message);
          reject(err);
          return;
        }
        console.log('Added password_reset_requested_at column for rate limiting');
      });
    });

    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        reject(err);
        return;
      }
      console.log('Password reset migration completed successfully');
      resolve();
    });
  });
}

// Run migration if called directly
if (require.main === module) {
  migratePasswordReset()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { migratePasswordReset };
