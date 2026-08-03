// =====================================================
// routes/jobs.js — Jobs API
// =====================================================
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const JOBS_FILE = path.join(__dirname, '../data/jobs.json');

function readJSON(f)      { try { return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { return []; } }
function writeJSON(f, d)  { fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf-8'); }

// GET all jobs
router.get('/', (req, res) => {
    res.json(readJSON(JOBS_FILE));
});

// GET one job
router.get('/:id', (req, res) => {
    const jobs = readJSON(JOBS_FILE);
    const job  = jobs.find(j => j.id === parseInt(req.params.id));
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
    res.json(job);
});

// POST add job
router.post('/', (req, res) => {
    const jobs  = readJSON(JOBS_FILE);
    const newId = jobs.length ? Math.max(...jobs.map(j => j.id)) + 1 : 1;
    const newJob = { id: newId, ...req.body };
    jobs.push(newJob);
    writeJSON(JOBS_FILE, jobs);
    res.status(201).json({ success: true, job: newJob });
});

// PUT update job
router.put('/:id', (req, res) => {
    const jobs  = readJSON(JOBS_FILE);
    const index = jobs.findIndex(j => j.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ success: false, message: 'Job not found.' });
    jobs[index] = { ...jobs[index], ...req.body, id: jobs[index].id };
    writeJSON(JOBS_FILE, jobs);
    res.json({ success: true, job: jobs[index] });
});

// DELETE job
router.delete('/:id', (req, res) => {
    const jobs     = readJSON(JOBS_FILE);
    const filtered = jobs.filter(j => j.id !== parseInt(req.params.id));
    if (filtered.length === jobs.length) return res.status(404).json({ success: false, message: 'Job not found.' });
    writeJSON(JOBS_FILE, filtered);
    res.json({ success: true, message: 'Job deleted.' });
});

module.exports = router;
