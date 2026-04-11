require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    const name = 'Admin';
    const email = 'rohithazmeera3@gmail.com';
    const password = 'Rohith@2005';
    const role = 'Admin';

    try {
        const { rows } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (rows.length > 0) {
            console.log('Admin user already exists.');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO users (name, email, password, role, is_first_login) VALUES ($1, $2, $3, $4, false)',
            [name, email, hashedPassword, role]
        );

        console.log('Admin account created successfully!');
    } catch (err) {
        console.error('Error creating admin account:', err);
    } finally {
        process.exit();
    }
}

createAdmin();
