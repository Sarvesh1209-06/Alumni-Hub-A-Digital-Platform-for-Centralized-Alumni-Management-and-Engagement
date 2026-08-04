// Profile controller for rendering detailed alumni portfolios and managing inline edits.
let currentAlumniId = null;
let currentAlumni = null;
let currentAlumniList = [];
let editPhotoBase64 = '';

// Mode toggles
let isEditMode = false;

// DOM View elements
const viewPhoto = document.getElementById('view-photo');
const viewName = document.getElementById('view-name');
const viewTitle = document.getElementById('view-title');
const viewBadge = document.getElementById('view-badge');
const viewLinkLinkedin = document.getElementById('view-link-linkedin');
const viewLinkEmail = document.getElementById('view-link-email');
const viewLinkPhone = document.getElementById('view-link-phone');

const viewReg = document.getElementById('view-reg');
const viewDept = document.getElementById('view-dept');
const viewBatch = document.getElementById('view-batch');
const viewGender = document.getElementById('view-gender');

const viewCompany = document.getElementById('view-company');
const viewDesignation = document.getElementById('view-designation');
const viewExp = document.getElementById('view-exp');
const viewSalary = document.getElementById('view-salary');

const viewCity = document.getElementById('view-city');
const viewStateCountry = document.getElementById('view-state-country');
const viewSkillsTags = document.getElementById('view-skills-tags');
const panelExtraInfo = document.getElementById('panel-extra-info');

// DOM Edit Form elements
const panelViewMode = document.getElementById('panel-view-mode');
const panelEditMode = document.getElementById('panel-edit-mode');
const btnToggleEdit = document.getElementById('btn-toggle-edit');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const profileEditForm = document.getElementById('profile-edit-form');
const editPhotoUpload = document.getElementById('edit-photo-upload');
const editPhotoPreview = document.getElementById('edit-photo-preview');

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        initProfilePage();
    }, 120);
});

function initProfilePage() {
    currentAlumniList = db.getAlumni();
    
    // Parse URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    
    if (isNaN(id)) {
        // Fallback to first alumni record if ID not present or invalid
        if (currentAlumniList.length) {
            currentAlumniId = currentAlumniList[0].id;
        } else {
            showToast('No alumni records in database.', 'error');
            return;
        }
    } else {
        currentAlumniId = id;
    }
    
    currentAlumni = currentAlumniList.find(a => a.id === currentAlumniId);
    
    if (!currentAlumni) {
        showToast('Alumni profile not found.', 'error');
        // Redirect to directory
        setTimeout(() => {
            window.location.href = 'alumni.html';
        }, 1500);
        return;
    }
    
    renderProfileView();
    setupEventHandlers();
}

