const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
        addUser, getUsers, deleteUser, updateUser, getStats, getIssues, updateIssueStatus,
        addSubject, getSubjects, updateSubject, deleteSubject, addSchedule, getSchedules, updateSchedule, deleteSchedule,
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
// User Management
router.get('/users', adminMiddleware, getUsers);
router.post('/users', adminMiddleware, addUser);
router.put('/users/:id', adminMiddleware, updateUser);
router.delete('/users/:id', adminMiddleware, deleteUser);

// Stats & Dashboard
router.get('/stats', adminMiddleware, getStats);
router.get('/issues', adminMiddleware, getIssues);
router.patch('/issues/:id', adminMiddleware, updateIssueStatus); // Changed to PATCH for status update

// Academic Portfolio (Subjects)
router.get('/subjects', adminMiddleware, getSubjects);
router.post('/subjects', adminMiddleware, addSubject);
router.put('/subjects/:id', adminMiddleware, updateSubject);
router.delete('/subjects/:id', adminMiddleware, deleteSubject);

// Class Schedule
router.get('/schedules', adminMiddleware, getSchedules);
router.post('/schedules', adminMiddleware, addSchedule);
router.put('/schedules/:id', adminMiddleware, updateSchedule);
router.delete('/schedules/:id', adminMiddleware, deleteSchedule);


// Campus Notices
router.get('/notices', adminMiddleware, getNotices);
router.get('/notices/live', adminMiddleware, getNotices); // Shortcut for live ones (logic in controller)
router.post('/notices', adminMiddleware, addNotice);
router.delete('/notices/:id', adminMiddleware, deleteNotice);

// Miscellaneous
router.post('/reset-password', adminMiddleware, resetPassword);
router.post('/upload-blueprint', adminMiddleware, upload.single('file'), uploadBlueprint); // Changed 'blueprint' to 'file' for simplicity
router.get('/blueprints', adminMiddleware, getBlueprints);
router.delete('/blueprints/:id', adminMiddleware, deleteBlueprint);

module.exports = router;



