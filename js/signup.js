// =====================================================
// js/signup.js — Multi-Step Registration Form Controller
// =====================================================
// Controls the 5-step registration form.
// On final submit, sends all data to the backend API.
// =====================================================

// ── State ──────────────────────────────────────────
let currentStep = 1;
const TOTAL_STEPS = 5;
let isStudentMode = false; // true when 'Student' role selected — shows only step 1

// ── On page load ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Setup photo preview
    const photoInput   = document.getElementById('photo');
    const photoPreview = document.getElementById('photo-preview');
    const photoArea    = document.getElementById('photo-drop-area');

    if (photoInput && photoPreview) {
        // Open file picker when clicking the photo area
        photoArea.addEventListener('click', () => photoInput.click());

        // Show preview when a file is selected
        photoInput.addEventListener('change', () => {
            const file = photoInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => { photoPreview.src = e.target.result; };
                reader.readAsDataURL(file);
            }
        });
    }

    // Setup resume upload label update
    const resumeInput = document.getElementById('resume');
    const resumeLabel = document.getElementById('resume-label');
    const resumeArea  = document.getElementById('resume-area');

    if (resumeInput && resumeLabel) {
        resumeArea.addEventListener('click', () => resumeInput.click());
        resumeInput.addEventListener('change', () => {
            if (resumeInput.files[0]) {
                resumeLabel.textContent = resumeInput.files[0].name;
            }
        });
    }

    // Handle form submit
    const form = document.getElementById('signup-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    // Role radio change handling — show only step1 for Students
    document.querySelectorAll('input[name="role"]').forEach(r => {
        r.addEventListener('change', () => {
            const role = document.querySelector('input[name="role"]:checked')?.value || 'Student';
            isStudentMode = (role === 'Student');
            // Reset to step 1 when switching
            currentStep = 1;
            applyRoleUI();
            updateProgress();
        });
    });

    // Apply initial role UI state (page default)
    const initialRole = document.querySelector('input[name="role"]:checked')?.value || 'Student';
    isStudentMode = (initialRole === 'Student');
    applyRoleUI();

    // If returning from initial alumni registration, allow continuing profile
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('completeProfile') === '1' && urlParams.get('userId')) {
        const hid = document.getElementById('registeredUserId');
        if (hid) hid.value = urlParams.get('userId');
        // Ensure role is set to Alumni when continuing profile
        const alumniRadio = document.querySelector('input[name="role"][value="Alumni"]');
        if (alumniRadio) {
            alumniRadio.checked = true;
            isStudentMode = false;
            applyRoleUI();
        }
        // Start from step 2 (personal info)
        currentStep = 2;
        showStep(currentStep);
        updateProgress();
    }

    // Update progress bar to initial state
    updateProgress();
});

