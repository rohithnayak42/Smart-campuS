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

    -- Ensure real_email exists for existing tables
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='real_email') THEN
            ALTER TABLE users ADD COLUMN real_email VARCHAR(100);
        END IF;
    END $$;
    `;
    
    try {
        await db.query(query);
        console.log('Users table ensured successfully with real_email.');
    } catch (err) {
        console.error('Error creating users table', err);
    }
};

module.exports = {
    createUserTable
};
