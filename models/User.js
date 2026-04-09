const db = require('../config/db');

const createUserTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        real_email VARCHAR(100),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_first_login BOOLEAN DEFAULT TRUE,
        otp VARCHAR(10),
        otp_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Ensure real_email and temp_password exist for existing tables
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='real_email') THEN
            ALTER TABLE users ADD COLUMN real_email VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='temp_password') THEN
            ALTER TABLE users ADD COLUMN temp_password VARCHAR(255);
        END IF;
    END $$;
    `;
    
    try {
        await db.query(query);
        
        // Add new tables for Admin Dashboard Features
        await db.query(`
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(20) UNIQUE NOT NULL,
                credits INTEGER,
                assigned_faculty VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS timetable_schedules (
                id SERIAL PRIMARY KEY,
                day VARCHAR(20) NOT NULL,
                time_slot VARCHAR(50) NOT NULL,
                subject_name VARCHAR(100) NOT NULL,
                faculty_name VARCHAR(100),
                room VARCHAR(50),
                batch VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS campus_notices (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                target_roles VARCHAR(100) DEFAULT 'Everyone',
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Add expires_at column if missing on existing tables
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campus_notices' AND column_name='expires_at') THEN
                    ALTER TABLE campus_notices ADD COLUMN expires_at TIMESTAMP;
                END IF;
            END $$;

            CREATE TABLE IF NOT EXISTS campus_issues (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT NOT NULL,
                reporter_name VARCHAR(100),
                reporter_role VARCHAR(50),
                status VARCHAR(20) DEFAULT 'Pending',
                image_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS campus_blueprints (
                id SERIAL PRIMARY KEY,
                original_name VARCHAR(255) NOT NULL,
                stored_name VARCHAR(255) NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                file_size BIGINT DEFAULT 0,
                uploaded_by VARCHAR(100) DEFAULT 'Admin',
                map_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Migrate existing blueprints table if columns are missing
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campus_blueprints' AND column_name='original_name') THEN
                    ALTER TABLE campus_blueprints ADD COLUMN original_name VARCHAR(255) DEFAULT 'unknown';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campus_blueprints' AND column_name='stored_name') THEN
                    ALTER TABLE campus_blueprints ADD COLUMN stored_name VARCHAR(255) DEFAULT 'unknown';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campus_blueprints' AND column_name='file_type') THEN
                    ALTER TABLE campus_blueprints ADD COLUMN file_type VARCHAR(50) DEFAULT 'unknown';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campus_blueprints' AND column_name='file_size') THEN
                    ALTER TABLE campus_blueprints ADD COLUMN file_size BIGINT DEFAULT 0;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campus_blueprints' AND column_name='uploaded_by') THEN
                    ALTER TABLE campus_blueprints ADD COLUMN uploaded_by VARCHAR(100) DEFAULT 'Admin';
                END IF;
            END $$;
        `);

        console.log('Database schema ensured (Users, Subjects, Schedules, Notices, Issues, Blueprints).');
    } catch (err) {
        console.error('Error creating database tables', err);
    }
};

module.exports = {
    createUserTable
};
