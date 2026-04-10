const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/mailer');

const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1 AND LOWER(role) = LOWER($2)', [email, role]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or role' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (user.is_first_login && user.role.toLowerCase() !== 'admin') {
            return res.json({ message: 'First login, change password required', step: 'CHANGE_PASSWORD', userId: user.id });
        }

        if (user.role.toLowerCase() === 'admin') {
            // OTP Generation ONLY for Admin
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 5 * 60000); // 5 mins
            
            await db.query('UPDATE users SET otp = $1, otp_expiry = $2 WHERE id = $3', [otp, otpExpiry, user.id]);

            await sendEmail(
                user.email,
                'Smart Campus - Admin Login OTP',
                `Your Admin login OTP is: ${otp}. It is valid for 5 minutes.`
            );

            return res.json({ message: 'OTP sent to your email', step: 'OTP' });
        }

        // For all other stakeholders (Staff, Student, Guard, Worker), login directly without OTP.
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ message: 'Login successful', token, role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp, role } = req.body;
        
        const { rows } = await db.query('SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]);
        const user = rows[0];

        if (!user || user.otp !== otp || new Date(user.otp_expiry) < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        await db.query('UPDATE users SET otp = NULL, otp_expiry = NULL WHERE id = $1', [user.id]);

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: 'Login successful', token, role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user = rows[0];

        if (!user) return res.status(404).json({ message: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        await db.query('UPDATE users SET password = $1, temp_password = NULL, is_first_login = false WHERE id = $2', [hashedPassword, userId]);

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: 'Password updated successfully', token, role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { login, verifyOtp, changePassword };
