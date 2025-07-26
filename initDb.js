const { initializeDatabase } = require('./db');
const fs = require('fs');
const path = require('path');

async function initializeDb() {
  try {
    const db = await initializeDatabase();
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.exec(statement);
      }
    }
    
    console.log('Database schema created successfully!');
    
    // Insert seed data
    await seedData(db);
    
    console.log('Database initialized with seed data!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

async function seedData(db) {
  const bcrypt = require('bcryptjs');
  
  // Create properly hashed passwords for testing
  const adminPassword = await bcrypt.hash('admin123', 10);
  const pastorPassword = await bcrypt.hash('pastor123', 10);
  const mariePassword = await bcrypt.hash('marie123', 10);
  
  // Users with properly hashed passwords
  // await db.run(`INSERT OR IGNORE INTO users (id, email, password_hash, name, role) VALUES 
  //   (1, 'admin@updates.com', ?, 'Max Mezalon', 'superuser'),
  //   (2, 'pastor@scog.com', ?, 'Pastor Johnson', 'church_admin'),
  //   (3, 'admin@fmcob.com', ?, 'Admin Marie', 'church_admin')`, 
  //   [adminPassword, pastorPassword, mariePassword]);

  // Churches
  // await db.run(`INSERT OR IGNORE INTO churches (id, name, senior_pastor, pastor, assistant_pastor, senior_pastor_avatar, pastor_avatar, assistant_pastor_avatar, address, city, state, zip, contact_email, contact_phone, website, logo_url, banner_url, description) VALUES 
  //   (1, 'Salvation Church Of God', 'Pastor Malory Laurent', NULL, NULL, 'https://m.media-amazon.com/images/S/amzn-author-media-prod/311sgilkel5nd0fvv9jc2c1mum.jpg', NULL, NULL, '4601 Ave N', 'Brooklyn', 'NY', '11234', 'info@scog.com', '718-445-3822', 'https://www.facebook.com/salvationcog/', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQL_bILo6h4LGte0HYhuTDOPCXpgRP8xp8cjw&s', 'https://www.salvationcog.org/wp-content/uploads/revslider/slider-home/SanctuarySizedComp-scaled.jpg', 'A vibrant church community in Brooklyn.'),
  //   (2, 'Free Methodist Church of Bethlehem', 'Pastor Widmarch Pierre', 'Pastor Evans Pierre', NULL, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDhgmbl08fopV11ZqUt6hCXo0HCPN-pPbMQQ&s', 'https://i.ytimg.com/vi/_vPBINeRbDY/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAr8a0q_KC9OJDBSC_dg0tABroqpw', NULL, '4415 Glenwood Rd', 'Brooklyn', 'NY', '11203', 'contact@fmcob.com', '917-855-6441', 'https://www.facebook.com/p/Free-Methodist-Church-of-Bethlehem-100069513882451/', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-oZ_Loh9UKmJ3rVNsPXZOKY5VqSLxIM6xrQ&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1BpFLL2liNe9QWf4kL18QPZcv10fze1AjBA&s', 'A welcoming Methodist church serving the community.')`);

  // Church Admin Assignments
  // await db.run(`INSERT OR IGNORE INTO church_admin_assignments (user_id, church_id) VALUES 
  //   (2, 1), (3, 2)`);

  // Ministries
  // await db.run(`INSERT OR IGNORE INTO ministries (id, church_id, name, description) VALUES 
  //   (1, 1, 'Music Ministry', 'Worship and praise music'),
  //   (2, 1, 'Media Ministry', 'Audio/visual and streaming'),
  //   (3, 1, 'Kitchen Ministry', 'Food service and hospitality'),
  //   (4, 2, 'Media Ministry', 'Sound and recording'),
  //   (5, 2, 'Usher Ministry', 'Greeting and seating guests')`);

  // // Donations
  // await db.run(`INSERT OR IGNORE INTO donations (church_id, method, contact_name, contact_info, note) VALUES 
  //   (1, 'Zelle', 'SCG Zelle', '347-486-8932', 'Use Zelle for donations to Salvation Church of God'),
  //   (1, 'Cash App', 'SCG CashApp', '$scg2016', 'Use Cash App for donations to Salvation Church of God'),
  //   (2, 'Zelle', 'FMCB Zelle', '718-555-1234', 'Zelle for Free Methodist Church of Bethlehem'),
  //   (2, 'Cash App', 'FMCB CashApp', '$fmcb2024', 'Cash App for Free Methodist Church of Bethlehem')`);

  // // Members
  // await db.run(`INSERT OR IGNORE INTO members (church_id, ministry_id, name, role, avatar_url, bio, email) VALUES 
  //   (1, 1, 'Christopher St. Fluer', 'Assistant Pianist', 'https://tabler.io/_next/image?url=%2Favatars%2Ftransparent%2F9d119d757ff7d7b36b9d71b86d973fbe.png&w=400&q=75', 'Talented pianist for the worship team.', 'chris@scog.com'),
  //   (1, 1, 'Stanley Paul', 'Lead Pianist', 'https://byuc.wordpress.com/wp-content/uploads/2012/07/avat-2.jpg', 'Leads the music ministry.', 'stanley@scog.com'),
  //   (1, 2, 'Laurina Estabon', 'Lead Chorus', 'https://a.storyblok.com/f/191576/1176x882/9bdc5d8400/round_profile_picture_hero_before.webp', 'Leads the choir.', 'laurina@scog.com'),
  //   (1, 3, 'Joshua Guerrier', 'Head Chef', 'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1hbGUlMjBwcm9maWxlfGVufDB8fDB8fHww', 'Manages the kitchen.', 'joshua@scog.com'),
  //   (2, 4, 'Marie Media', 'Sound Engineer', 'https://static-cse.canva.com/blob/2104103/1600w-HBwnRqn0b34.jpg', 'Operates sound equipment.', 'marie@fmcob.com'),
  //   (2, 5, 'Paul Usher', 'Usher', 'https://t4.ftcdn.net/jpg/06/08/55/73/360_F_608557356_ELcD2pwQO9pduTRL30umabzgJoQn5fnd.jpg', 'Greets and seats guests.', 'paul@fmcob.com')`);

  // Events
  // await db.run(`INSERT OR IGNORE INTO events (church_id, title, description, location, start_datetime, end_datetime, image_url, price, contact_email, contact_phone, website, favorites_count) VALUES 
  //   (1, '8th Annual Revival', 'A week of revival and worship.', '4601 Ave N, Brooklyn NY 11234', '2024-12-15 19:30:00', NULL, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMH_5ybxLcAGTAR5LhtdtbiWTDACEAdnAUQY-EyKlwHL7Jxovc4lPnsF2_PPj_SC06Xic&usqp=CAU', 0, 'info@scog.com', '718-445-3822', 'https://scog.com/events/revival', 50),
  //   (2, 'La Puissance De La Main De Dieu', 'A special event with guest speakers.', '4415 Glenwood Rd, Brooklyn NY 11203', '2024-11-07 20:00:00', NULL, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStnDeK7GereOosWqoR-rp2-hWD44K6W4uc6K15wmCatETdInXgxZPH9-t98pQmVkKKXuk&usqp=CAU', 0, 'contact@fmcob.com', '917-855-6441', 'https://fmcob.com/events/puissance', 30)`);

  // Announcements
//   await db.run(`INSERT OR IGNORE INTO announcements (church_id, title, description, image_url, type, subcategory, start_time, end_time, recurrence_rule, is_special, posted_at) VALUES 
//     -- Featured Events (matching mockup)
//     (1, '8th Annual Revival', 'December 15th, 2024 @ 7:30 PM - 4601 Ave N, Brooklyn NY 11234', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMH_5ybxLcAGTAR5LhtdtbiWTDACEAdnAUQY-EyKlwHL7Jxovc4lPnsF2_PPj_SC06Xic&usqp=CAU', 'special', NULL, NULL, NULL, NULL, 1, '2024-12-01 10:00:00'),
//     (2, 'La Puissance De La Main De Dieu', 'November 7th, 2024 @ 8:00 PM - 4415 Glenwood Rd, Brooklyn NY', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStnDeK7GereOosWqoR-rp2-hWD44K6W4uc6K15wmCatETdInXgxZPH9-t98pQmVkKKXuk&usqp=CAU', 'special', NULL, NULL, NULL, NULL, 1, '2024-10-25 09:00:00'),
//     -- Regular Services
//     (1, 'Sunday Morning Worship', 'First Service', NULL, 'service', 'first_service', 'Sunday 8:30 AM', 'Sunday 11:00 AM', 'weekly', 0, NULL),
//     (1, 'Sunday Morning Worship', 'Second Service', NULL, 'service', 'second_service', 'Sunday 11:30 AM', 'Sunday 1:00 PM', 'weekly', 0, NULL),
//     (1, 'Weekly Bible Study', 'Youth Bible Study', NULL, 'bible_study', 'youth', 'Thursday 5:00 PM', 'Thursday 6:50 PM', 'weekly', 0, NULL),
//     (1, 'Weekly Bible Study', 'Adult Bible Study', NULL, 'bible_study', 'adult', 'Thursday 7:00 PM', 'Thursday 9:00 PM', 'weekly', 0, NULL),
//     (2, 'Sunday Worship', 'Main Service', NULL, 'service', NULL, 'Sunday 10:00 AM', 'Sunday 12:00 PM', 'weekly', 0, NULL),
//     (2, 'Weekly Bible Study', 'Adult Bible Study', NULL, 'bible_study', 'adult', 'Wednesday 7:00 PM', 'Wednesday 8:30 PM', 'weekly', 0, NULL)`);
}

if (require.main === module) {
  initializeDb();
}

module.exports = { initializeDb };
