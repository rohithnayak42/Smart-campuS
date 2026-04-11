const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/mailer');

const addUser = async (req, res) => {
    try {
        const { name, loginEmail, realEmail, password, role } = req.body;
        
        // Check if login email already exists
        const { rows: existingUser } = await db.query('SELECT id FROM users WHERE email = $1', [loginEmail]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Login Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { rows: newUser } = await db.query(
            'INSERT INTO users (name, email, real_email, password, role, is_first_login) VALUES ($1, $2, $3, $4, $5, true) RETURNING *',
            [name, loginEmail, realEmail, hashedPassword, role]
        );

        const user = newUser[0];

        // Professional Email Format
        const emailSubject = 'Welcome to Smart Campus - Your Credentials';
        const emailBody = `Hello ${name},

Welcome to Smart Campus.

You have been added as ${role}.

Login Details:
Login Email: ${loginEmail}
Password: ${password}

Please login and change your password immediately.

Regards,  
Smart Campus`;

        // Send email to realEmail
        await sendEmail(realEmail, emailSubject, emailBody);

        res.status(201).json({ 
            message: 'User created and credentials sent to personal email', 
            user: { 
                id: user.id, 
                name: user.name, 
                loginEmail: user.email, 
                realEmail: user.real_email,
                role: user.role 
            } 
        });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Server error during user creation' });
    }
};

const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = 'SELECT id, name, email as login_email, real_email, role, is_first_login, created_at FROM users';
        let params = [];
        
        if (role && role !== 'All') {
            query += ' WHERE role = $1';
            params.push(role);
        }
        
        query += ' ORDER BY created_at DESC';

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { addUser, getUsers, deleteUser };
