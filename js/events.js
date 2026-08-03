// Events data controller, search/filters, RSVP registration toggling, and Admin CRUD operations
let eventsList = [];
let filteredEvents = [];

const gridContainer = document.getElementById('events-grid-container');
const eventSearch = document.getElementById('event-search');
const eventFilterDept = document.getElementById('event-filter-dept');
const btnCreateEvent = document.getElementById('btn-create-event');

// Modal Elements
const eventModal = document.getElementById('event-modal');
const eventModalTitle = document.getElementById('event-modal-title');
const eventModalCloseBtn = document.getElementById('event-modal-close-btn');
const eventForm = document.getElementById('event-form');
const eventFormCancelBtn = document.getElementById('event-form-cancel-btn');

const DEPARTMENTS = [
    "Computer Science and Engineering",
    "Information Technology",
    "Electronics and Communication Engineering",
    "Electrical and Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Artificial Intelligence and Data Science"
];

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initEventsPage();
    }, 120);
});

function initEventsPage() {
    eventsList = db.getEvents();
    
    // Check if user is Admin to show schedule button
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'admin') {
        btnCreateEvent.style.display = 'inline-flex';
    }

    // Populate department options
    populateDeptDropdowns();
    
    // Attach event listeners
    eventSearch.addEventListener('input', applyFilters);
    eventFilterDept.addEventListener('change', applyFilters);
    btnCreateEvent.addEventListener('click', openAddModal);
    eventModalCloseBtn.addEventListener('click', closeModal);
    eventFormCancelBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === eventModal) closeModal();
    });

    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });

    // Check query params for instant modal (shortcut)
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'create' && currentUser && currentUser.role === 'admin') {
        openAddModal();
    }

    applyFilters();
}

function populateDeptDropdowns() {
    eventFilterDept.innerHTML = '<option value="">All Departments</option>';
    DEPARTMENTS.forEach(d => {
        eventFilterDept.innerHTML += `<option value="${d}">${d}</option>`;
    });

    const formEventDept = document.getElementById('form-event-dept');
    if (formEventDept) {
        formEventDept.innerHTML = '<option value="All Departments">All Departments</option>';
        DEPARTMENTS.forEach(d => {
            formEventDept.innerHTML += `<option value="${d}">${d}</option>`;
        });
    }
}

function applyFilters() {
    const q = eventSearch.value.toLowerCase().trim();
    const dept = eventFilterDept.value;

    filteredEvents = eventsList.filter(ev => {
        const matchSearch = !q || 
            ev.title.toLowerCase().includes(q) ||
            ev.description.toLowerCase().includes(q) ||
            ev.location.toLowerCase().includes(q);
            
        const matchDept = !dept || ev.department === dept || ev.department === "All Departments";
        
        return matchSearch && matchDept;
    });

    // Sort events by date descending
    filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderEvents();
}

function renderEvents() {
    gridContainer.innerHTML = '';
    
    if (!filteredEvents.length) {
        gridContainer.innerHTML = '<div class="glass-card text-center" style="grid-column: 1/-1; padding: 40px; color: var(--text-secondary);">No events match the criteria.</div>';
        return;
    }

    const currentUser = getCurrentUser();
    const currentEmail = currentUser ? currentUser.email : '';
    const isAdmin = currentUser && currentUser.role === 'admin';

    filteredEvents.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'glass-card card-item';
        
        // Format Date beautifully
        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = new Date(ev.date).toLocaleDateString('en-US', dateOptions);
        
        // Registration state
        const registeredUsers = ev.registeredUsers || [];
        const isRegistered = registeredUsers.includes(currentEmail);
        
        let registerButtonHtml = '';
        if (isRegistered) {
            registerButtonHtml = `
                <button class="btn btn-secondary" onclick="toggleRSVP(${ev.id})" style="border-color: var(--accent-color); color: var(--accent-color);">
                    <i class="fas fa-check"></i> Registered
                </button>
            `;
        } else {
            registerButtonHtml = `
                <button class="btn btn-primary" onclick="toggleRSVP(${ev.id})">
                    <i class="fas fa-calendar-check"></i> RSVP Register
                </button>
            `;
        }

        // Admin action buttons
        const adminActionsHtml = isAdmin ? `
            <div style="display: flex; gap: 6px;">
                <button class="btn-action btn-edit" onclick="openEditModal(${ev.id})" title="Edit Event">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" onclick="handleDelete(${ev.id})" title="Delete Event">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        ` : '';

        card.innerHTML = `
            <div class="card-tag">${ev.department}</div>
            <h3 class="card-title">${ev.title}</h3>
            <p class="card-body-text">${ev.description}</p>
            
            <div class="card-meta-list">
                <div class="card-meta-item">
                    <i class="fas fa-calendar-day"></i>
                    <span>${formattedDate} at ${ev.time}</span>
                </div>
                <div class="card-meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${ev.location}</span>
                </div>
                <div class="card-meta-item">
                    <i class="fas fa-users"></i>
                    <span>${registeredUsers.length} Registered Attendees</span>
                </div>
            </div>

            <div class="card-footer">
                ${registerButtonHtml}
                ${adminActionsHtml}
            </div>
        `;
        
        gridContainer.appendChild(card);
    });
}