// ── Toggle password visibility ──────────────────────
function togglePassword(fieldId) {
    const input = document.getElementById(fieldId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

// ── Update progress bar and step dots ──────────────
function updateProgress() {
    // Fill the progress track
    const fill = document.getElementById('step-fill');
    if (fill) {
        fill.style.width = `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%`;
    }

    // Update each step dot's state
    document.querySelectorAll('.step-dot').forEach(dot => {
        const dotStep = parseInt(dot.dataset.step);
        dot.classList.remove('active', 'completed');
        if (dotStep === currentStep) dot.classList.add('active');
        if (dotStep < currentStep)  dot.classList.add('completed');
    });

    // Show/hide navigation buttons
    const btnPrev   = document.getElementById('btn-prev');
    const btnNext   = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');

    // If student mode, only show submit on step 1 and hide next/prev
    if (isStudentMode) {
        if (btnPrev) btnPrev.style.display = 'none';
        if (btnNext) btnNext.style.display = 'none';
        if (btnSubmit) btnSubmit.style.display = currentStep === 1 ? 'inline-flex' : 'none';
        return;
    }

    if (btnPrev)   btnPrev.style.display   = currentStep > 1           ? 'inline-flex' : 'none';
    if (btnNext)   btnNext.style.display   = currentStep < TOTAL_STEPS ? 'inline-flex' : 'none';
    if (btnSubmit) btnSubmit.style.display = currentStep === TOTAL_STEPS ? 'inline-flex' : 'none';
}

// Show/hide form steps & step-dots based on selected role
function applyRoleUI() {
    if (isStudentMode) {
        // Only keep step-1 visible
        document.querySelectorAll('.form-step').forEach((el) => {
            if (el.id === 'step-1') el.classList.add('active'); else el.classList.remove('active');
        });
        // Collapse step dots to show only first
        document.querySelectorAll('.step-dot').forEach(d => {
            if (d.dataset.step === '1') d.style.display = 'flex'; else d.style.display = 'none';
        });
    } else {
        // Restore multi-step view
        document.querySelectorAll('.step-dot').forEach(d => d.style.display = 'flex');
        showStep(currentStep);
    }
}

// ── Show a specific step ────────────────────────────
function showStep(step) {
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`step-${step}`);
    if (target) target.classList.add('active');
}

// ── Validate the current step's required fields ─────
function validateCurrentStep() {
    const stepEl = document.getElementById(`step-${currentStep}`);
    if (!stepEl) return true;

    const requiredFields = stepEl.querySelectorAll('[required]');
    let valid = true;

    requiredFields.forEach(field => {
        field.style.borderColor = '';  // reset
        if (!field.value.trim()) {
            field.style.borderColor = 'var(--danger-color)';
            field.focus();
            valid = false;
        }
    });

    if (!valid) {
        showToast('Please fill in all required fields before continuing.', 'error');
    }

    // Extra check: passwords match on Step 1
    if (currentStep === 1) {
        const pw  = document.getElementById('password').value;
        const cpw = document.getElementById('confirm-password').value;
        if (pw && cpw && pw !== cpw) {
            document.getElementById('confirm-password').style.borderColor = 'var(--danger-color)';
            showToast('Passwords do not match.', 'error');
            return false;
        }
        if (pw && pw.length < 6) {
            document.getElementById('password').style.borderColor = 'var(--danger-color)';
            showToast('Password must be at least 6 characters.', 'error');
            return false;
        }
    }

    return valid;
}

// ── Go to next step ─────────────────────────────────
function nextStep() {
    if (!validateCurrentStep()) return;

    // Prevent navigation to next steps when Student mode (single-step)
    if (isStudentMode) return;

    // If on first step and role is Alumni, register the basic account first
    if (currentStep === 1) {
        const role = document.querySelector('input[name="role"]:checked')?.value || 'Alumni';
        if (role === 'Alumni') {
            registerBasicAccount().then(success => {
                if (success) {
                    currentStep++;
                    showStep(currentStep);
                    updateProgress();
                    document.querySelector('.signup-card').scrollIntoView({ behavior: 'smooth' });
                }
            });
            return;
        }
    }

    if (currentStep < TOTAL_STEPS) {
        currentStep++;
        showStep(currentStep);
        updateProgress();
        // Scroll to top of form
        document.querySelector('.signup-card').scrollIntoView({ behavior: 'smooth' });
    }
}


// Register only the basic account (used when role === 'Alumni' so profile can be completed later)
async function registerBasicAccount() {
    const submitBtn = document.getElementById('btn-next');
    const original = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('name', document.getElementById('name').value.trim());
        formData.append('email', document.getElementById('email').value.trim());
        formData.append('phone', document.getElementById('phone').value.trim());
        formData.append('password', document.getElementById('password').value);
        formData.append('role', 'Alumni');
        const photoInput = document.getElementById('photo');
        if (photoInput && photoInput.files[0]) formData.append('photo', photoInput.files[0]);

        const res = await fetch('https://alumni-hub-a-digital-platform-for.onrender.com/api/auth/register', {
    method: 'POST',
    body: formData
});
        const data = await res.json();
        if (data.success && data.user && data.user.id) {
            document.getElementById('registeredUserId').value = data.user.id;
            showToast('Account created. Please complete your alumni profile.', 'success');
            submitBtn.innerHTML = original;
            submitBtn.disabled = false;
            return true;
        } else {
            showToast(data.message || 'Could not create account.', 'error');
            submitBtn.innerHTML = original;
            submitBtn.disabled = false;
            return false;
        }
    } catch (err) {
        console.error('Account creation failed:', err);
        showToast('Cannot reach server. Try again later.', 'error');
        submitBtn.innerHTML = original;
        submitBtn.disabled = false;
        return false;
    }
}

