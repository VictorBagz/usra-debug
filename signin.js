// Sign In Page JavaScript - Updated for Center Number Authentication
document.addEventListener('DOMContentLoaded', function() {
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

    // Handle sign in form submission
    if (signinForm) {
        signinForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!window.USRA || !window.USRA.supabase) {
                showStatus('Authentication service not available', 'error');
                return;
            }

            const centerNumber = document.getElementById('centerNumber').value.trim();
            const password = document.getElementById('password').value;

            if (!centerNumber || !password) {
                showStatus('Please enter both center number and password', 'error');
                return;
            }

            // Show loading state
            btnSignIn.disabled = true;
            btnSignIn.innerHTML = '<span class="loading"></span> Signing in...';

            try {
                // Wait for USRA to be ready
                let attempts = 0;
                while ((!window.USRA || !window.USRA.supabase) && attempts < 10) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    attempts++;
                }
                
                if (!window.USRA || !window.USRA.supabase) {
                    showStatus('Authentication system not ready. Please refresh the page and try again.', 'error');
                    return;
                }
                
                console.log('🔍 Querying database for center number:', centerNumber);
                
                // Query the schools table to find the school with the given center number
                const { data: schoolData, error: schoolError } = await window.USRA.supabase
                    .from('schools')
                    .select('*')
                    .eq('center_number', centerNumber);

                console.log('Database query result:', { schoolData, schoolError });

                if (schoolError) {
                    console.error('Database query error:', schoolError);
                    showStatus(`Database error: ${schoolError.message}`, 'error');
                    return;
                }

                if (!schoolData || schoolData.length === 0) {
                    showStatus('Invalid center number. Please check and try again.', 'error');
                    return;
                }
                
                const school = schoolData[0];
                console.log('Found school:', school);

                // Check if the school has an associated user account
                if (!school.user_id) {
                    showStatus('No account found for this center number. Please contact the administrator.', 'error');
                    return;
                }

                // Try to sign in with the school's email and provided password
                const schoolEmail = school.school_email || school.email;
                if (!schoolEmail) {
                    showStatus('School email not found. Please contact the administrator.', 'error');
                    return;
                }

                console.log('🔐 Attempting authentication with email:', schoolEmail);
                
                const { data: authData, error: authError } = await window.USRA.signInWithEmail(schoolEmail, password);
                
                console.log('Authentication result:', { authData, authError });
                
                if (authError) {
                    showStatus(`Authentication failed: ${authError.message}`, 'error');
                } else if (authData && authData.user) {
                    showStatus('Sign in successful! Redirecting to profile...', 'success');
                    
                    // Store school data in session for profile page
                    sessionStorage.setItem('currentSchool', JSON.stringify(school));
                    
                    // Redirect to profile page after successful sign in
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 1500);
                } else {
                    showStatus('Sign in failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Sign in error:', error);
                showStatus(`Sign in failed: ${error.message}`, 'error');
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
            if (!window.USRA || !window.USRA.supabase) {
                showStatus('Authentication service not available', 'error');
                return;
            }

            const centerNumber = document.getElementById('centerNumber').value.trim();
            const password = document.getElementById('password').value;

            if (!centerNumber || !password) {
                showStatus('Please enter both center number and password to create an account', 'error');
                return;
            }

            // Show loading state
            btnCreateAccount.disabled = true;
            btnCreateAccount.innerHTML = '<span class="loading"></span> Creating account...';

            try {
                // First, find the school with the given center number
                const { data: schoolData, error: schoolError } = await window.USRA.supabase
                    .from('schools')
                    .select('*')
                    .eq('center_number', centerNumber)
                    .single();

                if (schoolError || !schoolData) {
                    showStatus('Center number not found. Please check and try again.', 'error');
                    return;
                }

                const email = schoolData.school_email || schoolData.email;
                if (!email) {
                    showStatus('No email found for this center number. Please contact the administrator.', 'error');
                    return;
                }

                if (schoolData.user_id) {
                    showStatus('An account already exists for this center number. Try signing in instead.', 'error');
                    return;
                }

                const { data, error } = await window.USRA.signUpWithEmail(email, password);
                
                if (error) {
                    showStatus(error.message, 'error');
                } else if (data.user) {
                    // Update the school record with the new user_id
                    const { error: updateError } = await window.USRA.supabase
                        .from('schools')
                        .update({ user_id: data.user.id })
                        .eq('center_number', centerNumber);

                    if (updateError) {
                        console.error('Failed to link user to school:', updateError);
                    }

                    showStatus('Account created successfully! Check your email to confirm your account, then you can sign in.', 'success');
                    
                    // Clear form
                    document.getElementById('centerNumber').value = '';
                    document.getElementById('password').value = '';
                }
            } catch (error) {
                console.error('Sign up error:', error);
                showStatus('Account creation failed. Please try again.', 'error');
            } finally {
                // Reset button state
                btnCreateAccount.disabled = false;
                btnCreateAccount.innerHTML = '<i class="fas fa-user-plus"></i> Create Account for School';
            }
        });
    }

    // Handle forgot password
    if (forgotPassword) {
        forgotPassword.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const centerNumber = document.getElementById('centerNumber').value.trim();
            
            if (!centerNumber) {
                showStatus('Please enter your center number first', 'error');
                return;
            }

            if (!window.USRA || !window.USRA.supabase) {
                showStatus('Authentication service not available', 'error');
                return;
            }

            try {
                // First, find the school with the given center number
                const { data: schoolData, error: schoolError } = await window.USRA.supabase
                    .from('schools')
                    .select('school_email, email')
                    .eq('center_number', centerNumber)
                    .single();

                if (schoolError || !schoolData) {
                    showStatus('Center number not found. Please check and try again.', 'error');
                    return;
                }

                const email = schoolData.school_email || schoolData.email;
                if (!email) {
                    showStatus('No email found for this center number. Please contact the administrator.', 'error');
                    return;
                }

                const { error } = await window.USRA.supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password.html'
                });
                
                if (error) {
                    showStatus(error.message, 'error');
                } else {
                    showStatus('Password reset email sent! Check your inbox.', 'success');
                }
            } catch (error) {
                console.error('Password reset error:', error);
                showStatus('Failed to send reset email. Please try again.', 'error');
            }
        });
    }

    // Check if user is already signed in
    checkAuthState();

    // Utility function to show status messages
    function showStatus(message, type) {
        if (signinStatus) {
            signinStatus.style.display = 'block';
            signinStatus.textContent = message;
            signinStatus.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
            signinStatus.style.color = type === 'success' ? '#155724' : '#721c24';
            signinStatus.style.border = type === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
        }
    }

    // Check authentication state
    async function checkAuthState() {
        if (!window.USRA || !window.USRA.supabase) return;

        try {
            const { data: { user } } = await window.USRA.supabase.auth.getUser();
            
            if (user) {
                // User is already signed in, redirect to profile
                showStatus('You are already signed in. Redirecting to profile...', 'success');
                setTimeout(() => {
                    window.location.href = 'profile.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
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
    });

    // Mobile navigation (reuse from main script)
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

    console.log('Sign in page initialized! 🔐');
});
