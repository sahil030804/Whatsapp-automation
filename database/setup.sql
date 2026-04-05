-- Create database (run this as a superuser)
CREATE DATABASE IF NOT EXISTS whatsapp_automation;

-- Connect to the database
\c whatsapp_automation;

-- Create users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    -- uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
-- CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login_at ON users(last_login_at);

-- Insert a default admin user (password: admin123)
-- Note: In production, you should change this password and use proper password hashing
INSERT INTO users (
    email, 
    password_hash, 
    full_name, 
    first_name,
    last_name,
    role, 
    is_active
) VALUES (
    'admin@whatsapp-automation.com',
    '$2b$10$rQZ8ZkGZJZJZJZJZJZJZJuZJZJZJZJZJZJZJZJZJZJZJZJZJZJZ', -- This is a placeholder hash
    'System Administrator',
    'System',
    'Administrator',
    'admin',
    true
);
