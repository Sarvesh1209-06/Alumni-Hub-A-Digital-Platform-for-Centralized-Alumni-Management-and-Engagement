// =====================================================
// js/login.js — Login Form Handler (Backend API Version)
// =====================================================
// Sends email + password to the backend server.
// The server reads users.json and validates credentials.
// On success, saves the user session to localStorage.
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput    = document.getElementById('email').value.trim().toLowerCase();
            const passwordInput = document.getElementById('password').value;

            // Show loading state on button
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            submitBtn.disabled = true;

            try {
                // POST credentials to backend API
                    const res = await fetch('https://alumni-hub-a-digital-platform-for.onrender.com/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailInput, password: passwordInput })
                });

                const data = await res.json();

                if (data.success) {
                    // Server returned user info and created a session cookie.
                    // Cache user locally for UI convenience.
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    showToast(`Welcome back, ${data.user.name || data.user.fullName}!`, 'success');

                    // Redirect depending on role and profile completion
                    setTimeout(() => {
                        if (data.user.role === 'Student') {
                            window.location.href = 'dashboard.html';
                        } else if (data.user.role === 'Alumni') {
                            if (data.user.profileCompleted) window.location.href = 'dashboard.html';
                            else window.location.href = `signup.html?completeProfile=1&userId=${encodeURIComponent(data.user.id)}`;
                        } else {
                            // Admin or others
                            window.location.href = 'dashboard.html';
                        }
                    }, 800);
                } else {
                    // Show error from server
                    showToast(data.message || 'Invalid email or password. Please try again.', 'error');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }

            } catch (err) {
                // Network error — server might not be running
                console.error('Login API error:', err);
                showToast('Cannot connect to server. Make sure the backend is running (node server.js).', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
