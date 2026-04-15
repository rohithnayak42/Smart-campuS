const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/stakeholderController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'materials');
try { if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); } } catch (e) { console.warn("Uploads folder creation skipped (Vercel)"); }

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E6);
        cb(null, `material-${unique}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// All stakeholder routes are protected by authMiddleware
router.use(authMiddleware);

// Profile & Common Data
router.get('/profile', getProfile);
router.get('/subjects', getSharedSubjects);

// Student
router.get('/student/timetable', getStudentTimetable);
router.get('/student/attendance', getMyAttendance);
router.post('/student/doubts', submitDoubt);
router.get('/student/doubts', getStudentDoubts);

// Faculty
router.get('/faculty/schedule', getFacultySchedule);
router.post('/faculty/attendance', markAttendance); // keeps the existing schedule attendance
router.post('/faculty/student-attendance', markStudentAttendance);
router.post('/faculty/tests', upload.single('file'), conductTest);
router.post('/faculty/notices', postFacultyNotice);
router.get('/faculty/doubts', getFacultyDoubts);
router.patch('/faculty/doubts/:id', replyToDoubt);

// Common Queries / Lists
router.get('/students', getStudentsByBatch);

// Guards & Workers (Tasks)
router.get('/tasks', getMyTasks);
router.patch('/tasks/:id', updateTaskStatus);
router.patch('/guard/status', updateMyStatus);

// Common
router.get('/notices', getMyNotices);
router.post('/issues', reportIssue);
router.get('/issues', getMyIssues);
router.post('/materials', upload.single('file'), uploadMaterial);
router.get('/materials', getMaterials);
router.get('/blueprints', getSharedBlueprints);

module.exports = router;
