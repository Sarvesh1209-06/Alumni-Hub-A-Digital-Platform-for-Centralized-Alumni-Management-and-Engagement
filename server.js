// =====================================================
// server.js — Main Express Server Entry Point
// Alumni Management System Backend
// =====================================================
// This file:
//  1. Sets up the Express web server
//  2. Enables file uploads (photos + resumes)
//  3. Mounts all API route files
//  4. Serves the frontend HTML pages as static files
//     (so you open http://localhost:3000 instead of Live Server)
// =====================================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const session = require('express-session');

const app  = express();
const PORT = 3000;

// ── 1. Middleware ──────────────────────────────────
// Enable Cross-Origin requests (browser → server)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Session middleware ─────────────────────────────
app.use(session({
    name: 'alumni.sid',
    secret: 'change_this_secret_in_production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // set to true when using HTTPS in production
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// ── 2. Static Files ────────────────────────────────
// Serve the entire project folder as static files.
// This replaces VS Code Live Server.
// Opening http://localhost:3000 loads index.html automatically.
app.use(express.static(path.join(__dirname)));

// Serve uploaded files (profile photos, resumes) publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── 3. Ensure uploads folder exists ───────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Created uploads/ directory');
}

// ── 4. API Routes ──────────────────────────────────
// Each route file handles a specific feature.
// To add a real database later, only edit these route files.
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/alumni',  require('./routes/alumni'));
app.use('/api/events',  require('./routes/events'));
app.use('/api/jobs',    require('./routes/jobs'));
app.use('/api/mentors', require('./routes/mentors'));

// ── 5. Root & Fallback ─────────────────────────────
// Serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

// ── 6. Start Server ────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('🎓 AlumniHub Backend Server Running!');
    console.log(`🌐 Open your browser at: http://localhost:${PORT}`);
    console.log(`📁 API Base URL:          http://localhost:${PORT}/api`);
    console.log('');
    console.log('📌 Demo Login Credentials:');
    console.log('   Admin  → lolsarvesh2006@gmail.com / qwertyuiopasdfghjkl');
    console.log('   Admin  → admin@college.edu / admin');
    console.log('   Alumni → user@college.edu / user123');
    console.log('');
    console.log('Press Ctrl+C to stop the server.');
});
