const { initializeDatabase, getDb } = require('../db');

/**
 * Migration: Add day field to announcements table for weekly schedule ordering
 * 
 * Day values: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
 * This allows multiple activities per day while maintaining proper Sunday-Saturday ordering
 */
async function addDayToAnnouncements() {
  // Initialize database connection first
  await initializeDatabase();
  const db = getDb();
  
  try {
    console.log('Starting migration: Adding day field to announcements table...');
    
    // Add the day column to announcements table
    await db.run(`
      ALTER TABLE announcements 
      ADD COLUMN day INTEGER CHECK (day >= 0 AND day <= 6)
    `);
    
    console.log('✅ Successfully added day column to announcements table');
    
    // Update existing weekly announcements with default day values based on their titles
    // This is a best-effort attempt to assign days to existing data
    const weeklyAnnouncements = await db.all(`
      SELECT id, title, start_time 
      FROM announcements 
      WHERE type = 'weekly' OR (is_special = 0 AND recurrence_rule IS NOT NULL)
    `);
    
    console.log(`Found ${weeklyAnnouncements.length} existing weekly announcements to update...`);
    
    // Simple heuristic to assign days based on common patterns in titles
    for (const announcement of weeklyAnnouncements) {
      let day = null;
      const title = announcement.title.toLowerCase();
      
      if (title.includes('sunday') || title.includes('worship service') || title.includes('morning service')) {
        day = 0; // Sunday
      } else if (title.includes('monday')) {
        day = 1; // Monday
      } else if (title.includes('tuesday')) {
        day = 2; // Tuesday
      } else if (title.includes('wednesday') || title.includes('midweek')) {
        day = 3; // Wednesday
      } else if (title.includes('thursday')) {
        day = 4; // Thursday
      } else if (title.includes('friday')) {
        day = 5; // Friday
      } else if (title.includes('saturday')) {
        day = 6; // Saturday
      } else {
        // Default to Sunday for unmatched weekly activities
        day = 0;
      }
      
      await db.run(`
        UPDATE announcements 
        SET day = ? 
        WHERE id = ?
      `, [day, announcement.id]);
      
      console.log(`  Updated "${announcement.title}" → ${getDayName(day)}`);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📝 Note: Please review and update day assignments in the admin portal as needed.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

function getDayName(day) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
}

// Run migration if called directly
if (require.main === module) {
  addDayToAnnouncements()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addDayToAnnouncements };
