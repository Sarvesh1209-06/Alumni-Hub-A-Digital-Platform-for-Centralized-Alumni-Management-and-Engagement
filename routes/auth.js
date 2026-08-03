// =====================================================
// routes/auth.js — Login & Registration API
// =====================================================
// Handles:
//   POST /api/auth/login    → Validate email + password
//   POST /api/auth/register → Create user account + alumni profile
// =====================================================

const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const multer  = require('multer');
const bcrypt  = require('bcryptjs');

// ── File paths ─────────────────────────────────────
const USERS_FILE  = path.join(__dirname, '../data/users.json');
const ALUMNI_FILE = path.join(__dirname, '../data/alumni.json');

// ── Upload config for profile photo (during registration) ──
const storage = multer.diskStorage({
    // Where to save the file
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    // What to name the file (timestamp + original name)
    filename: (req, file, cb) => {
        const uniqueName = `photo_${Date.now()}_${file.originalname}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// ── Helper: Read JSON file safely ─────────────────
function readJSON(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return [];
    }
}

// ── Helper: Write JSON file safely ─────────────────
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ══════════════════════════════════════════════════
// GET /api/auth/users
// Returns all users WITHOUT passwords (for frontend cache init)
// ══════════════════════════════════════════════════
router.get('/users', (req, res) => {
    const users = readJSON(USERS_FILE);
    // Strip passwords before sending to the browser
    const safeUsers = users.map(u => ({
        id:       u.id,
        fullName: u.fullName || u.name || '',
        name:     u.name || u.fullName || '',
        email:    u.email,
        role:     u.role,
        profileCompleted: u.profileCompleted === true,
        alumniId: u.alumniId || null,
        photo:    u.photo || ''
    }));
    res.json(safeUsers);
});

// ══════════════════════════════════════════════════
// POST /api/auth/login
// Body: { email, password }
// Response: { success, user }
// ══════════════════════════════════════════════════
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Read all users from users.json
    const users = readJSON(USERS_FILE);

    // Find a user with matching email (case-insensitive) AND matching password
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!foundUser) {
        return res.status(401).json({ success: false, message: 'Invalid email or password. Please try again.' });
    }

    const storedPwd = foundUser.password || '';
    let passwordMatches = false;

    // If password looks like a bcrypt hash, use compare
    if (storedPwd.startsWith('$2')) {
        passwordMatches = bcrypt.compareSync(password, storedPwd);
    } else {
        // Legacy plaintext password — compare directly
        passwordMatches = storedPwd === password;
        // If it matches, re-hash and persist the new hash for improved security
        if (passwordMatches) {
            try {
                foundUser.password = bcrypt.hashSync(password, 10);
                writeJSON(USERS_FILE, users);
            } catch (err) {
                console.warn('Could not re-hash legacy password:', err.message);
            }
        }
    }

    if (!passwordMatches) {
        return res.status(401).json({ success: false, message: 'Invalid email or password. Please try again.' });
    }

    // Login successful — create session and return safe user object
    const userSession = {
        id:       foundUser.id,
        name:     foundUser.name || foundUser.fullName || '',
        fullName: foundUser.fullName || foundUser.name || '',
        email:    foundUser.email,
        role:     foundUser.role,
        profileCompleted: foundUser.profileCompleted === true,
        alumniId: foundUser.alumniId || null,
        photo:    foundUser.photo || ''
    };

    // Save minimal user info in the session
    req.session.user = { id: userSession.id, name: userSession.name, email: userSession.email, role: userSession.role, alumniId: userSession.alumniId };

    return res.json({ success: true, user: userSession });
});


// ══════════════════════════════════════════════════
// POST /api/auth/register
// Body: FormData with photo file + all registration fields
// Response: { success, message, user }
// ══════════════════════════════════════════════════
router.post('/register', upload.single('photo'), (req, res) => {
    // Basic account registration handler.
    // This endpoint creates a user account only. Alumni profiles are created
    // later via the /api/alumni POST endpoint and linked to the user by userId.
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !phone) {
        return res.status(400).json({ success: false, message: 'Name, email, password, and phone are required.' });
    }

    const users = readJSON(USERS_FILE);

    // Prevent duplicate email or phone
    const emailExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) return res.status(409).json({ success: false, message: 'This email address is already registered.' });

    const phoneExists = users.some(u => u.phone && u.phone.replace(/\s/g, '') === phone.replace(/\s/g, ''));
    if (phoneExists) return res.status(409).json({ success: false, message: 'This phone number is already registered.' });

    // Photo handling
    let photoPath = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}`;
    if (req.file) photoPath = `/uploads/${req.file.filename}`;

    // Generate new user id in USR### format (preserve existing numeric ids safely)
    const existingIds = users.map(u => (typeof u.id === 'string' && u.id.startsWith('USR')) ? parseInt(u.id.replace('USR', '')) : (typeof u.id === 'number' ? u.id : 0));
    const maxIdNum = existingIds.length ? Math.max(...existingIds) : 0;
    const nextNum = maxIdNum + 1;
    const newUserId = `USR${String(nextNum).padStart(3, '0')}`;

    // Hash password
    const hashed = bcrypt.hashSync(password, 10);

    const newUser = {
        id: newUserId,
        fullName: name,
        name: name,
        email: email,
        phone: phone,
        password: hashed,
        role: role === 'Student' ? 'Student' : (role || 'Alumni'),
        profileCompleted: role === 'Student',
        alumniId: null,
        photo: photoPath,
        createdAt: new Date().toISOString()
    };

    // Special demo admin override
    if (email.toLowerCase() === 'lolsarvesh2006@gmail.com' && password === 'qwertyuiopasdfghjkl') {
        newUser.role = 'admin';
        newUser.alumniId = null;
        newUser.profileCompleted = true;
    }

    users.push(newUser);
    writeJSON(USERS_FILE, users);

    const userSession = {
        id: newUser.id,
        name: newUser.name,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        profileCompleted: newUser.profileCompleted,
        alumniId: newUser.alumniId,
        photo: newUser.photo
    };

    return res.status(201).json({ success: true, message: 'Account created.', user: userSession });
});

// GET /api/auth/me — returns the current authenticated user from session
router.get('/me', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ success: true, user: req.session.user });
    }
    return res.json({ success: false, user: null });
});

// POST /api/auth/logout — destroy session
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ success: false, message: 'Could not log out.' });
        res.clearCookie('alumni.sid');
        return res.json({ success: true, message: 'Logged out.' });
    });
});

module.exports = router;
