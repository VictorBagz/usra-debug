// Sign In Page - Fixed Version
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Loading Sign In Page...');
    
    // Initialize AOS if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });
    }

    const signinForm = document.getElementById('signinForm');
    const btnSignIn = document.getElementById('btnSignIn');
    const btnCreateAccount = document.getElementById('btnCreateAccount');
    const signinStatus = document.getElementById('signinStatus');
    const forgotPassword = document.getElementById('forgotPassword');

    // Check if user is already authenticated (redirect if so)
    setTimeout(() => {
        if (window.USRANavAuth && window.USRANavAuth.isAuthenticated) {
            window.location.href = 'dashboard.html';
        }
    }, 1000);

    // Handle sign in form submission
    if (signinForm) {
        signinForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showStatus('Please enter both email and password', 'error');
                return;
            }

            // Show loading state
            btnSignIn.disabled = true;
            btnSignIn.innerHTML = '<span class="loading"></span> Signing in...';

            try {
                // Wait for auth system to be ready
                if (!window.USRANavAuth || !window.USRANavAuth.supabase) {
                    throw new Error('Authentication system not ready. Please refresh the page.');
                }
                
                const { data, error } = await window.USRANavAuth.supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) {
                    showStatus(getErrorMessage(error), 'error');
                } else if (data.user) {
                    showStatus('Sign in successful! Redirecting...', 'success');
                    
                    // Redirect to dashboard after successful sign in
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    showStatus('Sign in failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Sign in error:', error);
                showStatus('Sign in failed. Please check your connection and try again.', 'error');
            } finally {
                // Reset button state
                btnSignIn.disabled = false;
                btnSignIn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
            }
        });
    }

    // Handle create account button
    if (btnCreateAccount) {
        btnCreateAccount.addEventListener('click', async function() {
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showStatus('Please enter both email and password to create an account', 'error');
                return;
            }

            if (password.length < 6) {
                showStatus('Password must be at least 6 characters long', 'error');
                return;
            }

            // Show loading state
            btnCreateAccount.disabled = true;
            btnCreateAccount.innerHTML = '<span class="loading"></span> Creating account...';

            try {
                const { data, error } = await window.USRAAuth.signUpWithEmail(email, password, {
                    role: 'admin'
                });
                
                if (error) {
                    showStatus(getErrorMessage(error), 'error');
                } else {
                    showStatus('Account created successfully! Check your email to confirm your account, then sign in.', 'success');
                    
                    // Clear form
                    document.getElementById('email').value = '';
                    document.getElementById('password').value = '';
                }
            } catch (error) {
                console.error('Sign up error:', error);
                showStatus('Account creation failed. Please try again.', 'error');
            } finally {
                // Reset button state
                btnCreateAccount.disabled = false;
                btnCreateAccount.innerHTML = '<i class="fas fa-user-plus"></i> Create Administrator Account';
            }
        });
    }

    // Handle forgot password
    if (forgotPassword) {
        forgotPassword.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            
            if (!email) {
                showStatus('Please enter your email address first', 'error');
                return;
            }

            try {
                const { error } = await window.USRAAuth.supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password.html'
                });
                
                if (error) {
                    showStatus(getErrorMessage(error), 'error');
                } else {
                    showStatus('Password reset email sent! Check your inbox.', 'success');
                }
            } catch (error) {
                console.error('Password reset error:', error);
                showStatus('Failed to send reset email. Please try again.', 'error');
            }
        });
    }

    // Utility function to show status messages
    function showStatus(message, type) {
        if (signinStatus) {
            signinStatus.style.display = 'block';
            signinStatus.textContent = message;
            signinStatus.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
            signinStatus.style.color = type === 'success' ? '#155724' : '#721c24';
            signinStatus.style.border = type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
            
            // Auto-hide after 5 seconds for error messages
            if (type === 'error') {
                setTimeout(() => {
                    if (signinStatus) {
                        signinStatus.style.display = 'none';
                    }
                }, 5000);
            }
        }
    }

    // Get user-friendly error message
    function getErrorMessage(error) {
        const errorMessages = {
            'Invalid login credentials': 'Invalid email or password. Please check your credentials and try again.',
            'Email not confirmed': 'Please check your email and click the confirmation link before signing in.',
            'Too many requests': 'Too many sign-in attempts. Please wait a few minutes and try again.',
            'User already registered': 'An account with this email already exists. Try signing in instead.',
            'Signup disabled': 'New account registration is currently disabled.',
            'Invalid email': 'Please enter a valid email address.',
            'Weak password': 'Password is too weak. Please choose a stronger password.'
        };

        return errorMessages[error.message] || error.message || 'An error occurred. Please try again.';
    }

    // Enhanced form interactions
    const formInputs = document.querySelectorAll('input');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
            this.parentElement.style.transition = 'transform 0.2s ease';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });

        // Clear status on input
        input.addEventListener('input', function() {
            if (signinStatus && signinStatus.style.display !== 'none') {
                signinStatus.style.display = 'none';
            }
        });
    });

    // Mobile navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    console.log('✅ Sign in page initialized!');
});
