// =====================================================
// routes/mentors.js — Mentors API
// =====================================================
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const MENTORS_FILE = path.join(__dirname, '../data/mentors.json');

function readJSON(f)      { try { return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { return []; } }
function writeJSON(f, d)  { fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf-8'); }

// GET all mentors
router.get('/', (req, res) => {
    res.json(readJSON(MENTORS_FILE));
});

// POST add mentor request
router.post('/', (req, res) => {
    const mentors = readJSON(MENTORS_FILE);
    const newId   = mentors.length ? Math.max(...mentors.map(m => m.id)) + 1 : 1;
    const newMentor = { id: newId, ...req.body };
    mentors.push(newMentor);
    writeJSON(MENTORS_FILE, mentors);
    res.status(201).json({ success: true, mentor: newMentor });
});

// PUT update mentor
router.put('/:id', (req, res) => {
    const mentors = readJSON(MENTORS_FILE);
    const index   = mentors.findIndex(m => m.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ success: false, message: 'Mentor not found.' });
    mentors[index] = { ...mentors[index], ...req.body, id: mentors[index].id };
    writeJSON(MENTORS_FILE, mentors);
    res.json({ success: true, mentor: mentors[index] });
});

// GET users.json for dashboard stats
const USERS_FILE = path.join(__dirname, '../data/users.json');
router.get('/users', (req, res) => {
    const users = readJSON(USERS_FILE);
    // Return users without passwords for safety
    const safeUsers = users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, alumniId: u.alumniId, photo: u.photo }));
    res.json(safeUsers);
});

module.exports = router;