function renderProfileView() {
    // Check permission to show/hide Edit button
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    const mappedAlumniId = getAlumniIdForUser(currentUser);
    const isOwnProfile = mappedAlumniId === currentAlumni.id;

    if (isAdmin || isOwnProfile) {
        if (btnToggleEdit) btnToggleEdit.style.display = 'inline-flex';
        const oldBadge = document.getElementById('view-only-badge');
        if (oldBadge) oldBadge.remove();
    } else {
        if (btnToggleEdit) btnToggleEdit.style.display = 'none';
        
        // Show View Only badge
        const detailsCard = document.querySelector('.profile-details-card');
        let viewOnlyBadge = document.getElementById('view-only-badge');
        if (!viewOnlyBadge && detailsCard) {
            viewOnlyBadge = document.createElement('div');
            viewOnlyBadge.id = 'view-only-badge';
            viewOnlyBadge.style.cssText = 'background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 12px; font-size: 0.85rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 20px; display: flex; align-items: center; gap: 8px;';
            viewOnlyBadge.innerHTML = '<i class="fas fa-lock" style="color: var(--secondary-color);"></i> View Only Mode';
            detailsCard.insertBefore(viewOnlyBadge, detailsCard.firstChild);
        }
    }

    // 1. Sidebar Summary Card
    viewPhoto.src = currentAlumni.photo;
    viewName.textContent = currentAlumni.name;
    
    const companyText = currentAlumni.company && currentAlumni.company !== "Higher Education" ? ` at ${currentAlumni.company}` : '';
    viewTitle.textContent = currentAlumni.designation ? `${currentAlumni.designation}${companyText}` : 'Alumnus';
    
    // Status Badge check
    let badgeHtml = '<span class="badge badge-unplaced">Unplaced</span>';
    if (currentAlumni.entrepreneur) {
        badgeHtml = '<span class="badge badge-founder">Founder</span>';
    } else if (currentAlumni.higherStudies) {
        badgeHtml = '<span class="badge badge-study">Higher Studies</span>';
    } else if (currentAlumni.company && currentAlumni.company !== "Higher Education") {
        badgeHtml = '<span class="badge badge-placed">Placed</span>';
    }
    viewBadge.innerHTML = badgeHtml;

    // Social Links
    viewLinkLinkedin.href = currentAlumni.linkedin || '#';
    viewLinkEmail.href = `mailto:${currentAlumni.email}`;
    viewLinkPhone.href = currentAlumni.phone ? `tel:${currentAlumni.phone}` : '#';
    
    if (!currentAlumni.linkedin) viewLinkLinkedin.style.opacity = '0.4';
    if (!currentAlumni.phone) viewLinkPhone.style.opacity = '0.4';

    // 2. Academic Info
    viewReg.textContent = currentAlumni.registerNumber;
    viewDept.textContent = currentAlumni.department;
    viewBatch.textContent = currentAlumni.batch;
    viewGender.textContent = currentAlumni.gender || 'N/A';

    // 3. Career Info
    viewCompany.textContent = currentAlumni.company || 'N/A';
    viewDesignation.textContent = currentAlumni.designation || 'N/A';
    viewExp.textContent = `${currentAlumni.experience} Years`;
    
    // Formatting Salary to Lakhs format (Indian numbering system)
    viewSalary.textContent = currentAlumni.salary ? `₹${currentAlumni.salary.toLocaleString('en-IN')} / Annum` : 'N/A';

    // 4. Location
    viewCity.textContent = currentAlumni.city || 'N/A';
    const stateVal = currentAlumni.state ? `${currentAlumni.state}, ` : '';
    viewStateCountry.textContent = `${stateVal}${currentAlumni.country || 'N/A'}`;

    // 5. Skills Tags
    viewSkillsTags.innerHTML = '';
    if (Array.isArray(currentAlumni.skills) && currentAlumni.skills.length) {
        currentAlumni.skills.forEach(s => {
            const span = document.createElement('span');
            span.className = 'skill-tag';
            span.textContent = s;
            viewSkillsTags.appendChild(span);
        });
    } else {
        viewSkillsTags.innerHTML = '<span style="font-size: 0.9rem; color: var(--text-secondary); font-style: italic;">No skills specified</span>';
    }

    // 6. Extra Fields
    panelExtraInfo.innerHTML = '';
    if (currentAlumni.higherStudies) {
        panelExtraInfo.innerHTML += `
            <h3 class="details-section-title"><i class="fas fa-university"></i> Postgraduate Education</h3>
            <div style="background: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 16px; border: 1px solid var(--border-color); margin-bottom: 20px;">
                <div class="info-label">Program & University</div>
                <div class="info-value mt-2">${currentAlumni.higherStudies}</div>
            </div>
        `;
    }
    
    if (currentAlumni.entrepreneur) {
        panelExtraInfo.innerHTML += `
            <h3 class="details-section-title"><i class="fas fa-rocket"></i> Startup Venture</h3>
            <div style="background: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 16px; border: 1px solid var(--border-color);">
                <div class="info-label">Founding Role & Company</div>
                <div class="info-value mt-2">${currentAlumni.entrepreneur}</div>
            </div>
        `;
    }
}

function setupEventHandlers() {
    // Toggle Mode
    btnToggleEdit.addEventListener('click', () => {
        if (isEditMode) {
            cancelEdit();
        } else {
            enterEditMode();
        }
    });

    btnCancelEdit.addEventListener('click', cancelEdit);

    // Form Photo preview
    editPhotoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            editPhotoBase64 = evt.target.result;
            editPhotoPreview.src = editPhotoBase64;
        };
        reader.readAsDataURL(file);
    });

    // Form Submit
    profileEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProfileChanges();
    });
}

