require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createUserTable } = require('../models/User');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));

// Initialize PostgreSQL Table
createUserTable();

// Routes
app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/admin', require('../routes/adminRoutes'));

// Basic frontend routers mapping
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.get('/auth', (req, res) => res.sendFile(path.join(__dirname, '..', 'auth.html')));
app.get('/admin-dashboard', (req, res) => res.sendFile(path.join(__dirname, '..', 'admin-dashboard.html')));
app.get('/student-dashboard', (req, res) => res.sendFile(path.join(__dirname, '..', 'student-dashboard.html')));
app.get('/faculty-dashboard', (req, res) => res.sendFile(path.join(__dirname, '..', 'faculty-dashboard.html')));
app.get('/worker-dashboard', (req, res) => res.sendFile(path.join(__dirname, '..', 'worker-dashboard.html')));
app.get('/guard-dashboard', (req, res) => res.sendFile(path.join(__dirname, '..', 'guard-dashboard.html')));

// Export for Vercel Serverless
module.exports = app;
