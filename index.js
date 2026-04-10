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

// Handle standard dashboard routes (SPA entry point)
const dashboardRoutes = ['admin-dashboard', 'users', 'subjects', 'timetable', 'notices', 'blueprint', 'issues'];

app.get('/:page', (req, res, next) => {
    const page = req.params.page;
    if (page.startsWith('api')) return next();
    
    if (dashboardRoutes.includes(page)) {
        console.log(`[Router] Serving React Dashboard SPA for: /${page}`);
        return res.sendFile(path.join(__dirname, 'react-dist', 'index.html'), (err) => {
            if (err) {
                console.error(`[Router Error] Failed to send React build for /${page}:`, err.message);
                res.status(500).send("Dashboard SPA load failure. Please contact administrator.");
            }
        });
    }
    next();
});

// Serve static files from the 'public' and 'react-dist' (React SPA) directories
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'react-dist')));

// Initialize PostgreSQL Table
createUserTable();

// Auto-login route for Admin (quick access - no OTP needed)
const jwt = require('jsonwebtoken');
app.get('/auto-login', (req, res) => {
    const token = jwt.sign({ id: 1, role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.send(`
        <html><body>
        <script>
            localStorage.setItem('sc_token', '${token}');
            localStorage.setItem('sc_role', 'Admin');
            localStorage.setItem('role', 'Admin');
            window.location.href = '/admin-dashboard';
        </script>
        <p>Logging in as Admin... Redirecting to dashboard.</p>
        </body></html>
    `);
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Requested dynamic stat routes
app.get('/api/users', adminMiddleware, getUsers);
app.post('/api/users', adminMiddleware, addUser);
app.get('/api/subjects', adminMiddleware, getSubjects);
app.get('/api/timetable', adminMiddleware, getSchedules);
app.get('/api/notices', adminMiddleware, getNotices);
app.get('/api/issues', adminMiddleware, getIssues);


// Root route - Serve the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Generic fall-through route handler
app.get('/:page', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, 'public', `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`[Router Error] Resource not found: ${filePath}`);
            res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
        }
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Routes enabled: ${dashboardRoutes.join(', ')}`);
});

module.exports = app;
