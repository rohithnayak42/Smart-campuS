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

        const VALID_ROLES = ['admin', 'staff', 'student', 'worker', 'guard'];
        let normalizedRole = role.toLowerCase().trim();
        
        // Normalize common alias
        if (normalizedRole === 'faculty') normalizedRole = 'staff';

        if (!VALID_ROLES.includes(normalizedRole)) {
            return res.status(400).json({ message: `Invalid role: ${role}. Must be one of ${VALID_ROLES.join(', ')}` });
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
            [name, effectiveLoginEmail, effectiveRealEmail, hashedPassword, password, normalizedRole]
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
                <p style="color: #4B5563; line-height: 1.5;">Please use these credentials to log in. You will be required to change your password upon your first login for security purposes.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${req.protocol}://${req.get('host')}/auth" style="background: #1F2937; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Login to Portal</a>
                </div>
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
        
        console.log(`[DEBUG] Received UPDATE request for User ID: ${id}`);
        console.log(`[DEBUG] Incoming Data:`, { name, loginEmail, realEmail, role });

        // Fetch current user details for absolute comparison
        const { rows: currentUserRes } = await db.query('SELECT name, email, role, real_email FROM users WHERE id = $1', [id]);
        if (currentUserRes.length === 0) {
            console.error(`[DEBUG] Update aborted: User ${id} not found.`);
            return res.status(404).json({ message: 'User not found' });
        }
        const oldUser = currentUserRes[0];

        // Normalization Helper
        const norm = (val) => (val || '').toString().toLowerCase().trim();

        // Standardize Roles
        const VALID_ROLES = ['admin', 'staff', 'student', 'worker', 'guard'];
        let normalizedRole = role ? role.toLowerCase().trim() : oldUser.role;
        if (normalizedRole === 'faculty') normalizedRole = 'staff';

        if (!VALID_ROLES.includes(normalizedRole)) {
            console.error(`[DEBUG] Invalid role '${role}' rejected.`);
            return res.status(400).json({ message: `Invalid role: ${role}` });
        }

        // Email Conflict Check
        if (loginEmail && norm(loginEmail) !== norm(oldUser.email)) {
            const { rows: existingUser } = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [loginEmail, id]);
            if (existingUser.length > 0) {
                return res.status(400).json({ message: 'Login Email already in use by another user' });
            }
        }

        const finalName = name || oldUser.name;
        const finalLoginEmail = loginEmail || oldUser.email;
        const finalRealEmail = realEmail || oldUser.real_email;

        // DB Update
        await db.query(
            'UPDATE users SET name = $1, email = $2, real_email = $3, role = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
            [finalName, finalLoginEmail, finalRealEmail, normalizedRole, id]
        );
        console.log(`[DEBUG] DB Update Success for ${id}`);

        // CHANGE DETECTION (Normalized)
        const nameChanged = norm(finalName) !== norm(oldUser.name);
        const roleChanged = norm(normalizedRole) !== norm(oldUser.role);
        const emailChanged = norm(finalLoginEmail) !== norm(oldUser.email);
        const realEmailChanged = norm(finalRealEmail) !== norm(oldUser.real_email);

        console.log(`[DEBUG] Comparison Results:`, { nameChanged, roleChanged, emailChanged, realEmailChanged });

        if (nameChanged || roleChanged || emailChanged || realEmailChanged) {
            console.log(`[DEBUG] Change detected. Preparing email to: ${finalRealEmail}`);
            
            const emailSubject = 'Account Updated';
            const emailBody = `Hello ${finalName},\n\nYour account details have been updated by the Admin.\n\nUpdated Information:\n\nName: ${finalName}\nRole: ${normalizedRole}\nEmail: ${finalLoginEmail}\n\nIf your role has changed, your dashboard access will also change accordingly.\n\nPlease login again to access your updated portal.\n\nIf you did not expect this change, contact Admin immediately.\n\nRegards,\nSmart Campus Team`;
            const emailHtml = `
                <div style="font-family: 'Inter', system-ui, Arial, sans-serif; max-width: 600px; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px; color: #1f2937;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="font-size: 24px; font-weight: 800; color: #C5A880; margin: 0;">Smart Campus</h1>
                        <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Secure Identity Update</p>
                    </div>

                    <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${finalName}</strong>,</p>
                    <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">Your professional account profile has been updated by the administrator. Please review the modified credentials below.</p>
                    
                    <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0;">
                        <div style="margin-bottom: 15px;">
                            <label style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">New Name</label>
                            <p style="margin: 4px 0 0; font-weight: 600;">${finalName}</p>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <label style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Assigned Role</label>
                            <p style="margin: 4px 0 0; font-weight: 600; text-transform: capitalize;">${normalizedRole}</p>
                        </div>
                        <div>
                            <label style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">System Login Email</label>
                            <p style="margin: 4px 0 0; font-weight: 600;">${finalLoginEmail}</p>
                        </div>
                    </div>

                    <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 30px;">
                        <p style="margin: 0; color: #92400e; font-size: 13px; font-weight: 500;">Role permission changes are effective immediately. Please re-authenticate your session to access your new portal features.</p>
                    </div>

                    <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you did not authorize this change, please alert the security team immediately.</p>
                    <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 13px; font-weight: 600;">
                        Smart Campus Support
                    </div>
                </div>
            `;

            try {
                await sendEmail(finalRealEmail, emailSubject, emailBody, emailHtml);
                console.log(`[DEBUG] Email Dispatch Successful to ${finalRealEmail}`);
            } catch (mailErr) {
                console.error(`[DEBUG] Fatal Mailer Error: ${mailErr.message}`);
            }
        } else {
            console.log(`[DEBUG] Skipping notification: No detectable changes found between old/new state.`);
        }

        res.json({ 
            message: 'User updated successfully', 
            details: { name: finalName, role: normalizedRole, email: finalLoginEmail }
        });

    } catch (error) {
        console.error('[DEBUG] CRITICAL EXCEPTION:', error);
        res.status(500).json({ error: 'Server error during user update' });
    }
};

