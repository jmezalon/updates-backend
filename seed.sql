-- SCHEMA: Create tables

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('superuser', 'church_admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS churches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    senior_pastor VARCHAR(100) NOT NULL,
    pastor VARCHAR(100),
    assistant_pastor VARCHAR(100),
    senior_pastor_avatar VARCHAR(255),
    pastor_avatar VARCHAR(255),
    assistant_pastor_avatar VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    logo_url VARCHAR(255),
    banner_url VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS church_admin_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    church_id INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, church_id)
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP,
    image_url VARCHAR(255),
    price NUMERIC(10,2),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    favorites_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(32),
    subcategory VARCHAR(32),
    start_time VARCHAR(64),
    end_time VARCHAR(64),
    recurrence_rule VARCHAR(64),
    is_special BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ministries (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL, -- e.g., 'Zelle', 'Cash App'
    contact_name VARCHAR(100),
    contact_info VARCHAR(100) NOT NULL, -- e.g., email, phone, or $cashtag
    note VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    ministry_id INTEGER REFERENCES ministries(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    profile_image_url VARCHAR(255),
    bio TEXT,
    contact_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEED DATA

-- Users
INSERT INTO users (email, password_hash, name, role) VALUES
  ('superuser@updatesapp.com', 'supersecret', 'Max Mezalon', 'superuser'),
  ('admin1@churchone.com', 'adminpass1', 'Alice Admin', 'church_admin'),
  ('admin2@churchtwo.com', 'adminpass2', 'Bob Admin', 'church_admin')
ON CONFLICT (email) DO NOTHING;

-- Churches
INSERT INTO churches (name, senior_pastor, senior_pastor_avatar, pastor, pastor_avatar, assistant_pastor, assistant_pastor_avatar, address, city, state, zip, contact_email, contact_phone, website, logo_url, banner_url, description) VALUES
  ('Salvation Church Of God', 'Malory Laurent', 'https://m.media-amazon.com/images/S/amzn-author-media-prod/311sgilkel5nd0fvv9jc2c1mum.jpg', NULL, NULL, NULL, NULL, '4601 Ave N', 'Brooklyn', 'NY', '11234', 'info@scog.com', '718-445-3822', 'https://www.facebook.com/salvationcog/', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQL_bILo6h4LGte0HYhuTDOPCXpgRP8xp8cjw&s', 'https://www.salvationcog.org/wp-content/uploads/revslider/slider-home/SanctuarySizedComp-scaled.jpg', 'A vibrant community church.'),
  ('Free Methodist Church of Bethlehem', 'Widmarc Pierre', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDhgmbl08fopV11ZqUt6hCXo0HCPN-pPbMQQ&s', 'Evans Pierre', 'https://i.ytimg.com/vi/_vPBINeRbDY/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAr8a0q_KC9OJDBSC_dg0tABroqpw', NULL, NULL, '4415 Glenwood Rd', 'Brooklyn', 'NY', '11203', 'contact@fmcob.com', '917-855-6441', 'https://www.facebook.com/p/Free-Methodist-Church-of-Bethlehem-100069513882451/', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-oZ_Loh9UKmJ3rVNsPXZOKY5VqSLxIM6xrQ&s', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1BpFLL2liNe9QWf4kL18QPZcv10fze1AjBA&s', 'Serving the community for over 50 years.')
ON CONFLICT (name) DO NOTHING;

-- Church Admin Assignments
INSERT INTO church_admin_assignments (user_id, church_id) VALUES (2, 1) ON CONFLICT DO NOTHING;
INSERT INTO church_admin_assignments (user_id, church_id) VALUES (3, 2) ON CONFLICT DO NOTHING;

-- Ministries
INSERT INTO ministries (church_id, name, description) VALUES
  (1, 'Musicians', 'Handles all music-related activities.'),
  (1, 'Worship Leaders', 'Leads worship sessions.'),
  (1, 'Kitchen', 'Manages food and catering.'),
  (2, 'Media', 'Handles sound and video.'),
  (2, 'Ushers', 'Welcomes and seats guests.')
ON CONFLICT DO NOTHING;

-- Members
INSERT INTO members (church_id, ministry_id, name, role, profile_image_url, bio, contact_email) VALUES
  (1, 1, 'Christopher St. Fluer', 'Assistant Pianist', 'https://tabler.io/_next/image?url=%2Favatars%2Ftransparent%2F9d119d757ff7d7b36b9d71b86d973fbe.png&w=400&q=75', 'Talented pianist for the worship team.', 'chris@scog.com'),
  (1, 1, 'Stanley Paul', 'Lead Pianist', 'https://byuc.wordpress.com/wp-content/uploads/2012/07/avat-2.jpg', 'Leads the music ministry.', 'stanley@scog.com'),
  (1, 2, 'Laurina Estabon', 'Lead Chorus', 'https://a.storyblok.com/f/191576/1176x882/9bdc5d8400/round_profile_picture_hero_before.webp', 'Leads the choir.', 'laurina@scog.com'),
  (1, 3, 'Joshua Guerrier', 'Head Chef', 'https://images.unsplash.com/photo-1480455624313-e29b44bbfde1?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1hbGUlMjBwcm9maWxlfGVufDB8fDB8fHww', 'Manages the kitchen.', 'joshua@scog.com'),
  (2, 4, 'Marie Media', 'Sound Engineer', 'https://static-cse.canva.com/blob/2104103/1600w-HBwnRqn0b34.jpg', 'Operates sound equipment.', 'marie@fmcob.com'),
  (2, 5, 'Paul Usher', 'Usher', 'https://t4.ftcdn.net/jpg/06/08/55/73/360_F_608557356_ELcD2pwQO9pduTRL30umabzgJoQn5fnd.jpg', 'Greets and seats guests.', 'paul@fmcob.com')
ON CONFLICT DO NOTHING;

-- Events
INSERT INTO events (church_id, title, description, location, start_datetime, end_datetime, image_url, price, contact_email, contact_phone, website, favorites_count) VALUES
  (1, '8th Annual Revival', 'A week of revival and worship.', '4601 Ave N, Brooklyn NY 11234', '2024-12-15 19:30:00', NULL, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMH_5ybxLcAGTAR5LhtdtbiWTDACEAdnAUQY-EyKlwHL7Jxovc4lPnsF2_PPj_SC06Xic&usqp=CAU', 0, 'info@scog.com', '718-445-3822', 'https://scog.com/events/revival', 50),
  (2, 'La Puissance De La Main De Dieu', 'A special event with guest speakers.', '4415 Glenwood Rd, Brooklyn NY 11203', '2024-11-07 20:00:00', NULL, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcStnDeK7GereOosWqoR-rp2-hWD44K6W4uc6K15wmCatETdInXgxZPH9-t98pQmVkKKXuk&usqp=CAU', 0, 'contact@fmcob.com', '917-855-6441', 'https://fmcob.com/events/puissance', 30)
ON CONFLICT DO NOTHING;

-- Donations
INSERT INTO donations (church_id, method, contact_name, contact_info, note) VALUES
  (1, 'Zelle', 'SCG Zelle', '347-486-8932', 'Use Zelle for donations to Salvation Church of God'),
  (1, 'Cash App', 'SCG CashApp', '$scg2016', 'Use Cash App for donations to Salvation Church of God'),
  (2, 'Zelle', 'FMCB Zelle', '718-555-1234', 'Zelle for Free Methodist Church of Bethlehem'),
  (2, 'Cash App', 'FMCB CashApp', '$fmcbrooklyn', 'Cash App for Free Methodist Church of Bethlehem');

-- Announcements
INSERT INTO announcements (church_id, title, description, image_url, posted_at, type, subcategory, start_time, end_time, recurrence_rule, is_special) VALUES
-- Salvation Church Of God Schedules
  (1, 'Sunday Morning Worship', 'First Service', NULL, NULL, 'service', 'first_service', 'Sunday 8:30 AM', 'Sunday 11:00 AM', 'weekly', FALSE),
  (1, 'Sunday Morning Worship', 'Second Service', NULL, NULL, 'service', 'second_service', 'Sunday 11:30 AM', 'Sunday 1:00 PM', 'weekly', FALSE),
  (1, 'Weekly Bible Study', 'Youth Bible Study', NULL, NULL, 'bible_study', 'youth', 'Thursday 5:00 PM', 'Thursday 6:50 PM', 'weekly', FALSE),
  (1, 'Weekly Bible Study', 'Adult Bible Study', NULL, NULL, 'bible_study', 'adult', 'Thursday 7:00 PM', 'Thursday 9:00 PM', 'weekly', FALSE),
  (1, 'Weekly Prayer Service', 'General Prayer', NULL, NULL, 'prayer', NULL, 'Tuesday 7:00 PM', 'Tuesday 10:00 PM', 'weekly', FALSE),
  (1, 'Yearly 6 to 6 Fast', 'Annual church-wide fast', NULL, '2024-10-10 06:00:00', 'fast', NULL, 'October 10, 2024 6:00 AM', NULL, 'yearly', FALSE),
-- Special/Upcoming/Reminders
  (1, 'Our 9th Anniversary Gala', 'Special event for the church anniversary', NULL, '2024-12-05 19:30:00', 'special', NULL, NULL, NULL, NULL, TRUE),
  (1, 'Monthly Watch Night', 'Monthly all-night prayer', NULL, '2024-09-01 20:30:00', 'reminder', NULL, NULL, NULL, 'monthly', TRUE),
-- Free Methodist Church of Bethlehem Schedules
  (2, 'Sunday Worship', 'Main Service', NULL, NULL, 'service', NULL, 'Sunday 10:00 AM', 'Sunday 12:00 PM', 'weekly', FALSE),
  (2, 'Weekly Bible Study', 'Adult Bible Study', NULL, NULL, 'bible_study', 'adult', 'Wednesday 7:00 PM', 'Wednesday 8:30 PM', 'weekly', FALSE),
  (2, 'Weekly Prayer Service', 'General Prayer', NULL, NULL, 'prayer', NULL, 'Friday 6:00 PM', 'Friday 8:00 PM', 'weekly', FALSE),
  (2, 'Church Fast', 'Quarterly fasting and prayer', NULL, '2024-09-15 06:00:00', 'fast', NULL, 'September 15, 2024 6:00 AM', NULL, 'quarterly', FALSE),
-- Special/Upcoming/Reminders
  (2, 'Thanksgiving Service', 'Special thanksgiving event', NULL, '2024-11-28 10:00:00', 'special', NULL, NULL, NULL, NULL, TRUE),
  (2, 'Youth Revival', 'Reminder for youth revival night', NULL, '2024-08-20 19:00:00', 'reminder', 'youth', NULL, NULL, NULL, TRUE)
ON CONFLICT DO NOTHING;
