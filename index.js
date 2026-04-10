require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createUserTable } = require('./models/User');
const { adminMiddleware } = require('./middlewares/authMiddleware');
const { addUser, getUsers, getSubjects, getSchedules, getNotices, getIssues } = require('./controllers/adminController');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Support for Dashboard SPA tabs
const dashboardTabs = ['admin-dashboard', 'users', 'subjects', 'timetable', 'notices', 'blueprint', 'issues'];

// Staff SPA routes
const staffTabs = ['staff', 'staff/attendance', 'staff/materials', 'staff/doubts', 'staff/admin-queries', 'staff/tests', 'staff/notices'];

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Init
createUserTable();

// API Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const stakeholderRoutes = require('./routes/stakeholderRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stakeholder', stakeholderRoutes);

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
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Specific HTML Page Routing
app.use('/staff', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/staff-dashboard.html'));
});

app.use('/student', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/student-dashboard.html'));
});

app.use('/worker', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/worker-dashboard.html'));
});

app.use('/guard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/guard-dashboard.html'));
});


app.get('/:page', (req, res) => {
    const page = req.params.page;
    
    // Redirect dashboard tabs to the main admin-dashboard or staff-dashboard container
    if (page === 'staff' || staffTabs.includes(page)) {
        return res.sendFile(path.join(__dirname, 'public/staff-dashboard.html'));
    }
    if (dashboardTabs.includes(page)) {
        return res.sendFile(path.join(__dirname, 'public/admin-dashboard.html'));
    }

    // Try serving specific HTML files
    const filePath = path.join(__dirname, 'public', `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            // If not found, fall back to index.html
            res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
        }
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