const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = 'SELECT id, name, email as login_email, real_email, role, is_first_login, temp_password, current_status, created_at FROM users';
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
        const pendingIssueStats = await db.query('SELECT count(*) FROM campus_issues WHERE status = \'Pending\'');
        const resolvedIssueStats = await db.query('SELECT count(*) FROM campus_issues WHERE status = \'Resolved\'');
        const subjectStats = await db.query('SELECT count(*) FROM subjects');
        const noticeStats = await db.query('SELECT count(*) FROM campus_notices');
        const scheduleStats = await db.query('SELECT count(*) FROM timetable_schedules');
        
        const stats = {
            roles: userStats.rows,
            pendingIssues: pendingIssueStats.rows[0].count,
            resolvedIssues: resolvedIssueStats.rows[0].count,
            totalSubjects: subjectStats.rows[0].count,
            totalNotices: noticeStats.rows[0].count,
            totalSchedules: scheduleStats.rows[0].count,
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

        // Room clash validation
        if (effectiveRoom) {
            const { rows: existing } = await db.query(
                'SELECT id FROM timetable_schedules WHERE day = $1 AND time_slot = $2 AND room = $3',
                [effectiveDay, effectiveTimeSlot, effectiveRoom]
            );
            
            if (existing.length > 0) {
                return res.status(409).json({ message: `Room ${effectiveRoom} is already booked for ${effectiveDay} at ${effectiveTimeSlot}.` });
            }
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
        const { rows } = await db.query(`
            SELECT * FROM timetable_schedules 
            ORDER BY 
                CASE day 
                    WHEN 'Monday' THEN 1 
                    WHEN 'Tuesday' THEN 2 
                    WHEN 'Wednesday' THEN 3 
                    WHEN 'Thursday' THEN 4 
                    WHEN 'Friday' THEN 5 
                    WHEN 'Saturday' THEN 6 
                    WHEN 'Sunday' THEN 7 
                END, 
                time_slot ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ error: 'Server error while fetching timetable' });
    }
};
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { day, time_slot, subject_name, faculty_name, room, batch } = req.body;
        
        // Room clash validation when updating
        if (room) {
            const { rows: existing } = await db.query(
                'SELECT id FROM timetable_schedules WHERE day = $1 AND time_slot = $2 AND room = $3 AND id != $4',
                [day, time_slot, room, id]
            );
            
            if (existing.length > 0) {
                return res.status(409).json({ message: `Room ${room} is already booked for ${day} at ${time_slot}.` });
            }
        }

        await db.query(
            'UPDATE timetable_schedules SET day = $1, time_slot = $2, subject_name = $3, faculty_name = $4, room = $5, batch = $6 WHERE id = $7',
            [day, time_slot, subject_name, faculty_name, room, batch, id]
        );
        res.json({ message: 'Schedule updated successfully' });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ error: 'Server error while updating timetable' });
    }
};

// Notices
const addNotice = async (req, res) => {
    try {
        const { title, message, audience, start_time, expires_at, duration_hours } = req.body;
        
        // 1. Validate required fields
        if (!title || !message) {
            return res.status(400).json({ message: 'Notice Title and Message are required.' });
        }

        // 2. Audience Handling (robust normalization)
        let target_roles = 'Everyone';
        if (Array.isArray(audience) && audience.length > 0) {
            if (audience.includes('Everyone')) {
                target_roles = 'Everyone';
            } else {
                target_roles = audience.join(',');
            }
        } else if (typeof audience === 'string' && audience.trim() !== '') {
            target_roles = audience;
        }

        // 3. Time Logic
        let finalStartTime = start_time ? new Date(start_time) : new Date();
        let finalExpiresAt = expires_at ? new Date(expires_at) : null;

        // If duration is provided but no expiry, calculate it
        if (!finalExpiresAt && duration_hours && !isNaN(duration_hours)) {
            finalExpiresAt = new Date(finalStartTime.getTime() + (duration_hours * 60 * 60 * 1000));
        }

        const { rows } = await db.query(
            'INSERT INTO campus_notices (title, message, target_roles, start_time, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title.trim(), message.trim(), target_roles, finalStartTime, finalExpiresAt]
        );

        console.log(`[Notice] Published: "${title}" for ${target_roles}`);
        res.status(201).json({ 
            message: 'Notice published successfully', 
            notice: rows[0] 
        });
    } catch (error) {
        console.error('Error adding notice:', error);
        res.status(500).json({ message: 'Server error while publishing notice: ' + error.message });
    }
};

const getNotices = async (req, res) => {
    try {
        const { role, activeOnly } = req.query;
        // Map message AS content and target_roles AS audience for frontend compatibility
        let query = 'SELECT id, title, message AS content, target_roles AS audience, start_time, expires_at, created_at FROM campus_notices';
        let params = [];

        if (activeOnly === 'true') {
            query += ' WHERE (start_time <= NOW() AND (expires_at IS NULL OR expires_at > NOW()))';
            if (role && role !== 'admin') {
                query += ' AND (target_roles ILIKE \'everyone\' OR target_roles ILIKE $1)';
                params.push(`%${role}%`);
            }
        }

        query += ' ORDER BY created_at DESC';

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching notices' });
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
            return res.status(400).json({ message: 'No file uploaded. Please select a file.' });
        }

        // Ensure table exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS campus_blueprints (
                id SERIAL PRIMARY KEY,
                original_name VARCHAR(500) NOT NULL,
                stored_name VARCHAR(500) NOT NULL,
                file_type VARCHAR(200),
                file_size BIGINT,
                uploaded_by VARCHAR(100) DEFAULT 'Admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const { originalname, filename, mimetype, size } = req.file;
        const { rows } = await db.query(
            'INSERT INTO campus_blueprints (original_name, stored_name, file_type, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [originalname, filename, mimetype, size, 'Admin']
        );
        res.status(201).json({ message: 'Blueprint uploaded successfully', blueprint: rows[0] });
    } catch (error) {
        console.error('Error uploading blueprint:', error);
        res.status(500).json({ message: 'Server error while uploading blueprint: ' + error.message });
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

const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM timetable_schedules WHERE id = $1', [id]);
        res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error while deleting schedule' });
    }
};

module.exports = { 
    addUser, getUsers, deleteUser, updateUser, getStats, getIssues, updateIssueStatus, 
    addSubject, getSubjects, updateSubject, deleteSubject, addSchedule, getSchedules, updateSchedule, deleteSchedule,
    addNotice, getNotices, deleteNotice, resetPassword,
    uploadBlueprint, getBlueprints, deleteBlueprint
};
