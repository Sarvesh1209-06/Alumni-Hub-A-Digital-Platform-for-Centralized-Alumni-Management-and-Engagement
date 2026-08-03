// Jobs Board data controller, apply actions, search, filters, status trackers, and CRUD
let jobsList = [];
let filteredJobs = [];

const gridContainer = document.getElementById('jobs-grid-container');
const jobSearch = document.getElementById('job-search');
const jobFilterDept = document.getElementById('job-filter-dept');
const btnPostJob = document.getElementById('btn-post-job');

// Modal Elements
const jobModal = document.getElementById('job-modal');
const jobModalCloseBtn = document.getElementById('job-modal-close-btn');
const jobForm = document.getElementById('job-form');
const jobFormCancelBtn = document.getElementById('job-form-cancel-btn');

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
        initJobsPage();
    }, 120);
});

function initJobsPage() {
    jobsList = db.getJobs();
    
    // Check user roles
    const currentUser = getCurrentUser();
    
    // Students cannot post jobs, hide the button
    if (currentUser && currentUser.role === 'student') {
        btnPostJob.style.display = 'none';
    } else {
        btnPostJob.style.display = 'inline-flex';
    }

    // Populate dropdowns
    populateDeptDropdowns();
    
    // Attach event listeners
    jobSearch.addEventListener('input', applyFilters);
    jobFilterDept.addEventListener('change', applyFilters);
    btnPostJob.addEventListener('click', openAddModal);
    jobModalCloseBtn.addEventListener('click', closeModal);
    jobFormCancelBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === jobModal) closeModal();
    });

    jobForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveJob();
    });

    // Check query params for instant modal (shortcut)
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'post' && currentUser && currentUser.role !== 'student') {
        openAddModal();
    }

    applyFilters();
}

function populateDeptDropdowns() {
    jobFilterDept.innerHTML = '<option value="">All Departments</option>';
    DEPARTMENTS.forEach(d => {
        jobFilterDept.innerHTML += `<option value="${d}">${d}</option>`;
    });

    const formJobDept = document.getElementById('form-job-dept');
    if (formJobDept) {
        formJobDept.innerHTML = '';
        DEPARTMENTS.forEach(d => {
            formJobDept.innerHTML += `<option value="${d}">${d}</option>`;
        });
    }
}

function applyFilters() {
    const q = jobSearch.value.toLowerCase().trim();
    const dept = jobFilterDept.value;

    filteredJobs = jobsList.filter(jb => {
        const matchSearch = !q || 
            jb.title.toLowerCase().includes(q) ||
            jb.company.toLowerCase().includes(q) ||
            jb.location.toLowerCase().includes(q);
            
        const matchDept = !dept || jb.department === dept;
        
        return matchSearch && matchDept;
    });

    // Sort by id descending
    filteredJobs.reverse();

    renderJobs();
}

function renderJobs() {
    gridContainer.innerHTML = '';
    
    if (!filteredJobs.length) {
        gridContainer.innerHTML = '<div class="glass-card text-center" style="grid-column: 1/-1; padding: 40px; color: var(--text-secondary);">No job opportunities match the criteria.</div>';
        return;
    }

    const currentUser = getCurrentUser();
    const currentEmail = currentUser ? currentUser.email : '';
    const isAdmin = currentUser && currentUser.role === 'admin';

    filteredJobs.forEach(jb => {
        const card = document.createElement('div');
        card.className = 'glass-card card-item';
        
        // Check if current user has applied
        const appliedUsers = jb.appliedUsers || [];
        const application = appliedUsers.find(u => u.email === currentEmail);
        const hasApplied = !!application;
        
        let applyButtonHtml = '';
        if (hasApplied) {
            let statusColor = 'var(--secondary-color)';
            if (application.status === 'Shortlisted') statusColor = 'var(--accent-color)';
            if (application.status === 'Rejected') statusColor = 'var(--danger-color)';
            
            applyButtonHtml = `
                <div class="flex items-center gap-2">
                    <span class="badge" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); color: var(--text-primary);">
                        Status: <strong style="color: ${statusColor}; margin-left: 4px;">${application.status}</strong>
                    </span>
                </div>
            `;
        } else {
            applyButtonHtml = `
                <button class="btn btn-primary" onclick="applyToJob(${jb.id})">
                    <i class="fas fa-paper-plane"></i> Apply Now
                </button>
            `;
        }

        // Admin action buttons (to manage delete)
        const adminActionsHtml = isAdmin ? `
            <button class="btn-action btn-delete" onclick="handleDelete(${jb.id})" title="Delete Job Posting">
                <i class="fas fa-trash-alt"></i>
            </button>
        ` : '';

        card.innerHTML = `
            <div class="card-tag">${jb.department}</div>
            <h3 class="card-title">${jb.title}</h3>
            <h4 style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">${jb.company}</h4>
            <p class="card-body-text">${jb.description}</p>
            
            <div class="card-meta-list">
                <div class="card-meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${jb.location}</span>
                </div>
                <div class="card-meta-item">
                    <i class="fas fa-wallet"></i>
                    <span>CTC: ${jb.salary}</span>
                </div>
                <div class="card-meta-item">
                    <i class="fas fa-briefcase"></i>
                    <span>Experience: ${jb.experienceRequired}</span>
                </div>
                <div class="card-meta-item">
                    <i class="fas fa-user-tie"></i>
                    <span>${appliedUsers.length} Applied Applicants</span>
                </div>
            </div>

            <div class="card-footer">
                ${applyButtonHtml}
                ${adminActionsHtml}
            </div>
        `;
        
        gridContainer.appendChild(card);
    });
}

window.applyToJob = function(id) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const jb = jobsList.find(j => j.id === id);
    if (!jb) return;

    if (!jb.appliedUsers) jb.appliedUsers = [];

    // Add user to job applications with status 'Applied'
    jb.appliedUsers.push({
        email: currentUser.email,
        status: "Applied"
    });
    jb.appliedCount = jb.appliedUsers.length;

    db.setJobs(jobsList);
    showToast(`Application sent to ${jb.company}!`, 'success');
    applyFilters();
};

// Modal Operations
function openAddModal() {
    jobForm.reset();
    jobModal.classList.add('show');
}

function closeModal() {
    jobModal.classList.remove('show');
}

function saveJob() {
    const title = document.getElementById('form-job-title').value.trim();
    const company = document.getElementById('form-job-company').value.trim();
    const description = document.getElementById('form-job-desc').value.trim();
    const location = document.getElementById('form-job-loc').value.trim();
    const department = document.getElementById('form-job-dept').value;
    const salary = document.getElementById('form-job-salary').value.trim();
    const experienceRequired = document.getElementById('form-job-exp').value.trim();

    const nextId = jobsList.length ? Math.max(...jobsList.map(j => j.id)) + 1 : 1;
    const newJob = {
        id: nextId,
        title, company, description, location, salary, experienceRequired, department,
        appliedCount: 0,
        appliedUsers: []
    };
    
    jobsList.push(newJob);
    db.setJobs(jobsList);
    
    showToast('New job opportunity posted successfully!', 'success');
    closeModal();
    initJobsPage();
}

window.handleDelete = function(id) {
    const jb = jobsList.find(j => j.id === id);
    if (!jb) return;

    if (confirm(`Are you sure you want to delete this job opening: "${jb.title}" at ${jb.company}?`)) {
        jobsList = jobsList.filter(j => j.id !== id);
        db.setJobs(jobsList);
        showToast('Job posting removed.', 'info');
        initJobsPage();
    }
};
