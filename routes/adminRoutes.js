const express = require('express');
const router = express.Router();
const { 
    addUser, getUsers, deleteUser, updateUser, getStats, getIssues, updateIssueStatus, 
    addSubject, getSubjects, updateSubject, deleteSubject, addSchedule, getSchedules, addNotice, getNotices, resetPassword 
} = require('../controllers/adminController');
const { adminMiddleware } = require('../middlewares/authMiddleware');

router.post('/users', adminMiddleware, addUser);
router.get('/users', adminMiddleware, getUsers);
router.delete('/users/:id', adminMiddleware, deleteUser);
router.put('/users/:id', adminMiddleware, updateUser);
router.post('/users/:id/reset-password', adminMiddleware, resetPassword);

router.get('/stats', adminMiddleware, getStats);
router.get('/issues', adminMiddleware, getIssues);
router.patch('/issues/:id', adminMiddleware, updateIssueStatus);

router.post('/subjects', adminMiddleware, addSubject);
router.get('/subjects', adminMiddleware, getSubjects);
router.put('/subjects/:id', adminMiddleware, updateSubject);
router.delete('/subjects/:id', adminMiddleware, deleteSubject);

router.post('/schedules', adminMiddleware, addSchedule);
router.get('/schedules', adminMiddleware, getSchedules);

router.post('/notices', adminMiddleware, addNotice);
router.get('/notices', adminMiddleware, getNotices);

module.exports = router;
