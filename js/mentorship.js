// Mentorship controller, search/filters, and consultation requests
let mentorsList = [];
let filteredMentors = [];

const gridContainer = document.getElementById('mentors-grid-container');
const mentorSearch = document.getElementById('mentor-search');
const mentorFilterDept = document.getElementById('mentor-filter-dept');

// Modal Elements
const mentorModal = document.getElementById('mentor-modal');
const mentorModalCloseBtn = document.getElementById('mentor-modal-close-btn');
const mentorFormCancelBtn = document.getElementById('mentor-form-cancel-btn');
const mentorForm = document.getElementById('mentor-form');

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
        initMentorshipPage();
    }, 120);
});

function initMentorshipPage() {
    mentorsList = db.getMentors();
    
    // Populate dropdowns
    populateDeptDropdowns();
    
    // Attach listeners
    mentorSearch.addEventListener('input', applyFilters);
    mentorFilterDept.addEventListener('change', applyFilters);
    mentorModalCloseBtn.addEventListener('click', closeModal);
    mentorFormCancelBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === mentorModal) closeModal();
    });

    mentorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveMentorshipRequest();
    });

    applyFilters();
}

function populateDeptDropdowns() {
    mentorFilterDept.innerHTML = '<option value="">All Departments</option>';
    DEPARTMENTS.forEach(d => {
        mentorFilterDept.innerHTML += `<option value="${d}">${d}</option>`;
    });
}

function applyFilters() {
    const q = mentorSearch.value.toLowerCase().trim();
    const dept = mentorFilterDept.value;

    filteredMentors = mentorsList.filter(mt => {
        const matchSearch = !q || 
            mt.name.toLowerCase().includes(q) ||
            mt.skills.some(sk => sk.toLowerCase().includes(q)) ||
            (mt.company && mt.company.toLowerCase().includes(q));
            
        const matchDept = !dept || mt.department === dept;
        
        return matchSearch && matchDept;
    });

    renderMentors();
}

function renderMentors() {
    gridContainer.innerHTML = '';
    
    if (!filteredMentors.length) {
        gridContainer.innerHTML = '<div class="glass-card text-center" style="grid-column: 1/-1; padding: 40px; color: var(--text-secondary);">No mentors match the criteria.</div>';
        return;
    }

    const currentUser = getCurrentUser();
    const currentEmail = currentUser ? currentUser.email : '';

    filteredMentors.forEach(mt => {
        const card = document.createElement('div');
        card.className = 'glass-card card-item';
        
        // Load skills tags HTML
        let skillsHtml = '';
        if (mt.skills) {
            skillsHtml = mt.skills.map(s => `<span class="preview-tag">${s}</span>`).join(' ');
        }
        
        // Availability list HTML
        const availHtml = mt.availability.map(av => `<li><i class="far fa-clock"></i> ${av}</li>`).join('');

        // Request state check
        const requests = mt.requestedUsers || [];
        const request = requests.find(r => r.email === currentEmail);
        const hasRequested = !!request;
        
        let requestButtonHtml = '';
        if (hasRequested) {
            let statusColor = 'var(--secondary-color)';
            if (request.status === 'Approved') statusColor = 'var(--accent-color)';
            if (request.status === 'Declined') statusColor = 'var(--danger-color)';
            
            requestButtonHtml = `
                <span class="badge" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 0.8rem; width: 100%; display: block; text-align: center; padding: 8px;">
                    Request: <strong style="color: ${statusColor};">${request.status}</strong>
                </span>
            `;
        } else {
            requestButtonHtml = `
                <button class="btn btn-primary" onclick="openRequestModal(${mt.id})" style="width: 100%;">
                    <i class="fas fa-handshake"></i> Request Consultation
                </button>
            `;
        }

        // Standard avatar seed based on name hash
        const photo = `https://api.dicebear.com/7.x/avataaars/svg?seed=${mt.name.replace(/\s+/g, '')}`;

        card.innerHTML = `
            <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px;">
                <img src="${photo}" alt="Avatar" class="user-avatar-sm" style="width: 50px; height: 50px;">
                <div>
                    <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${mt.name}</h3>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${mt.designation} at <strong>${mt.company}</strong></div>
                </div>
            </div>
            
            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 8px;">${mt.department} • Class of ${mt.batch}</div>
            
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px;">
                <strong>Availability:</strong>
                <ul style="list-style: none; display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                    ${availHtml}
                </ul>
            </p>

            <div class="preview-tags" style="margin-bottom: 20px; flex-grow: 1; display: flex; align-content: flex-start;">
                ${skillsHtml}
            </div>

            <div class="card-footer" style="padding-top: 15px; border-top: 1px solid var(--border-color); width: 100%;">
                ${requestButtonHtml}
            </div>
        `;
        
        gridContainer.appendChild(card);
    });
}

window.openRequestModal = function(id) {
    const mt = mentorsList.find(m => m.id === id);
    if (!mt) return;

    document.getElementById('form-mentor-id').value = mt.id;
    document.getElementById('form-mentor-name').value = mt.name;
    document.getElementById('form-mentor-msg').value = '';
    
    mentorModal.classList.add('show');
};

function closeModal() {
    mentorModal.classList.remove('show');
}

function saveMentorshipRequest() {
    const mentorId = parseInt(document.getElementById('form-mentor-id').value);
    const message = document.getElementById('form-mentor-msg').value.trim();
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const mt = mentorsList.find(m => m.id === mentorId);
    if (!mt) return;

    if (!mt.requestedUsers) mt.requestedUsers = [];

    // Push request
    mt.requestedUsers.push({
        email: currentUser.email,
        status: "Pending",
        message: message
    });

    db.setMentors(mentorsList);
    showToast(`Consultation request submitted to ${mt.name}!`, 'success');
    closeModal();
    applyFilters();
}
