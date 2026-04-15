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
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='current_status') THEN
            ALTER TABLE users ADD COLUMN current_status VARCHAR(50) DEFAULT 'Off Duty';
        END IF;

        -- Normalize roles
        UPDATE users SET role = 'staff' WHERE role ILIKE 'faculty' OR role ILIKE 'professor';
        UPDATE users SET role = 'guard' WHERE role ILIKE 'security guard' OR role ILIKE 'security';
        UPDATE users SET role = LOWER(role) WHERE role NOT IN ('staff', 'guard', 'student', 'worker', 'admin');
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
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Add expires_at and start_time columns if missing on existing tables
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campus_notices' AND column_name='expires_at') THEN
                    ALTER TABLE campus_notices ADD COLUMN expires_at TIMESTAMP;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campus_notices' AND column_name='start_time') THEN
                    ALTER TABLE campus_notices ADD COLUMN start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
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
            -- Add batch column to users if missing
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='batch') THEN
                    ALTER TABLE users ADD COLUMN batch VARCHAR(50);
                END IF;
            END $$;

            CREATE TABLE IF NOT EXISTS student_doubts (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                student_name VARCHAR(100),
                subject VARCHAR(100),
                question TEXT NOT NULL,
                reply TEXT,
                status VARCHAR(20) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS stakeholder_tasks (
                id SERIAL PRIMARY KEY,
                assignee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                assignee_role VARCHAR(50),
                title VARCHAR(200),
                description TEXT,
                status VARCHAR(20) DEFAULT 'Pending',
                priority VARCHAR(20) DEFAULT 'Normal',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS study_materials (
                id SERIAL PRIMARY KEY,
                faculty_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                faculty_name VARCHAR(100),
                subject VARCHAR(100),
                original_name VARCHAR(255),
                stored_name VARCHAR(255),
                file_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS student_attendance (
                id SERIAL PRIMARY KEY,
                schedule_id INTEGER,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                student_name VARCHAR(100),
                subject VARCHAR(100),
                batch VARCHAR(50),
                date DATE DEFAULT CURRENT_DATE,
                status VARCHAR(20) DEFAULT 'Absent',
                marked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS faculty_tests (
                id SERIAL PRIMARY KEY,
                faculty_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                subject VARCHAR(100) NOT NULL,
                description TEXT,
                file_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Database schema ensured (Users, Subjects, Schedules, Notices, Issues, Blueprints).');
    } catch (err) {
        console.error('Error creating database tables', err);
    }
};

module.exports = {
    createUserTable
};
