// =====================================================
// routes/alumni.js — Alumni CRUD API
// =====================================================
// Handles:
//   GET    /api/alumni          → Get all alumni
//   GET    /api/alumni/:id      → Get one alumni by ID
//   POST   /api/alumni          → Add new alumni
//   PUT    /api/alumni/:id      → Edit existing alumni
//   DELETE /api/alumni/:id      → Delete alumni
//   POST   /api/alumni/:id/photo → Upload/update profile photo
//   POST   /api/alumni/:id/resume → Upload resume
// =====================================================

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const multer  = require('multer');

// ── File path ──────────────────────────────────────
const ALUMNI_FILE = path.join(__dirname, '../data/alumni.json');
const USERS_FILE  = path.join(__dirname, '../data/users.json');

// ── Multer: upload config for photos and resumes ──
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        // e.g. photo_1234567890_profile.jpg
        const prefix = file.fieldname === 'resume' ? 'resume' : 'photo';
        cb(null, `${prefix}_${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({ storage });

// ── Helpers ────────────────────────────────────────
function readJSON(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
        return [];
    }
}

function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ══════════════════════════════════════════════════
// GET /api/alumni
// Returns all alumni records
// ══════════════════════════════════════════════════
router.get('/', (req, res) => {
    const alumni = readJSON(ALUMNI_FILE);
    res.json(alumni);
});

// ══════════════════════════════════════════════════
// GET /api/alumni/:id
// Returns one alumni record by ID
// ══════════════════════════════════════════════════
router.get('/:id', (req, res) => {
    const alumni  = readJSON(ALUMNI_FILE);
    const alumnus = alumni.find(a => a.id === parseInt(req.params.id));

    if (!alumnus) {
        return res.status(404).json({ success: false, message: 'Alumni not found.' });
    }
    res.json(alumnus);
});

// ══════════════════════════════════════════════════
// POST /api/alumni
// Adds a new alumni record
// Body: alumni object (JSON)
// ══════════════════════════════════════════════════
router.post('/', (req, res) => {
    const alumni = readJSON(ALUMNI_FILE);

    // Generate a new numeric ID for alumni (max existing + 1)
    const newId = alumni.length ? Math.max(...alumni.map(a => a.id)) + 1 : 1;

    // Ensure we never overwrite existing records — build the object explicitly
    const newAlumni = Object.assign({ id: newId }, req.body);

    // If a userId was provided, link it in the alumni profile
    if (req.body.userId) {
        newAlumni.userId = req.body.userId;
    }

    // Append (not overwrite) the new record
    alumni.push(newAlumni);
    writeJSON(ALUMNI_FILE, alumni);

    // If this alumni is linked to a user account, update that user to mark profileCompleted
    if (newAlumni.userId) {
        try {
            const users = readJSON(USERS_FILE);
            const uIndex = users.findIndex(u => u.id === newAlumni.userId);
            if (uIndex !== -1) {
                users[uIndex].profileCompleted = true;
                users[uIndex].alumniId = newAlumni.id;
                writeJSON(USERS_FILE, users);
            }
        } catch (err) {
            console.warn('Warning: could not update users.json to link alumni profile:', err.message);
        }
    }

    res.status(201).json({ success: true, alumni: newAlumni });
});

// ══════════════════════════════════════════════════
// PUT /api/alumni/:id
// Updates an existing alumni record
// Body: updated alumni fields (partial or full)
// ══════════════════════════════════════════════════
router.put('/:id', (req, res) => {
    const alumni = readJSON(ALUMNI_FILE);
    const index  = alumni.findIndex(a => a.id === parseInt(req.params.id));

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Alumni not found.' });
    }

    // Merge existing record with updated fields
    alumni[index] = { ...alumni[index], ...req.body, id: alumni[index].id };
    writeJSON(ALUMNI_FILE, alumni);

    res.json({ success: true, alumni: alumni[index] });
});

// ══════════════════════════════════════════════════
// DELETE /api/alumni/:id
// Deletes an alumni record permanently
// ══════════════════════════════════════════════════
router.delete('/:id', (req, res) => {
    const alumni   = readJSON(ALUMNI_FILE);
    const filtered = alumni.filter(a => a.id !== parseInt(req.params.id));

    if (filtered.length === alumni.length) {
        return res.status(404).json({ success: false, message: 'Alumni not found.' });
    }

    writeJSON(ALUMNI_FILE, filtered);
    res.json({ success: true, message: 'Alumni deleted successfully.' });
});

// ══════════════════════════════════════════════════
// POST /api/alumni/:id/photo
// Upload or update a profile photo for an alumni
// Form field: "photo" (file)
// ══════════════════════════════════════════════════
router.post('/:id/photo', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No photo file provided.' });
    }

    const alumni = readJSON(ALUMNI_FILE);
    const index  = alumni.findIndex(a => a.id === parseInt(req.params.id));

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Alumni not found.' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    alumni[index].photo = photoUrl;
    writeJSON(ALUMNI_FILE, alumni);

    res.json({ success: true, photoUrl });
});

// ══════════════════════════════════════════════════
// POST /api/alumni/:id/resume
// Upload a resume for an alumni
// Form field: "resume" (file)
// ══════════════════════════════════════════════════
router.post('/:id/resume', upload.single('resume'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No resume file provided.' });
    }

    const alumni = readJSON(ALUMNI_FILE);
    const index  = alumni.findIndex(a => a.id === parseInt(req.params.id));

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Alumni not found.' });
    }

    const resumeUrl = `/uploads/${req.file.filename}`;
    alumni[index].resume = resumeUrl;
    writeJSON(ALUMNI_FILE, alumni);

    res.json({ success: true, resumeUrl });
});

module.exports = router;
