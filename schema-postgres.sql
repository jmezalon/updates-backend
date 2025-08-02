-- PostgreSQL Schema for Updates Backend (matching actual SQLite structure)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superuser', 'church_admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enrollment_status VARCHAR(50) DEFAULT 'none' CHECK (enrollment_status IN ('none', 'pending', 'assigned')),
    password_reset_token VARCHAR(255) DEFAULT NULL,
    password_reset_expires BIGINT DEFAULT NULL,
    password_reset_requested_at BIGINT DEFAULT NULL,
    avatar VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS churches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    senior_pastor VARCHAR(255) NOT NULL,
    pastor VARCHAR(255),
    assistant_pastor VARCHAR(255),
    senior_pastor_avatar VARCHAR(500),
    pastor_avatar VARCHAR(500),
    assistant_pastor_avatar VARCHAR(500),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS church_admin_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    church_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
);

-- Token blacklisting table for secure logout
CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id SERIAL PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    blacklisted_at BIGINT NOT NULL,
    expires_at BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_hash ON blacklisted_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_expires ON blacklisted_tokens(expires_at);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP,
    image_url VARCHAR(500),
    price DECIMAL(10,2),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    favorites_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(100),
    subcategory VARCHAR(100),
    start_time VARCHAR(50),
    end_time VARCHAR(50),
    recurrence_rule VARCHAR(255),
    is_special BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    day INTEGER CHECK (day >= 0 AND day <= 6),
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL,
    method VARCHAR(100) NOT NULL,
    contact_name VARCHAR(255),
    contact_info VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ministries (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL,
    ministry_id INTEGER,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_church_follows (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    church_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (church_id) REFERENCES churches(id) ON DELETE CASCADE,
    UNIQUE(user_id, church_id)
);

CREATE TABLE IF NOT EXISTS user_event_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE(user_id, event_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_church_follows_user_id ON user_church_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_church_follows_church_id ON user_church_follows(church_id);
CREATE INDEX IF NOT EXISTS idx_user_event_likes_user_id ON user_event_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_likes_event_id ON user_event_likes(event_id);
