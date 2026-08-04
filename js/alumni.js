// Alumni management data controller, sorting, filters, export/import, and CRUD
let alumniList = [];
let filteredList = [];

// State variables
let currentPage = 1;
const rowsPerPage = 10;
let sortColumn = 'name';
let sortDirection = 'asc';
let photoPreviewUrl = '';

// Dom elements
const tbody = document.getElementById('alumni-tbody');
const searchInput = document.getElementById('search-input');
const filterDept = document.getElementById('filter-dept');
const filterBatch = document.getElementById('filter-batch');
const filterCompany = document.getElementById('filter-company');
const filterSalary = document.getElementById('filter-salary');
const filterLocation = document.getElementById('filter-location');
const btnResetFilters = document.getElementById('btn-reset-filters');
const btnAddAlumni = document.getElementById('btn-add-alumni');
const btnExportExcel = document.getElementById('btn-export-excel');
const inputImportJson = document.getElementById('input-import-json');

// Modal Elements
const modal = document.getElementById('alumni-modal');
const modalTitle = document.getElementById('modal-title');
const modalCloseBtn = document.getElementById('modal-close-btn');
const alumniForm = document.getElementById('alumni-form');
const formCancelBtn = document.getElementById('form-cancel-btn');
const formPhotoUpload = document.getElementById('form-photo-upload');
const formPhotoPreview = document.getElementById('form-photo-preview');

// Available Departments for selection
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
    // Wait slightly to ensure DB is initialized
    setTimeout(() => {
        loadData();
        setupFilters();
        setupSorting();
        setupModal();
        setupPhotoUpload();
        
        // Handle incoming action from dashboard quick links
        const params = new URLSearchParams(window.location.search);
        const currentUser = getCurrentUser();
        if (params.get('action') === 'add' && currentUser && currentUser.role === 'admin') {
            openAddModal();
        }
    }, 120);
});

function loadData() {
    alumniList = db.getAlumni();
    filteredList = [...alumniList];
    
    // Check role and hide Admin actions
    const currentUser = getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';
    if (!isAdmin) {
        const btnAdd = document.getElementById('btn-add-alumni');
        if (btnAdd) btnAdd.style.display = 'none';
        const importLabel = document.querySelector('label[for="input-import-json"]');
        if (importLabel) importLabel.style.display = 'none';
    }
    
    // Load dropdown selections
    populateFilterDropdowns();
    
    applyFilters();
}

function populateFilterDropdowns() {
    // 1. Departments
    filterDept.innerHTML = '<option value="">All Departments</option>';
    DEPARTMENTS.forEach(d => {
        filterDept.innerHTML += `<option value="${d}">${d}</option>`;
    });
    
    // Populate form department too
    const formDept = document.getElementById('form-dept');
    if (formDept) {
        formDept.innerHTML = '';
        DEPARTMENTS.forEach(d => {
            formDept.innerHTML += `<option value="${d}">${d}</option>`;
        });
    }

    // 2. Batches (Unique sorted descending)
    const batches = [...new Set(alumniList.map(a => a.batch))].sort((a, b) => b - a);
    filterBatch.innerHTML = '<option value="">All Batches</option>';
    batches.forEach(b => {
        filterBatch.innerHTML += `<option value="${b}">${b}</option>`;
    });

    // 3. Companies (Unique sorted alphabetically)
    const companies = [...new Set(alumniList.map(a => a.company).filter(c => c && c !== "Higher Education"))].sort();
    filterCompany.innerHTML = '<option value="">All Companies</option>';
    companies.forEach(c => {
        filterCompany.innerHTML += `<option value="${c}">${c}</option>`;
    });

    // 4. Cities (Locations unique sorted alphabetically)
    const locations = [...new Set(alumniList.map(a => a.city).filter(c => c))].sort();
    filterLocation.innerHTML = '<option value="">All Cities</option>';
    locations.forEach(l => {
        filterLocation.innerHTML += `<option value="${l}">${l}</option>`;
    });
}