window.toggleRSVP = function(id) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const ev = eventsList.find(e => e.id === id);
    if (!ev) return;

    if (!ev.registeredUsers) ev.registeredUsers = [];

    const index = ev.registeredUsers.indexOf(currentUser.email);
    if (index !== -1) {
        // Cancel registration
        ev.registeredUsers.splice(index, 1);
        ev.registeredCount = ev.registeredUsers.length;
        showToast('Registration cancelled for event.', 'info');
    } else {
        // Register user
        ev.registeredUsers.push(currentUser.email);
        ev.registeredCount = ev.registeredUsers.length;
        showToast('Registration successful! RSVP confirmed.', 'success');
    }

    db.setEvents(eventsList);
    applyFilters();
};

// Modal Operations
function openAddModal() {
    eventModalTitle.textContent = "Schedule New Event";
    eventForm.reset();
    document.getElementById('event-id').value = '';
    eventModal.classList.add('show');
}

window.openEditModal = function(id) {
    const ev = eventsList.find(e => e.id === id);
    if (!ev) return;

    eventModalTitle.textContent = `Edit Event - ${ev.title}`;
    document.getElementById('event-id').value = ev.id;
    document.getElementById('form-event-title').value = ev.title;
    document.getElementById('form-event-desc').value = ev.description;
    document.getElementById('form-event-date').value = ev.date;
    document.getElementById('form-event-time').value = ev.time;
    document.getElementById('form-event-loc').value = ev.location;
    document.getElementById('form-event-dept').value = ev.department;

    eventModal.classList.add('show');
};

function closeModal() {
    eventModal.classList.remove('show');
}

function saveEvent() {
    const idVal = document.getElementById('event-id').value;
    
    const title = document.getElementById('form-event-title').value.trim();
    const description = document.getElementById('form-event-desc').value.trim();
    const date = document.getElementById('form-event-date').value;
    const time = document.getElementById('form-event-time').value;
    const location = document.getElementById('form-event-loc').value.trim();
    const department = document.getElementById('form-event-dept').value;

    if (idVal) {
        // Edit Mode
        const idx = eventsList.findIndex(e => e.id === parseInt(idVal));
        if (idx !== -1) {
            eventsList[idx] = {
                ...eventsList[idx],
                title, description, date, time, location, department
            };
            showToast('Event updated successfully!', 'success');
        }
    } else {
        // Add Mode
        const nextId = eventsList.length ? Math.max(...eventsList.map(e => e.id)) + 1 : 1;
        const newEvent = {
            id: nextId,
            title, description, date, time, location, department,
            registeredCount: 0,
            registeredUsers: []
        };
        eventsList.push(newEvent);
        showToast('New event scheduled successfully!', 'success');
    }

    db.setEvents(eventsList);
    closeModal();
    initEventsPage();
}

window.handleDelete = function(id) {
    const ev = eventsList.find(e => e.id === id);
    if (!ev) return;

    if (confirm(`Are you sure you want to permanently delete the event: "${ev.title}"?`)) {
        eventsList = eventsList.filter(e => e.id !== id);
        db.setEvents(eventsList);
        showToast('Event deleted successfully.', 'info');
        initEventsPage();
    }
};
