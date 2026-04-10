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
    getMaterials
} = require('../controllers/stakeholderController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'materials');
if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); }

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
router.post('/student/doubts', submitDoubt);
router.get('/student/doubts', getStudentDoubts);

// Faculty
router.get('/faculty/schedule', getFacultySchedule);
router.post('/faculty/attendance', markAttendance);
router.post('/faculty/notices', postFacultyNotice);
router.get('/faculty/doubts', getFacultyDoubts);
router.patch('/faculty/doubts/:id', replyToDoubt);

// Guards & Workers (Tasks)
router.get('/tasks', getMyTasks);
router.patch('/tasks/:id', updateTaskStatus);

// Common
router.get('/notices', getMyNotices);
router.post('/issues', reportIssue);
router.get('/issues', getMyIssues);
router.post('/materials', upload.single('file'), uploadMaterial);
router.get('/materials', getMaterials);

module.exports = router;
