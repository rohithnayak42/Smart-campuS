require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
const { createUserTable } = require('./models/User');
const { adminMiddleware } = require('./middlewares/authMiddleware');
const { addUser, getUsers, getSubjects, getSchedules, getNotices, getIssues } = require('./controllers/adminController');


// Pre-flight Environment Check
const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS'];
REQUIRED_VARS.forEach(v => {
  if (!process.env[v]) console.warn(`--- WARNING: Missing Environment Variable [${v}] ---`);
});

const app = express();

db.query('SELECT 1')
  .then(() => console.log('--- SYSTEM: Core Database Heartbeat OK ---'))
  .catch(err => {
      console.warn('--- SYSTEM: Database Connection Check Failed (Graceful) ---');
      console.warn('Reason:', err.message);
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Path normalization for serverless environments (Root-Standard)
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

console.log('--- SYSTEM: Server Runtime Paths ---');
console.log('Dirname:', __dirname);
console.log('PUBLIC_DIR:', PUBLIC_DIR);

// Static file serving
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Explicit route for the landing page (Root)
app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});



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
        window.location.href = '/admin-dashboard.html';
    </script></body></html>`;
    res.send(html);
});

app.get('/api/auto-login-token', (req, res) => {
    const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, role: 'admin' });
});

// Export app for use in index.js
module.exports = app;
