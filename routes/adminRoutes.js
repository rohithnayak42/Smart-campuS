const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
        addUser, getUsers, deleteUser, updateUser, getStats, getIssues, updateIssueStatus,
        addSubject, getSubjects, updateSubject, deleteSubject, addSchedule, getSchedules, deleteSchedule,
        addNotice, getNotices, deleteNotice, resetPassword,
        uploadBlueprint, getBlueprints, deleteBlueprint
} = require('../controllers/adminController');
const { adminMiddleware } = require('../middlewares/authMiddleware');

// Multer config for Blueprint uploads
const uploadsDir = path.join(__dirname, '..', 'uploads', 'blueprints');
try { if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); } } catch (e) { console.warn("Uploads folder creation skipped (Vercel)"); }

const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadsDir),
        filename: (req, file, cb) => {
                    const unique = Date.now() + '-' + Math.round(Math.random() * 1E6);
                    const ext = path.extname(file.originalname);
                    cb(null, `blueprint-${unique}${ext}`);
        }
});
const upload = multer({ storage });
// Admin routes
router.post('/add-user', adminMiddleware, addUser);
router.get('/users', adminMiddleware, getUsers);
router.delete('/delete-user/:id', adminMiddleware, deleteUser);
router.put('/update-user/:id', adminMiddleware, updateUser);
router.get('/stats', adminMiddleware, getStats);
router.get('/issues', adminMiddleware, getIssues);
router.put('/update-issue/:id', adminMiddleware, updateIssueStatus);
router.post('/add-subject', adminMiddleware, addSubject);
router.get('/subjects', adminMiddleware, getSubjects);
router.put('/update-subject/:id', adminMiddleware, updateSubject);
router.delete('/delete-subject/:id', adminMiddleware, deleteSubject);
router.post('/add-schedule', adminMiddleware, addSchedule);
router.get('/schedules', adminMiddleware, getSchedules);
router.delete('/delete-schedule/:id', adminMiddleware, deleteSchedule);
router.post('/add-notice', adminMiddleware, addNotice);
router.get('/notices', adminMiddleware, getNotices);
router.delete('/delete-notice/:id', adminMiddleware, deleteNotice);
router.post('/reset-password', adminMiddleware, resetPassword);
router.post('/upload-blueprint', adminMiddleware, upload.single('blueprint'), uploadBlueprint);
router.get('/blueprints', adminMiddleware, getBlueprints);
router.delete('/delete-blueprint/:id', adminMiddleware, deleteBlueprint);

module.exports = router;


