const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/mailer');

const addUser = async (req, res) => {
    try {
        const { name, campusEmail, loginEmail, personalEmail, realEmail, password, role } = req.body;
        
        // Aligning with frontend field names
        const effectiveLoginEmail = campusEmail || loginEmail;
        const effectiveRealEmail = personalEmail || realEmail;

        if (!effectiveLoginEmail || !effectiveRealEmail) {
            return res.status(400).json({ message: 'Missing required email fields' });
        }

        // Check if login email already exists
        const { rows: existingUser } = await db.query('SELECT id FROM users WHERE email = $1', [effectiveLoginEmail]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Login Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { rows: newUser } = await db.query(
            'INSERT INTO users (name, email, real_email, password, temp_password, role, is_first_login) VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *',
            [name, effectiveLoginEmail, effectiveRealEmail, hashedPassword, password, role]
        );

        const user = newUser[0];

        // Professional HTML Email Format
        const emailSubject = 'Your Smart Campus Login Credentials';
        const emailBody = `Hello ${name}, Welcome to Smart Campus. You have been added as ${role}. Your login details are: Email: ${effectiveLoginEmail}, Password: ${password}.`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                <h3 style="color: #1F2937;">Welcome to Smart Campus</h3>
                <p style="color: #4B5563;">Hello <strong>${name}</strong>,</p>
                <p style="color: #4B5563;">You have been successfully onboarded as <strong>${role}</strong>.</p>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #374151;"><strong>Login Email:</strong> ${effectiveLoginEmail}</p>
                    <p style="margin: 5px 0 0; color: #374151;"><strong>Default Password:</strong> ${password}</p>
                </div>
                <p style="color: #6B7280; font-size: 14px;">Please login and change your password immediately for security.</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9CA3AF;">Regards,<br>Smart Campus Administration Hub</p>
            </div>
        `;

        // Send response IMMEDIATELY (don't wait for email)
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

        // Send HTML email to real_email (personal address) IN BACKGROUND
        sendEmail(effectiveRealEmail, emailSubject, emailBody, emailHtml)
            .then(() => console.log(`✅ Credentials email sent to ${effectiveRealEmail}`))
            .catch(err => console.error(`❌ Failed to send email to ${effectiveRealEmail}:`, err.message));
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ error: 'Server error during user creation' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, loginEmail, realEmail, role } = req.body;
        
        // Ensure no other user has this login email
        const { rows: existingUser } = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [loginEmail, id]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Login Email already in use by another user' });
        }

        await db.query(
            'UPDATE users SET name = $1, email = $2, real_email = $3, role = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
            [name, loginEmail, realEmail, role, id]
        );

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Server error during user update' });
    }
};

const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = 'SELECT id, name, email as login_email, real_email, role, is_first_login, temp_password, created_at FROM users';
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

const getStats = async (req, res) => {
    try {
        const userStats = await db.query('SELECT role, count(*) FROM users GROUP BY role');
        const issueStats = await db.query('SELECT count(*) FROM campus_issues WHERE status = \'Pending\'');
        const subjectStats = await db.query('SELECT count(*) FROM subjects');
        const noticeStats = await db.query('SELECT count(*) FROM campus_notices');
        
        const stats = {
            roles: userStats.rows,
            pendingIssues: issueStats.rows[0].count,
            totalSubjects: subjectStats.rows[0].count,
            totalNotices: noticeStats.rows[0].count,
            totalUsers: userStats.rows.reduce((acc, curr) => acc + parseInt(curr.count), 0)
        };
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getIssues = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM campus_issues ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateIssueStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.query('UPDATE campus_issues SET status = $1 WHERE id = $2', [status, id]);
        res.json({ message: 'Issue status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Subjects CRUD
const addSubject = async (req, res) => {
    try {
        const { name, code, credits, faculty, assignedFaculty } = req.body;
        const effectiveFaculty = faculty || assignedFaculty || '';

        if (!name || !code || !credits) {
            return res.status(400).json({ message: 'Subject name, code, and credits are required.' });
        }

        const { rows } = await db.query(
            'INSERT INTO subjects (name, code, credits, assigned_faculty) VALUES ($1, $2, $3, $4) RETURNING *',
            [name.trim(), code.trim(), parseInt(credits, 10), effectiveFaculty.trim()]
        );
        const subj = rows[0];
        res.status(201).json({ message: 'Subject added successfully', subject: { ...subj, faculty: subj.assigned_faculty } });
    } catch (error) {
        console.error('Error adding subject:', error);
        if (error.code === '23505') {
            return res.status(400).json({ message: `Subject code '${req.body.code}' already exists.` });
        }
        res.status(500).json({ message: 'Server error while adding subject' });
    }
};

const getSubjects = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, name, code, credits, assigned_faculty AS faculty, created_at FROM subjects ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, credits, faculty, assignedFaculty } = req.body;
        const effectiveFaculty = faculty || assignedFaculty || '';
        await db.query(
            'UPDATE subjects SET name = $1, code = $2, credits = $3, assigned_faculty = $4 WHERE id = $5',
            [name, code, parseInt(credits, 10), effectiveFaculty, id]
        );
        res.json({ message: 'Subject updated successfully' });
    } catch (error) {
        console.error('Error updating subject:', error);
        if (error.code === '23505') {
            return res.status(400).json({ message: `Subject code '${req.body.code}' already exists.` });
        }
        res.status(500).json({ message: 'Server error while updating subject' });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM subjects WHERE id = $1', [id]);
        res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Timetable CRUD
const addSchedule = async (req, res) => {
    try {
        const { day, time_slot, timeSlot, subject_name, subjectName, faculty_name, facultyName, room, batch } = req.body;
        const effectiveDay = day;
        const effectiveTimeSlot = time_slot || timeSlot || '';
        const effectiveSubject = subject_name || subjectName || '';
        const effectiveFaculty = faculty_name || facultyName || '';
        const effectiveRoom = room || '';
        const effectiveBatch = batch || '';

        if (!effectiveDay || !effectiveTimeSlot || !effectiveSubject) {
            return res.status(400).json({ message: 'Day, time slot, and subject name are required.' });
        }

        const { rows } = await db.query(
            'INSERT INTO timetable_schedules (day, time_slot, subject_name, faculty_name, room, batch) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [effectiveDay, effectiveTimeSlot, effectiveSubject, effectiveFaculty, effectiveRoom, effectiveBatch]
        );
        res.status(201).json({ message: 'Schedule added successfully', schedule: rows[0] });
    } catch (error) {
        console.error('Error adding schedule:', error);
        res.status(500).json({ message: 'Server error while adding schedule' });
    }
};

const getSchedules = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM timetable_schedules ORDER BY day, time_slot ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Notices
const addNotice = async (req, res) => {
    try {
        const { title, message, target_roles, targetRoles, duration_hours } = req.body;
        const effectiveRoles = target_roles || targetRoles || 'Everyone';

        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required.' });
        }

        // Compute expires_at if duration_hours is provided
        let expiresAt = null;
        if (duration_hours && parseInt(duration_hours, 10) > 0) {
            const hours = parseInt(duration_hours, 10);
            expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        }

        const { rows } = await db.query(
            'INSERT INTO campus_notices (title, message, target_roles, expires_at) VALUES ($1, $2, $3, $4) RETURNING *',
            [title.trim(), message.trim(), effectiveRoles, expiresAt]
        );
        res.status(201).json({ message: 'Notice published successfully', notice: rows[0] });
    } catch (error) {
        console.error('Error adding notice:', error);
        res.status(500).json({ message: 'Server error while publishing notice' });
    }
};

const getNotices = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM campus_notices ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// User Control (Reset PW)
const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await db.query('UPDATE users SET password = $1, temp_password = $2, is_first_login = true WHERE id = $3', [hashedPassword, newPassword, id]);
        res.json({ message: 'Password reset and marked as first login' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM campus_notices WHERE id = $1', [id]);
        res.json({ message: 'Notice deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Blueprints
const path = require('path');
const fs = require('fs');

const uploadBlueprint = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const { originalname, filename, mimetype, size } = req.file;
        const { rows } = await db.query(
            'INSERT INTO campus_blueprints (original_name, stored_name, file_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [originalname, filename, mimetype, size, 'Admin']
        );
        res.status(201).json({ message: 'Blueprint uploaded successfully', blueprint: rows[0] });
    } catch (error) {
        console.error('Error uploading blueprint:', error);
        res.status(500).json({ message: 'Server error while uploading blueprint' });
    }
};

const getBlueprints = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM campus_blueprints ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteBlueprint = async (req, res) => {
    try {
        const { id } = req.params;
        // Get the stored filename to delete the file
        const { rows } = await db.query('SELECT stored_name FROM campus_blueprints WHERE id = $1', [id]);
        if (rows.length > 0) {
            const filePath = path.join(__dirname, '..', 'uploads', 'blueprints', rows[0].stored_name);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        await db.query('DELETE FROM campus_blueprints WHERE id = $1', [id]);
        res.json({ message: 'Blueprint deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { 
    addUser, getUsers, deleteUser, updateUser, getStats, getIssues, updateIssueStatus, 
    addSubject, getSubjects, updateSubject, deleteSubject, addSchedule, getSchedules, 
    addNotice, getNotices, deleteNotice, resetPassword,
    uploadBlueprint, getBlueprints, deleteBlueprint
};
