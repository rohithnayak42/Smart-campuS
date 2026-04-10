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
if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); }

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E6);
        const ext = path.extname(file.originalname);
        cb(null, `blueprint-${unique}${ext}`);
    }
});
const fileFilter = (req, file, cb) => {
    const allowed = [
        'application/pdf',
        'image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp',
        'image/gif'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not supported. Use PDF, JPG, PNG, SVG, or WebP.'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

// Users
router.post('/users', adminMiddleware, addUser);
router.get('/users', adminMiddleware, getUsers);
router.delete('/users/:id', adminMiddleware, deleteUser);
router.put('/users/:id', adminMiddleware, updateUser);
router.post('/users/:id/reset-password', adminMiddleware, resetPassword);

// Stats & Issues
router.get('/stats', adminMiddleware, getStats);
router.get('/issues', adminMiddleware, getIssues);
router.patch('/issues/:id', adminMiddleware, updateIssueStatus);

// Subjects
router.post('/subjects', adminMiddleware, addSubject);
router.get('/subjects', adminMiddleware, getSubjects);
router.put('/subjects/:id', adminMiddleware, updateSubject);
router.delete('/subjects/:id', adminMiddleware, deleteSubject);

// Schedules
router.post('/schedules', adminMiddleware, addSchedule);
router.get('/schedules', adminMiddleware, getSchedules);
router.delete('/schedules/:id', adminMiddleware, deleteSchedule);

// Notices
router.post('/notices', adminMiddleware, addNotice);
router.get('/notices', adminMiddleware, getNotices);
router.delete('/notices/:id', adminMiddleware, deleteNotice);

// Blueprints
router.post('/blueprints', adminMiddleware, upload.single('file'), (req, res, next) => {
    // Handle multer errors gracefully
    uploadBlueprint(req, res, next);
});
router.get('/blueprints', adminMiddleware, getBlueprints);
router.delete('/blueprints/:id', adminMiddleware, deleteBlueprint);

// Error handler for multer
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 25MB.' });
        }
        return res.status(400).json({ message: err.message });
    }
    if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
});

module.exports = router;
