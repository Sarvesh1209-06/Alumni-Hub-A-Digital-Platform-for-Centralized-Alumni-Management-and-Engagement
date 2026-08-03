// =====================================================
// routes/events.js — Events API
// =====================================================
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');

const EVENTS_FILE = path.join(__dirname, '../data/events.json');

function readJSON(f)      { try { return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { return []; } }
function writeJSON(f, d)  { fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf-8'); }

// GET all events
router.get('/', (req, res) => {
    res.json(readJSON(EVENTS_FILE));
});

// GET one event
router.get('/:id', (req, res) => {
    const events = readJSON(EVENTS_FILE);
    const event  = events.find(e => e.id === parseInt(req.params.id));
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json(event);
});

// POST add event (admin only — frontend enforces this)
router.post('/', (req, res) => {
    const events = readJSON(EVENTS_FILE);
    const newId  = events.length ? Math.max(...events.map(e => e.id)) + 1 : 1;
    const newEvent = { id: newId, ...req.body };
    events.push(newEvent);
    writeJSON(EVENTS_FILE, events);
    res.status(201).json({ success: true, event: newEvent });
});

// PUT update event
router.put('/:id', (req, res) => {
    const events = readJSON(EVENTS_FILE);
    const index  = events.findIndex(e => e.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ success: false, message: 'Event not found.' });
    events[index] = { ...events[index], ...req.body, id: events[index].id };
    writeJSON(EVENTS_FILE, events);
    res.json({ success: true, event: events[index] });
});

// DELETE event
router.delete('/:id', (req, res) => {
    const events   = readJSON(EVENTS_FILE);
    const filtered = events.filter(e => e.id !== parseInt(req.params.id));
    if (filtered.length === events.length) return res.status(404).json({ success: false, message: 'Event not found.' });
    writeJSON(EVENTS_FILE, filtered);
    res.json({ success: true, message: 'Event deleted.' });
});

module.exports = router;