function enterEditMode() {
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    const mappedAlumniId = getAlumniIdForUser(currentUser);
    const isOwnProfile = mappedAlumniId === currentAlumni.id;

    if (!isAdmin && !isOwnProfile) {
        showToast('Access denied: You do not have permission to edit this profile.', 'error');
        return;
    }

    isEditMode = true;
    btnToggleEdit.innerHTML = '<i class="fas fa-eye"></i> View Portfolio';
    panelViewMode.style.display = 'none';
    panelEditMode.style.display = 'block';

    // Populate input values
    document.getElementById('edit-name').value = currentAlumni.name;
    document.getElementById('edit-email').value = currentAlumni.email;
    document.getElementById('edit-phone').value = currentAlumni.phone || '';
    document.getElementById('edit-linkedin').value = currentAlumni.linkedin || '';
    document.getElementById('edit-company').value = currentAlumni.company || '';
    document.getElementById('edit-designation').value = currentAlumni.designation || '';
    document.getElementById('edit-experience').value = currentAlumni.experience || 0;
    document.getElementById('edit-salary').value = currentAlumni.salary || '';
    document.getElementById('edit-gender').value = currentAlumni.gender || 'Male';
    document.getElementById('edit-city').value = currentAlumni.city || '';
    document.getElementById('edit-state').value = currentAlumni.state || '';
    document.getElementById('edit-country').value = currentAlumni.country || '';
    document.getElementById('edit-skills').value = Array.isArray(currentAlumni.skills) ? currentAlumni.skills.join(', ') : (currentAlumni.skills || '');
    document.getElementById('edit-studies').value = currentAlumni.higherStudies || '';
    document.getElementById('edit-entrepreneur').value = currentAlumni.entrepreneur || '';
    
    editPhotoBase64 = currentAlumni.photo;
    editPhotoPreview.src = editPhotoBase64;
}

function cancelEdit() {
    isEditMode = false;
    btnToggleEdit.innerHTML = '<i class="fas fa-edit"></i> Edit Portfolio';
    panelViewMode.style.display = 'block';
    panelEditMode.style.display = 'none';
}

function saveProfileChanges() {
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    const mappedAlumniId = getAlumniIdForUser(currentUser);
    const isOwnProfile = mappedAlumniId === currentAlumni.id;

    if (!isAdmin && !isOwnProfile) {
        showToast('Access denied: You do not have permission to edit this profile.', 'error');
        return;
    }

    const name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const linkedin = document.getElementById('edit-linkedin').value.trim();
    const company = document.getElementById('edit-company').value.trim();
    const designation = document.getElementById('edit-designation').value.trim();
    const experience = parseInt(document.getElementById('edit-experience').value) || 0;
    const salary = parseInt(document.getElementById('edit-salary').value) || 0;
    const gender = document.getElementById('edit-gender').value;
    const city = document.getElementById('edit-city').value.trim();
    const state = document.getElementById('edit-state').value.trim();
    const country = document.getElementById('edit-country').value.trim();
    
    const skillsInput = document.getElementById('edit-skills').value;
    const skills = skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(s => s) : [];
    
    const studies = document.getElementById('edit-studies').value.trim();
    const entrepreneur = document.getElementById('edit-entrepreneur').value.trim();

    // Map changes
    currentAlumni.name = name;
    currentAlumni.email = email;
    currentAlumni.phone = phone;
    currentAlumni.linkedin = linkedin;
    currentAlumni.company = company;
    currentAlumni.designation = designation;
    currentAlumni.experience = experience;
    currentAlumni.salary = salary;
    currentAlumni.gender = gender;
    currentAlumni.city = city;
    currentAlumni.state = state;
    currentAlumni.country = country;
    currentAlumni.skills = skills;
    currentAlumni.higherStudies = studies;
    currentAlumni.entrepreneur = entrepreneur;
    currentAlumni.photo = editPhotoBase64;

    // Update in database array
    const index = currentAlumniList.findIndex(a => a.id === currentAlumniId);
    if (index !== -1) {
        currentAlumniList[index] = currentAlumni;
        // Send update to backend API
        fetch(`https://alumni-hub-a-digital-platform-for.onrender.com/api/alumni/${currentAlumniId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentAlumni)
        }).then(res => res.json()).then(resp => {
            if (resp && resp.success) {
                // Refresh local cache from server
                fetch('https://alumni-hub-a-digital-platform-for.onrender.com/api/alumni').then(r => r.json()).then(all => {
                    if (Array.isArray(all)) db.setAlumni(all);
                }).catch(() => {});

                showToast('Portfolio changes saved successfully!', 'success');
                // Return to view mode
                cancelEdit();
                renderProfileView();
            } else {
                showToast('Could not save changes to server.', 'error');
            }
        }).catch(err => {
            console.error('Save profile error:', err);
            showToast('Network error. Could not save changes.', 'error');
        });
    } else {
        showToast('Database error. Could not update record.', 'error');
    }
}
