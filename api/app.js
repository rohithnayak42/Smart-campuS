require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const { createUserTable } = require('./models/User');
const { adminMiddleware } = require('./middlewares/authMiddleware');
const { addUser, getUsers, getSubjects, getSchedules, getNotices, getIssues } = require('./controllers/adminController');


// Diagnostic Heartbeat for Deployment Verification
console.log('--- SYSTEM: App Initialization Started ---');
db.query('SELECT 1')
  .then(() => console.log('--- SYSTEM: Core Database Heartbeat OK ---'))
  .catch(err => console.error('--- SYSTEM: Database Connection Check Failed ---', err.message));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Path normalization for serverless environments (Root-relative)
const PUBLIC_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

// Support for Dashboard SPA tabs
const dashboardTabs = ['admin-dashboard', 'users', 'subjects', 'timetable', 'notices', 'blueprint', 'issues'];

// Staff SPA routes
const staffTabs = ['staff', 'staff/attendance', 'staff/materials', 'staff/doubts', 'staff/admin-queries', 'staff/tests', 'staff/notices'];

// Static file serving
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// DB Init - DEFERRED to /api/health for zero-blocking startup
// createUserTable();

// API Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const stakeholderRoutes = require('./routes/stakeholderRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stakeholder', stakeholderRoutes);

// Health check for Vercel diagnostic
app.get('/api/health', async (req, res) => {
    try {
        // Trigger lazy initialization only on demand
        await createUserTable();
        
        const { rows } = await db.query('SELECT NOW()');
        res.json({
            status: 'UP',
            message: 'Database schema ensured and connection active.',
            environment: process.env.NODE_ENV || 'production',
            database: 'CONNECTED',
            timestamp: rows[0].now
        });
    } catch (err) {
        console.error('Health Check Failure:', err.message);
        res.status(500).json({
            status: 'ERROR',
            database: 'INIT_FAILURE',
            error: err.message
        });
    }
});

// Quick Auto-Login Routes
const jwt = require('jsonwebtoken');
app.get('/auto-login', (req, res) => {
    const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const html = `<!DOCTYPE html><html><body><script>
        localStorage.setItem('sc_token', '${token}');
        localStorage.setItem('sc_role', 'Admin');
        localStorage.setItem('role', 'Admin');
        window.location.href = '/admin-dashboard';
    </script></body></html>`;
    res.send(html);
});

app.get('/api/auto-login-token', (req, res) => {
    const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: 'admin' });
});

// Main Route - Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Specific HTML Page Routing
app.use('/staff', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'staff-dashboard.html'));
});

app.use('/student', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'student-dashboard.html'));
});

app.use('/worker', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'worker-dashboard.html'));
});

app.use('/guard', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'guard-dashboard.html'));
});


app.get('/:page', (req, res) => {
    const page = req.params.page;
    
    // Redirect dashboard tabs to the main admin-dashboard or staff-dashboard container
    if (page === 'staff' || (typeof staffTabs !== 'undefined' && staffTabs.includes(page))) {
        return res.sendFile(path.join(PUBLIC_DIR, 'staff-dashboard.html'));
    }
    if (typeof dashboardTabs !== 'undefined' && dashboardTabs.includes(page)) {
        return res.sendFile(path.join(PUBLIC_DIR, 'admin-dashboard.html'));
    }

    // Try serving specific HTML files
    const filePath = path.join(PUBLIC_DIR, `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            // If not found, fall back to index.html
            res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
        }
    });
});


// Export app for use in index.js and api/index.js
module.exports = app;
