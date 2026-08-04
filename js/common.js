/**
 * Shared utility functions, API-backed database layer,
 * session control, theme management, and UI notifications.
 *
 * BACKEND INTEGRATION:
 * Data is now fetched from the Node.js/Express server at localhost:3000.
 * localStorage is used as a fast local cache.
 * All writes go to the server (persistent JSON files) AND localStorage (instant UI).
 */

// ── Backend API base URL ───────────────────────────
// Change this if your server runs on a different port
const API_BASE = 'https://alumni-hub-a-digital-platform-for.onrender.com/api';

// ── API Helper: generic fetch wrapper ─────────────
async function apiCall(method, endpoint, body = null) {
    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }
        const res  = await fetch(API_BASE + endpoint, options);
        const data = await res.json();
        return data;
    } catch (err) {
        console.error(`API ${method} ${endpoint} failed:`, err);
        return null;
    }
}

// ── Initialize Database from the backend server ───
// On every page load, always fetch fresh data from the server.
// This guarantees newly registered alumni show up immediately.
async function initDatabase() {
    try {
        // Fetch all datasets from the API in parallel
        const [alumni, users, events, jobs, mentors] = await Promise.all([
            apiCall('GET', '/alumni'),
            apiCall('GET', '/auth/users'),
            apiCall('GET', '/events'),
            apiCall('GET', '/jobs'),
            apiCall('GET', '/mentors')
        ]);

        // Store in localStorage as local cache
        if (alumni)  localStorage.setItem('alumni_db',  JSON.stringify(alumni));
        if (users)   localStorage.setItem('users_db',   JSON.stringify(users));
        if (events)  localStorage.setItem('events_db',  JSON.stringify(events));
        if (jobs)    localStorage.setItem('jobs_db',     JSON.stringify(jobs));
        if (mentors) localStorage.setItem('mentors_db', JSON.stringify(mentors));

        console.log('✅ Database loaded from backend server.');
    } catch (err) {
        // Fallback: use cached data if server is not running
        console.warn('⚠️ Could not reach backend server. Using cached data.', err);
    }
}

// ── Database Object ───────────────────────────────
// getters: read from fast localStorage cache (synchronous, no change to other JS files)
// setters: update localStorage immediately + sync to server in background
const db = {
    // ─ Alumni ─
    getAlumni: () => JSON.parse(localStorage.getItem('alumni_db')) || [],
    setAlumni: (data) => {
        localStorage.setItem('alumni_db', JSON.stringify(data));
        // Note: add/edit/delete use dedicated API calls in alumni.js
    },

    // ─ Users ─
    getUsers: () => JSON.parse(localStorage.getItem('users_db')) || [],
    setUsers: (data) => {
        localStorage.setItem('users_db', JSON.stringify(data));
    },

    // ─ Events ─
    getEvents: () => JSON.parse(localStorage.getItem('events_db')) || [],
    setEvents: (data) => {
        localStorage.setItem('events_db', JSON.stringify(data));
        // Sync full events list to server
        apiCall('PUT', '/events/sync', data).catch(() => {});
    },

    // ─ Jobs ─
    getJobs: () => JSON.parse(localStorage.getItem('jobs_db')) || [],
    setJobs: (data) => {
        localStorage.setItem('jobs_db', JSON.stringify(data));
    },

    // ─ Mentors ─
    getMentors: () => JSON.parse(localStorage.getItem('mentors_db')) || [],
    setMentors: (data) => {
        localStorage.setItem('mentors_db', JSON.stringify(data));
    }
};

// Resolve alumni record ID mapped to user account
function getAlumniIdForUser(user) {
    if (!user) return null;
    if (user.alumniId !== undefined && user.alumniId !== null) return user.alumniId;
    
    // Match by name string
    const alumni = db.getAlumni();
    const match = alumni.find(a => a.name.toLowerCase() === user.name.toLowerCase());
    return match ? match.id : null;
}

// Toast Notifications System
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} glass-card`;
    
    let iconClass = 'fas fa-check-circle';
    if (type === 'error') iconClass = 'fas fa-exclamation-circle';
    if (type === 'info') iconClass = 'fas fa-info-circle';
    
    toast.innerHTML = `
        <i class="toast-icon ${iconClass}"></i>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 50);
    
    // Remove after 3.5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// User Session Auth Control
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function checkAuth() {
    const user = getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop();
    
    // Auth pages
    const isAuthPage = ['login.html', 'signup.html', 'index.html', ''].includes(currentPage);
    
    if (!user && !isAuthPage) {
        window.location.href = 'login.html';
        return;
    } else if (user && (currentPage === 'login.html' || currentPage === 'signup.html')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Enforce Admin-only Reports protection
    if (currentPage === 'reports.html' && (!user || user.role !== 'admin')) {
        document.body.style.display = 'none';
        alert('Access Denied: You do not have permissions to access the reports dashboard.');
        window.location.href = 'dashboard.html';
    }
}

// Setup User Info UI in Sidebar
function setupUserSidebar() {
    const user = getCurrentUser();
    if (!user) return;
    
    const avatar = document.querySelector('.sidebar-user-avatar');
    const nameEl = document.querySelector('.sidebar-user-name');
    const roleEl = document.querySelector('.sidebar-user-role');
    const logoutBtn = document.querySelector('.sidebar-user-logout');
    
    if (avatar) avatar.src = user.photo || 'https://api.dicebear.com/7.x/adventurer/svg?seed=user';
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    
    // Dynamically hide reports dashboard item for non-admins
    const reportsLink = document.querySelector('a[href="reports.html"]');
    if (reportsLink && user.role !== 'admin') {
        const li = reportsLink.closest('.sidebar-item');
        if (li) li.style.display = 'none';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await apiCall('POST', '/auth/logout');
            } catch (err) {
                console.warn('Logout failed:', err);
            }
            localStorage.removeItem('currentUser');
            showToast('Logged out successfully', 'info');
            setTimeout(() => { window.location.href = 'index.html'; }, 800);
        });
    }
}

// Toggle Sidebar for Mobile
function setupSidebarToggle() {
    const toggleBtn = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
}

// Dark/Light Theme Handler
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const toggleBtn = document.getElementById('theme-toggle-btn');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.remove('light-theme');
        if (toggleBtn) toggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            toggleBtn.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            showToast(`Switched to ${isLight ? 'Light' : 'Dark'} Mode`, 'info');
            
            // Trigger customized event for chart updates
            window.dispatchEvent(new Event('themeChanged'));
        });
    }
}

// Active Sidebar Link Highlight
function highlightActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.sidebar-item');
    
    menuItems.forEach(item => {
        const link = item.querySelector('a');
        if (link) {
            const href = link.getAttribute('href');
            if (href === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    });
}

// Run shared setups on DOM Load
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ensure databases exist
    await initDatabase();

    // 1.5 Fetch current authenticated user from backend session
    try {
        const me = await apiCall('GET', '/auth/me');
        if (me && me.success && me.user) {
            localStorage.setItem('currentUser', JSON.stringify(me.user));
        } else {
            localStorage.removeItem('currentUser');
        }
    } catch (err) {
        console.warn('Could not verify session with backend:', err);
    }

    // 2. Perform authentication check
    checkAuth();

    // 3. Setup common controls
    setupUserSidebar();
    setupSidebarToggle();
    initTheme();
    highlightActiveMenu();

    // Add FontAwesome CDN if not present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesome = document.createElement('link');
        fontAwesome.rel = 'stylesheet';
        fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        document.head.appendChild(fontAwesome);
    }
});
