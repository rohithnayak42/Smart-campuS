require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('--- Starting Verification Seeding ---');
        const salt = await bcrypt.genSalt(10);
        const pw = await bcrypt.hash('password123', salt);

        // 1. Seed Users
        const users = [
            { name: 'Student One', email: 'student@test.com', role: 'Student', batch: 'Batch A' },
            { name: 'Faculty One', email: 'faculty@test.com', role: 'Faculty', batch: null },
            { name: 'Guard One', email: 'guard@test.com', role: 'Guard', batch: null },
            { name: 'Worker One', email: 'worker@test.com', role: 'Worker', batch: null }
        ];

        for (const u of users) {
            await db.query(
                `INSERT INTO users (name, email, password, role, is_first_login, batch) 
                 VALUES ($1, $2, $3, $4, false, $5) 
                 ON CONFLICT (email) DO UPDATE SET batch = $5`,
                [u.name, u.email, pw, u.role, u.batch]
            );
            console.log(`User seeded/updated: ${u.email}`);
        }

        // 2. Seed Subject
        await db.query(
            `INSERT INTO subjects (name, code, credits, assigned_faculty) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (code) DO UPDATE SET assigned_faculty = $4`,
            ['Software Engineering', 'CS301', 4, 'Faculty One']
        );
        console.log('Subject seeded: CS301');

        // 3. Seed Schedule
        // First clear existing to avoid duplicates in test
        await db.query('DELETE FROM timetable_schedules WHERE batch = $1', ['Batch A']);
        await db.query(
            `INSERT INTO timetable_schedules (day, time_slot, subject_name, faculty_name, room, batch) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            ['Monday', '09:00 - 11:00', 'Software Engineering', 'Faculty One', 'Room 101', 'Batch A']
        );
        console.log('Schedule seeded for Batch A');

        // 4. Seed Task for Worker/Guard
        const worker = await db.query('SELECT id FROM users WHERE email = $1', ['worker@test.com']);
        if (worker.rows[0]) {
            await db.query(
                `INSERT INTO stakeholder_tasks (assignee_id, assignee_role, title, description, status, priority) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [worker.rows[0].id, 'Worker', 'Repair Canteen Lights', 'The lights in the main hall are flickering.', 'Pending', 'High']
            );
            console.log('Task seeded for Worker');
        }

        // 5. Seed Doubt
        const student = await db.query('SELECT id FROM users WHERE email = $1', ['student@test.com']);
        if (student.rows[0]) {
            await db.query(
                `INSERT INTO student_doubts (student_id, student_name, subject, question, status) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [student.rows[0].id, 'Student One', 'Software Engineering', 'What is the Waterfall model?', 'Pending']
            );
            console.log('Doubt seeded for Software Engineering');
        }

        console.log('--- Seeding Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