function setupFilters() {
    const triggerFilter = () => {
        currentPage = 1;
        applyFilters();
    };

    searchInput.addEventListener('input', triggerFilter);
    filterDept.addEventListener('change', triggerFilter);
    filterBatch.addEventListener('change', triggerFilter);
    filterCompany.addEventListener('change', triggerFilter);
    filterSalary.addEventListener('change', triggerFilter);
    filterLocation.addEventListener('change', triggerFilter);

    btnResetFilters.addEventListener('click', () => {
        searchInput.value = '';
        filterDept.value = '';
        filterBatch.value = '';
        filterCompany.value = '';
        filterSalary.value = '';
        filterLocation.value = '';
        triggerFilter();
        showToast('Filters reset successfully', 'info');
    });
    
    // Import JSON handler
    inputImportJson.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const imported = JSON.parse(evt.target.result);
                if (Array.isArray(imported)) {
                    // Simple validator
                    const valid = imported.every(x => x.name && x.registerNumber && x.department && x.batch);
                    if (!valid) {
                        showToast('Invalid format. Missing required fields (name, registerNumber, department, batch)', 'error');
                        return;
                    }
                    
                    // Assign fresh IDs and merge
                    const maxId = alumniList.length ? Math.max(...alumniList.map(a => a.id)) : 0;
                    const mapped = imported.map((al, idx) => ({
                        ...al,
                        id: maxId + idx + 1,
                        photo: al.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${al.name.replace(/\s+/g, '')}`
                    }));
                    
                    alumniList = [...alumniList, ...mapped];
                    db.setAlumni(alumniList);
                    showToast(`Successfully imported ${mapped.length} records!`, 'success');
                    loadData();
                } else {
                    showToast('Imported file must be a JSON array.', 'error');
                }
            } catch(err) {
                showToast('Failed to parse JSON file.', 'error');
            }
        };
        reader.readAsText(file);
        // Clear input so same file can be loaded again
        inputImportJson.value = '';
    });

    // Excel Exporter sheet handler
    btnExportExcel.addEventListener('click', () => {
        if (!filteredList.length) {
            showToast('No records matching filters to export.', 'error');
            return;
        }
        
        // Clean array for export (remove complex fields)
        const exportData = filteredList.map(a => ({
            "Register Number": a.registerNumber,
            "Name": a.name,
            "Gender": a.gender,
            "Department": a.department,
            "Batch": a.batch,
            "Email": a.email,
            "Phone": a.phone,
            "Company": a.company,
            "Designation": a.designation,
            "Salary (INR)": a.salary,
            "Experience (Yrs)": a.experience,
            "City": a.city,
            "State": a.state,
            "Country": a.country,
            "LinkedIn": a.linkedin,
            "Skills": Array.isArray(a.skills) ? a.skills.join(', ') : a.skills,
            "Higher Studies": a.higherStudies,
            "Entrepreneur Status": a.entrepreneur
        }));

        try {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Alumni Directory");
            XLSX.writeFile(wb, "Alumni_Directory_Export.xlsx");
            showToast('Alumni directory exported to Excel!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Excel export failed.', 'error');
        }
    });
}

function applyFilters() {
    const q = searchInput.value.toLowerCase().trim();
    const dVal = filterDept.value;
    const bVal = filterBatch.value ? parseInt(filterBatch.value) : '';
    const cVal = filterCompany.value;
    const sVal = filterSalary.value;
    const lVal = filterLocation.value;

    filteredList = alumniList.filter(al => {
        // 1. Search Query
        const matchSearch = !q || 
            al.name.toLowerCase().includes(q) ||
            al.registerNumber.toLowerCase().includes(q) ||
            (al.company && al.company.toLowerCase().includes(q)) ||
            al.department.toLowerCase().includes(q) ||
            al.batch.toString().includes(q);
            
        // 2. Department
        const matchDept = !dVal || al.department === dVal;
        
        // 3. Batch
        const matchBatch = !bVal || al.batch === bVal;
        
        // 4. Company
        const matchCompany = !cVal || al.company === cVal;
        
        // 5. Salary range
        let matchSalary = true;
        if (sVal === 'under-5') matchSalary = al.salary < 500000;
        else if (sVal === '5-12') matchSalary = al.salary >= 500000 && al.salary <= 1200000;
        else if (sVal === '12-25') matchSalary = al.salary > 1200000 && al.salary <= 2500000;
        else if (sVal === 'over-25') matchSalary = al.salary > 2500000;

        // 6. Location
        const matchLocation = !lVal || al.city === lVal;

        return matchSearch && matchDept && matchBatch && matchCompany && matchSalary && matchLocation;
    });

    applySorting();
}

function setupSorting() {
    const headers = document.querySelectorAll('#alumni-table th[data-sort]');
    headers.forEach(h => {
        h.addEventListener('click', () => {
            const col = h.getAttribute('data-sort');
            if (sortColumn === col) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = col;
                sortDirection = 'asc';
            }
            
            // Highlight sort headers
            headers.forEach(header => {
                header.classList.remove('sorted-asc', 'sorted-desc');
            });
            h.classList.add(sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
            
            applySorting();
        });
    });
}

function applySorting() {
    filteredList.sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];
        
        // Handle numeric parsing
        if (sortColumn === 'batch' || sortColumn === 'salary' || sortColumn === 'experience') {
            valA = Number(valA) || 0;
            valB = Number(valB) || 0;
        } else {
            valA = (valA || '').toString().toLowerCase();
            valB = (valB || '').toString().toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable();
}

function renderTable() {
    tbody.innerHTML = '';
    
    const totalCount = filteredList.length;
    document.getElementById('pag-total').textContent = totalCount;

    if (totalCount === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No alumni records found.</td></tr>';
        document.getElementById('pag-start').textContent = 0;
        document.getElementById('pag-end').textContent = 0;
        renderPagination(0);
        return;
    }

    // Pagination bounds calculations
    const totalPages = Math.ceil(totalCount / rowsPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalCount);

    document.getElementById('pag-start').textContent = startIndex + 1;
    document.getElementById('pag-end').textContent = endIndex;

    const displayedAlumni = filteredList.slice(startIndex, endIndex);

    displayedAlumni.forEach(al => {
        const tr = document.createElement('tr');
        
        // Status Badge check
        let statusBadge = '<span class="badge badge-unplaced">Unplaced</span>';
        if (al.entrepreneur) {
            statusBadge = '<span class="badge badge-founder">Founder</span>';
        } else if (al.higherStudies) {
            statusBadge = '<span class="badge badge-study">Higher Studies</span>';
        } else if (al.company && al.company !== "Higher Education") {
            statusBadge = '<span class="badge badge-placed">Placed</span>';
        }

        const currentUser = getCurrentUser();
        const isAdmin = currentUser && currentUser.role === 'admin';
        
        let actionButtons = '';
        if (isAdmin) {
            actionButtons = `
                <div class="action-buttons">
                    <a href="profile.html?id=${al.id}" class="btn-action btn-view" title="View Profile">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button class="btn-action btn-edit" onclick="openEditModal(${al.id})" title="Edit Details">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="handleDelete(${al.id})" title="Delete Record">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
        } else {
            actionButtons = `
                <div class="action-buttons">
                    <a href="profile.html?id=${al.id}" class="btn btn-secondary btn-action" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 4px 10px;" title="View Profile">
                        <i class="fas fa-eye"></i> View Profile
                    </a>
                </div>
            `;
        }

        tr.innerHTML = `
            <td>
                <div class="user-cell">
                    <img src="${al.photo}" alt="Avatar" class="user-avatar-sm">
                    <div class="user-name-cell">
                        <span class="user-name-bold">${al.name}</span>
                        ${statusBadge}
                    </div>
                </div>
            </td>
            <td>${al.registerNumber}</td>
            <td title="${al.department}">${al.department.includes("Computer") ? "CSE" : (al.department.includes("Information") ? "IT" : (al.department.includes("Communication") ? "ECE" : "ENG"))}</td>
            <td>${al.batch}</td>
            <td>${al.company || 'N/A'}</td>
            <td>${al.salary ? `₹${(al.salary/100000).toFixed(1)}L` : 'N/A'}</td>
            <td>${al.experience} Yrs</td>
            <td>${al.city}</td>
            <td>
                ${actionButtons}
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const prevBtn = document.getElementById('pag-prev');
    const nextBtn = document.getElementById('pag-next');
    const pagesContainer = document.getElementById('pag-pages');

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    pagesContainer.innerHTML = '';
    
    // Show maximum of 5 page buttons
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => {
            currentPage = i;
            renderTable();
        });
        pagesContainer.appendChild(btn);
    }

    // Remap next/prev actions
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    };

    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    };
}

// Photo uploading preview helper (converts to base64)
function setupPhotoUpload() {
    if (formPhotoUpload) {
        formPhotoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                photoPreviewUrl = evt.target.result;
                formPhotoPreview.src = photoPreviewUrl;
            };
            reader.readAsDataURL(file);
        });
    }
}

// Modal actions
function setupModal() {
    btnAddAlumni.addEventListener('click', openAddModal);
    modalCloseBtn.addEventListener('click', closeModal);
    formCancelBtn.addEventListener('click', closeModal);
    
    // Close modal on click outside content
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    alumniForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveAlumni();
    });
}

function openAddModal() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Access denied: Admin credentials required.', 'error');
        return;
    }
    
    currentEditingAlumni = null;
    modalTitle.textContent = "Add New Alumnus";
    alumniForm.reset();
    
    // Reset photo preview to base placeholder
    photoPreviewUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=preview_${Date.now()}`;
    formPhotoPreview.src = photoPreviewUrl;
    
    document.getElementById('alumni-id').value = '';
    modal.classList.add('show');
}

window.openEditModal = function(id) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Access denied: Admin credentials required.', 'error');
        return;
    }

    const al = alumniList.find(a => a.id === id);
    if (!al) return;

    currentEditingAlumni = al;
    modalTitle.textContent = `Edit Details - ${al.name}`;
    
    document.getElementById('alumni-id').value = al.id;
    document.getElementById('form-name').value = al.name;
    document.getElementById('form-reg').value = al.registerNumber;
    document.getElementById('form-gender').value = al.gender || 'Male';
    document.getElementById('form-dept').value = al.department;
    document.getElementById('form-batch').value = al.batch;
    document.getElementById('form-experience').value = al.experience || 0;
    document.getElementById('form-email').value = al.email;
    document.getElementById('form-phone').value = al.phone || '';
    document.getElementById('form-company').value = al.company || '';
    document.getElementById('form-designation').value = al.designation || '';
    document.getElementById('form-salary').value = al.salary || '';
    document.getElementById('form-city').value = al.city || '';
    document.getElementById('form-state').value = al.state || '';
    document.getElementById('form-country').value = al.country || '';
    document.getElementById('form-linkedin').value = al.linkedin || '';
    document.getElementById('form-skills').value = Array.isArray(al.skills) ? al.skills.join(', ') : (al.skills || '');
    document.getElementById('form-studies').value = al.higherStudies || '';
    document.getElementById('form-entrepreneur').value = al.entrepreneur || '';
    
    photoPreviewUrl = al.photo;
    formPhotoPreview.src = photoPreviewUrl;
    
    modal.classList.add('show');
};

function closeModal() {
    modal.classList.remove('show');
}

function saveAlumni() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Access denied: Admin credentials required.', 'error');
        return;
    }

    const idVal = document.getElementById('alumni-id').value;
    
    const name = document.getElementById('form-name').value.trim();
    const reg = document.getElementById('form-reg').value.trim();
    const gender = document.getElementById('form-gender').value;
    const dept = document.getElementById('form-dept').value;
    const batch = parseInt(document.getElementById('form-batch').value);
    const experience = parseInt(document.getElementById('form-experience').value) || 0;
    const email = document.getElementById('form-email').value.trim();
    const phone = document.getElementById('form-phone').value.trim();
    const company = document.getElementById('form-company').value.trim();
    const designation = document.getElementById('form-designation').value.trim();
    const salary = parseInt(document.getElementById('form-salary').value) || 0;
    const city = document.getElementById('form-city').value.trim();
    const state = document.getElementById('form-state').value.trim();
    const country = document.getElementById('form-country').value.trim();
    const linkedin = document.getElementById('form-linkedin').value.trim();
    
    const skillsInput = document.getElementById('form-skills').value;
    const skills = skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(s => s) : [];
    
    const studies = document.getElementById('form-studies').value.trim();
    const entrepreneur = document.getElementById('form-entrepreneur').value.trim();

    if (idVal) {
        // EDIT mode — update in local list
        const index = alumniList.findIndex(a => a.id === parseInt(idVal));
        if (index !== -1) {
            alumniList[index] = {
                ...alumniList[index],
                name, registerNumber: reg, gender, department: dept, batch, experience,
                email, phone, company, designation, salary, city, state, country,
                linkedin, skills, higherStudies: studies, entrepreneur, photo: photoPreviewUrl
            };

            // ── Sync to backend server (PUT request) ──
            fetch(`https://alumni-hub-a-digital-platform-for.onrender.com/api/alumni/${parseInt(idVal)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alumniList[index])
            }).then(r => r.json()).then(data => {
                if (data.success) console.log('Alumni updated on server.');
                else console.warn('Server update failed:', data.message);
            }).catch(err => console.warn('Could not sync update to server:', err));

            showToast('Alumni record updated successfully!', 'success');
        }
    } else {
        // ADD mode — create new record
        const nextId = alumniList.length ? Math.max(...alumniList.map(a => a.id)) + 1 : 1;
        const newAlumnus = {
            id: nextId,
            name, registerNumber: reg, gender, department: dept, batch, experience,
            email, phone, company, designation, salary, city, state, country,
            linkedin, skills, higherStudies: studies, entrepreneur,
            photo: photoPreviewUrl.includes('preview_') ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s+/g, '')}` : photoPreviewUrl
        };
        alumniList.push(newAlumnus);

        // ── Sync to backend server (POST request) ──
       fetch('https://alumni-hub-a-digital-platform-for.onrender.com/api/alumni', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAlumnus)
        }).then(r => r.json()).then(data => {
            if (data.success) console.log('New alumni saved to server.');
            else console.warn('Server save failed:', data.message);
        }).catch(err => console.warn('Could not sync to server:', err));

        showToast('New alumnus record added successfully!', 'success');
    }

    db.setAlumni(alumniList);
    closeModal();
    loadData();
}

window.handleDelete = function(id) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        showToast('Access denied: Admin credentials required.', 'error');
        return;
    }

    const al = alumniList.find(a => a.id === id);
    if (!al) return;

    if (confirm(`Are you sure you want to permanently delete the profile of ${al.name}?`)) {
        alumniList = alumniList.filter(a => a.id !== id);
        db.setAlumni(alumniList);

        // ── Sync delete to backend server ──
        fetch(`https://alumni-hub-a-digital-platform-for.onrender.com/api/alumni/${id}`, { method: 'DELETE' })
            .then(r => r.json())
            .then(data => console.log('Delete synced to server:', data.message))
            .catch(err => console.warn('Could not sync delete to server:', err));

        showToast('Alumni record deleted successfully.', 'info');
        loadData();
    }
};