// ── Go to previous step ─────────────────────────────
function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateProgress();
        document.querySelector('.signup-card').scrollIntoView({ behavior: 'smooth' });
    }
}

// ── Final form submission ───────────────────────────
async function handleSubmit(e) {
    e.preventDefault();

    if (!validateCurrentStep()) return;

    // Disable submit button and show loading
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    submitBtn.disabled = true;

    try {
        const role = document.querySelector('input[name="role"]:checked')?.value || 'Alumni';

        // Student: only register basic account and redirect to login
        if (role === 'Student') {
            const formData = new FormData();
            formData.append('name', document.getElementById('name').value.trim());
            formData.append('email', document.getElementById('email').value.trim());
            formData.append('phone', document.getElementById('phone').value.trim());
            formData.append('password', document.getElementById('password').value);
            formData.append('role', 'Student');
            const photoInput = document.getElementById('photo');
            if (photoInput && photoInput.files[0]) formData.append('photo', photoInput.files[0]);

            const res = await fetch('https://alumni-hub-a-digital-platform-for.onrender.com/api/auth/register', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                showToast('Registration successful! Redirecting to login...', 'success');
                setTimeout(() => { window.location.href = 'login.html'; }, 1200);
                return;
            } else {
                showToast(data.message || 'Registration failed. Please try again.', 'error');
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Complete Registration';
                submitBtn.disabled = false;
                return;
            }
        }

        // Alumni: final submit — collect profile fields and POST to /api/alumni
        const userId = document.getElementById('registeredUserId').value;
        if (!userId) {
            showToast('Missing registered user id. Please create account first (Step 1).', 'error');
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Complete Registration';
            submitBtn.disabled = false;
            return;
        }

        const profile = {
            userId: userId,
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            gender: document.getElementById('gender').value,
            dob: document.getElementById('dob').value,
            city: document.getElementById('city').value.trim(),
            country: document.getElementById('country').value.trim(),
            bio: document.getElementById('bio').value.trim(),
            department: document.getElementById('department').value,
            degree: document.getElementById('degree').value,
            specialization: document.getElementById('specialization').value.trim(),
            batch: parseInt(document.getElementById('batch').value) || new Date().getFullYear(),
            yearOfGraduation: parseInt(document.getElementById('yearOfGraduation').value) || new Date().getFullYear(),
            cgpa: document.getElementById('cgpa').value ? parseFloat(document.getElementById('cgpa').value) : null,
            employmentStatus: document.getElementById('employmentStatus').value,
            industry: document.getElementById('industry').value.trim(),
            company: document.getElementById('company').value.trim(),
            jobTitle: document.getElementById('jobTitle').value.trim(),
            experience: parseInt(document.getElementById('experience').value) || 0,
            workLocation: document.getElementById('workLocation').value.trim(),
            linkedin: document.getElementById('linkedin').value.trim(),
            portfolio: document.getElementById('portfolio').value.trim(),
            technicalSkills: document.getElementById('technicalSkills').value,
            softSkills: document.getElementById('softSkills').value,
            expertise: document.getElementById('expertise').value,
            certifications: document.getElementById('certifications').value,
            achievements: document.getElementById('achievements').value,
            socialLinks: document.getElementById('socialLinks').value,
            interestedMentoring: document.getElementById('interestedMentoring').checked,
            willingInternships: document.getElementById('willingInternships').checked,
            willingJobPostings: document.getElementById('willingJobPostings').checked,
            speakingEvents: document.getElementById('speakingEvents').checked
        };

        const res = await fetch('https://alumni-hub-a-digital-platform-for.onrender.com/api/alumni', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });

        const data = await res.json();

        if (data.success) {
            showToast('Profile saved successfully! Redirecting to dashboard...', 'success');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
        } else {
            showToast(data.message || 'Could not save profile. Please try again.', 'error');
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Complete Registration';
            submitBtn.disabled = false;
        }

    } catch (err) {
        console.error('Registration API error:', err);
        showToast('Cannot connect to server. Make sure the backend is running (node server.js).', 'error');
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Complete Registration';
        submitBtn.disabled = false;
    }
}
