require('dotenv').config();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

async function testApi() {
    try {
        console.log('--- Testing Stakeholder API Logic ---');
        
        // 1. Get Student User
        const student = (await db.query("SELECT id, role, batch FROM users WHERE email = 'student@test.com'")).rows[0];
        console.log('Testing as Student:', student.id);
        
        const token = jwt.sign({ id: student.id, role: student.role }, process.env.JWT_SECRET);
        
        // 2. Mock Request objects for Controller tests
        const { getStudentTimetable, getStudentDoubts } = require('../controllers/stakeholderController');
        
        const req = { user: { id: student.id, role: student.role } };
        const res = { json: (data) => console.log('Response:', JSON.stringify(data, null, 2)), status: (s) => ({ json: (d) => console.log(`Status ${s}:`, d) }) };
        
        console.log('\n>> Fetching Student Timetable:');
        await getStudentTimetable(req, res);
        
        console.log('\n>> Fetching Student Doubts:');
        await getStudentDoubts(req, res);
        
        // 3. Test Faculty
        const faculty = (await db.query("SELECT id, role, name FROM users WHERE email = 'faculty@test.com'")).rows[0];
        console.log('\nTesting as Faculty:', faculty.name);
        const freq = { user: { id: faculty.id, role: faculty.role } };
        const { getFacultySchedule, getFacultyDoubts } = require('../controllers/stakeholderController');
        
        console.log('\n>> Fetching Faculty Schedule:');
        await getFacultySchedule(freq, res);
        
        console.log('\n>> Fetching Faculty Doubts:');
        await getFacultyDoubts(freq, res);

        console.log('\n--- API Logic Test Completed ---');
        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testApi();
