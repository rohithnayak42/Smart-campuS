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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

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
                map_url VARCHAR(255) NOT NULL,
                published_by VARCHAR(100),
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
