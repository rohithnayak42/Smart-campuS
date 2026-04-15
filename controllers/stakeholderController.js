const db = require('../config/db');

// Generic Profile
const getProfile = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT name, email, role, batch FROM users WHERE id = $1', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Subjects for Dropdowns
const getSharedSubjects = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM subjects ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Student Timetable
const getStudentTimetable = async (req, res) => {
    try {
        // First get student's batch
        const userRes = await db.query('SELECT batch FROM users WHERE id = $1', [req.user.id]);
        const batch = userRes.rows[0]?.batch;
        
        if (!batch) return res.json([]); // No batch assigned

        const { rows } = await db.query(
            'SELECT * FROM timetable_schedules WHERE batch = $1 ORDER BY day, time_slot',
            [batch]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Faculty Schedule
const getFacultySchedule = async (req, res) => {
    try {
        const userRes = await db.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const name = userRes.rows[0]?.name;

        const { rows } = await db.query(
            'SELECT * FROM timetable_schedules WHERE faculty_name = $1 ORDER BY day, time_slot',
            [name]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const markAttendance = async (req, res) => {
    try {
        const { schedule_id, subject, batch } = req.body;
        // Ensure table exists
        await db.query(`CREATE TABLE IF NOT EXISTS faculty_attendance (
            id SERIAL PRIMARY KEY,
            faculty_id INTEGER,
            schedule_id INTEGER,
            subject VARCHAR(255),
            batch VARCHAR(50),
            marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
        
        await db.query(
            'INSERT INTO faculty_attendance (faculty_id, schedule_id, subject, batch) VALUES ($1, $2, $3, $4)',
            [req.user.id, schedule_id, subject, batch]
        );
        res.json({ success: true, message: 'Attendance recorded' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error marking attendance' });
    }
};

// Common Notices
const getMyNotices = async (req, res) => {
    try {
        const userRole = req.user.role.toLowerCase();
        
        // Map message AS content and target_roles AS audience
        const { rows } = await db.query(
            `SELECT id, title, message AS content, target_roles AS audience, start_time, expires_at, created_at FROM campus_notices 
             WHERE (target_roles ILIKE 'everyone' OR target_roles ILIKE $1)
             AND (start_time <= NOW() AND (expires_at IS NULL OR expires_at > NOW()))
             ORDER BY created_at DESC`,
            [`%${userRole}%`]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching stakeholder notices:', error);
        res.status(500).json({ error: 'Server error fetching notices' });
    }
};

const postFacultyNotice = async (req, res) => {
    try {
        const { title, message, duration_hours } = req.body;
        const expiresAt = duration_hours 
            ? new Date(Date.now() + duration_hours * 60 * 60 * 1000)
            : null;

        const { rows } = await db.query(
            'INSERT INTO campus_notices (title, message, target_roles, duration_hours, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, message, 'Students', duration_hours || 0, expiresAt]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Doubts (Student asks, Faculty replies)
const submitDoubt = async (req, res) => {
    try {
        const { subject, question } = req.body;
        const userRes = await db.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const studentName = userRes.rows[0]?.name;

        const { rows } = await db.query(
            'INSERT INTO student_doubts (student_id, student_name, subject, question) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.user.id, studentName, subject, question]
        );
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getStudentDoubts = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM student_doubts WHERE student_id = $1 ORDER BY created_at DESC', [req.user.id]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getFacultyDoubts = async (req, res) => {
    try {
        // Faculty sees doubts for their assigned subjects
        const facultyRes = await db.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const facultyName = facultyRes.rows[0]?.name;

        // Get subjects assigned to this faculty
        const subRes = await db.query('SELECT name FROM subjects WHERE assigned_faculty = $1', [facultyName]);
        const subjects = subRes.rows.map(s => s.name);

        if (subjects.length === 0) return res.json([]);

        const { rows } = await db.query(
            'SELECT * FROM student_doubts WHERE subject = ANY($1) ORDER BY created_at DESC',
            [subjects]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const replyToDoubt = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;
        const { rows } = await db.query(
            'UPDATE student_doubts SET reply = $1, status = $2 WHERE id = $3 RETURNING *',
            [reply, 'Resolved', id]
        );
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Tasks & Duties (Guard/Worker)
const getMyTasks = async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM stakeholder_tasks WHERE assignee_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const { rows } = await db.query(
            'UPDATE stakeholder_tasks SET status = $1 WHERE id = $2 AND assignee_id = $3 RETURNING *',
            [status, id, req.user.id]
        );
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Issues Reporting
const reportIssue = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userRes = await db.query('SELECT name, role FROM users WHERE id = $1', [req.user.id]);
        const { name, role } = userRes.rows[0];

        const { rows } = await db.query(
            'INSERT INTO campus_issues (title, description, reporter_name, reporter_role) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description, name, role]
        );
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getMyIssues = async (req, res) => {
    try {
        const userRes = await db.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const name = userRes.rows[0]?.name;
        const { rows } = await db.query('SELECT * FROM campus_issues WHERE reporter_name = $1 ORDER BY created_at DESC', [name]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const uploadMaterial = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const { subject } = req.body;
        const { originalname, filename, mimetype } = req.file;
        
        const userRes = await db.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        const facultyName = userRes.rows[0]?.name;

        const { rows } = await db.query(
            'INSERT INTO study_materials (faculty_id, faculty_name, subject, original_name, stored_name, file_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.id, facultyName, subject, originalname, filename, mimetype]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getMaterials = async (req, res) => {
    try {
        const { subject } = req.query;
        let query = 'SELECT * FROM study_materials';
        let params = [];
        if (subject) {
            query += ' WHERE subject = $1';
            params.push(subject);
        }
        query += ' ORDER BY created_at DESC';
        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getStudentsByBatch = async (req, res) => {
    try {
        const { batch } = req.query;
        let query = "SELECT id, name, email as login_email, real_email, batch FROM users WHERE role = 'student'";
        const params = [];
        if (batch) {
            query += " AND batch = $1";
            params.push(batch);
        }
        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching students' });
    }
};

const markStudentAttendance = async (req, res) => {
    try {
        const { schedule_id, subject, batch, attendanceData } = req.body;
        // attendanceData is an array of { student_id, student_name, status }
        
        for (const record of attendanceData) {
            await db.query(
                `INSERT INTO student_attendance (schedule_id, student_id, student_name, subject, batch, status, marked_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [schedule_id, record.student_id, record.student_name, subject, batch, record.status, req.user.id]
            );
        }
        res.json({ success: true, message: 'Student attendance recorded' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error marking student attendance' });
    }
};

const conductTest = async (req, res) => {
    try {
        const { title, subject, description } = req.body;
        const fileUrl = req.file ? `/uploads/materials/${req.file.filename}` : null;

        const { rows } = await db.query(
            'INSERT INTO faculty_tests (faculty_id, title, subject, description, file_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, title, subject, description, fileUrl]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error creating test' });
    }
};


const getMyAttendance = async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT subject, status, date FROM student_attendance WHERE student_id = $1 ORDER BY date DESC, created_at DESC', 
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error fetching attendance' });
    }
};

const getSharedBlueprints = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM campus_blueprints ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateMyStatus = async (req, res) => {
    try {
        const { status } = req.body;
        await db.query('UPDATE users SET current_status = $1 WHERE id = $2', [status, req.user.id]);
        res.json({ message: 'Status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error updating status' });
    }
};

module.exports = {
    getProfile,
    getSharedSubjects,
    getStudentTimetable,
    getFacultySchedule,
    markAttendance,
    getMyNotices,
    postFacultyNotice,
    submitDoubt,
    getStudentDoubts,
    getFacultyDoubts,
    replyToDoubt,
    getMyTasks,
    updateTaskStatus,
    reportIssue,
    getMyIssues,
    uploadMaterial,
    getMaterials,
    getStudentsByBatch,
    markStudentAttendance,
    conductTest,
    getMyAttendance,
    getSharedBlueprints,
    updateMyStatus
};
