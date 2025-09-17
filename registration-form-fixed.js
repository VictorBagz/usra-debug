// USRA Registration Form - Fixed and Simplified Version
// This file contains a clean, working registration system

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Loading USRA Registration System...');
    
    // Initialize Supabase client
    let supabase = null;
    
    const initializeSupabase = () => {
        try {
            const SUPABASE_URL = 'https://ycdsyaenakevtozcomgk.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZHN5YWVuYWtldnRvemNvbWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzczMjAsImV4cCI6MjA3MjA1MzMyMH0.BxT4n22lnBEDL0TA7LNqIyti0LJ4dxGMgx5tOZiqQzE';
            
            if (window.supabase && window.supabase.createClient) {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('✅ Supabase client initialized');
                return true;
            } else {
                console.error('❌ Supabase library not loaded');
                return false;
            }
        } catch (error) {
            console.error('❌ Error initializing Supabase:', error);
            return false;
        }
    };

    // Initialize Supabase
    if (!initializeSupabase()) {
        console.error('Failed to initialize Supabase client');
        return;
    }

    // Get form elements
    const form = document.getElementById('schoolRegistrationForm');
    if (!form) {
        console.error('Registration form not found');
        return;
    }

    // Multi-step form variables
    const steps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    
    let currentStep = 1;
    const totalSteps = steps.length;

    // Initialize form
    showStep(currentStep);
    updateProgressBar();

    // Next step functionality
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (validateCurrentStep()) {
                if (currentStep < totalSteps) {
                    currentStep++;
                    showStep(currentStep);
                    updateProgressBar();
                    if (currentStep === 3) {
                        updateSummary();
                    }
                }
            }
        });
    });

    // Previous step functionality
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
                updateProgressBar();
            }
        });
    });

    // Show specific step
    function showStep(step) {
        steps.forEach((stepEl, index) => {
            stepEl.classList.toggle('active', index + 1 === step);
        });
        
        // Scroll to form
        const formContainer = document.querySelector('.registration-form-container');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Update progress bar
    function updateProgressBar() {
        progressSteps.forEach((stepEl, index) => {
            stepEl.classList.toggle('active', index + 1 <= currentStep);
        });
    }

    // Validate current step
    function validateCurrentStep() {
        const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        const requiredFields = currentStepEl.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            clearFieldError(field);
            
            if (!field.value.trim()) {
                showFieldError(field, 'This field is required');
                isValid = false;
            } else if (field.type === 'email' && !isValidEmail(field.value)) {
                showFieldError(field, 'Please enter a valid email address');
                isValid = false;
            } else if (field.type === 'tel' && !isValidPhone(field.value)) {
                showFieldError(field, 'Please enter a valid phone number');
                isValid = false;
            } else if (field.type === 'password' && field.value.length < 6) {
                showFieldError(field, 'Password must be at least 6 characters long');
                isValid = false;
            }
        });

        return isValid;
    }

    // Update summary
    function updateSummary() {
        const summaryElements = document.querySelectorAll('[data-field]');
        summaryElements.forEach(element => {
            const fieldName = element.getAttribute('data-field');
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                element.textContent = field.value || '-';
            }
        });
    }

    // Show field error
    function showFieldError(field, message) {
        field.style.borderColor = '#dc3545';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #dc3545;
            font-size: 0.85rem;
            margin-top: 0.3rem;
        `;
        
        field.parentNode.appendChild(errorDiv);
    }

    // Clear field error
    function clearFieldError(field) {
        field.style.borderColor = '';
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // Validation helpers
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    // File upload preview
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const uploadArea = this.parentNode.querySelector('.file-upload-area');
            const fileName = this.files[0]?.name;
            
            if (fileName) {
                const span = uploadArea.querySelector('span');
                span.textContent = `Selected: ${fileName}`;
                uploadArea.style.borderColor = '#28a745';
                uploadArea.style.background = 'rgba(40, 167, 69, 0.05)';
            }
        });
    });

    // Terms checkbox handling
    const termsCheckbox = document.getElementById('termsAccept');
    const submitButton = document.querySelector('.submit-form');
    
    if (termsCheckbox && submitButton) {
        termsCheckbox.addEventListener('change', function() {
            submitButton.disabled = !this.checked;
            submitButton.style.opacity = this.checked ? '1' : '0.5';
        });
        
        // Initialize state
        submitButton.disabled = !termsCheckbox.checked;
        submitButton.style.opacity = termsCheckbox.checked ? '1' : '0.5';
    }

    // Password toggle functionality
    window.togglePassword = function(fieldId) {
        const passwordField = document.getElementById(fieldId);
        const passwordIcon = document.getElementById(fieldId + 'Icon');
        
        if (passwordField && passwordIcon) {
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                passwordIcon.classList.remove('fa-eye');
                passwordIcon.classList.add('fa-eye-slash');
            } else {
                passwordField.type = 'password';
                passwordIcon.classList.remove('fa-eye-slash');
                passwordIcon.classList.add('fa-eye');
            }
        }
    };

    // Main form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('🚀 Starting registration submission...');
        
        // Final validation
        if (!validateCurrentStep()) {
            console.error('❌ Form validation failed');
            return;
        }
        
        // Show loading state
        const submitBtn = document.querySelector('.submit-form');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
        
        // Clear any existing messages
        const existingMessages = form.querySelectorAll('.success-message, .error-message');
        existingMessages.forEach(msg => msg.remove());
        
        try {
            // Collect form data
            const formData = new FormData(form);
            
            const schoolData = {
                school_name: formData.get('schoolName'),
                center_number: formData.get('centerNumber'),
                school_email: formData.get('schoolEmail'),
                school_phone1: formData.get('schoolPhone1'),
                school_phone2: formData.get('schoolPhone2') || null,
                address: formData.get('address'),
                region: formData.get('region'),
                district: formData.get('district'),
                full_name: formData.get('adminFullName'),
                nin: formData.get('nin'),
                role: formData.get('role'),
                sex: formData.get('sex'),
                qualification: formData.get('qualification'),
                contact1: formData.get('contact1'),
                contact2: formData.get('contact2') || null,
                status: 'pending',
                registration_date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString()
            };
            
            console.log('📋 Form data collected:', schoolData);
            
            // Create authentication user
            console.log('🔐 Creating authentication user...');
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: schoolData.school_email,
                password: formData.get('adminPassword'),
                options: {
                    data: {
                        full_name: schoolData.full_name,
                        role: 'school_admin',
                        school_name: schoolData.school_name
                    }
                }
            });
            
            if (authError) {
                console.error('❌ Authentication error:', authError);
                throw new Error(`Authentication failed: ${authError.message}`);
            }
            
            if (!authData.user) {
                throw new Error('Authentication failed - no user returned');
            }
            
            console.log('✅ Authentication successful:', authData.user.id);
            
            // Add user ID to school data
            schoolData.user_id = authData.user.id;
            schoolData.created_by = authData.user.id;
            
            // Handle file uploads
            await handleFileUploads(formData, authData.user.id, schoolData);
            
            // Insert school data into database
            console.log('💾 Saving school data to database...');
            const { data: schoolRecord, error: insertError } = await supabase
                .from('schools')
                .insert([schoolData])
                .select();
            
            if (insertError) {
                console.error('❌ Database insert error:', insertError);
                throw new Error(`Database error: ${insertError.message}`);
            }
            
            console.log('✅ Registration completed successfully!');
            
            // Show success message
            showMessage('Registration successful! Redirecting to your profile...', 'success');
            
            // Save registration data for profile page
            const registrationData = {
                ...schoolData,
                admin_password: '********' // Don't store actual password
            };
            sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
            
            // Redirect after 3 seconds
            setTimeout(() => {
                window.location.href = `profile.html?schoolId=${authData.user.id}`;
            }, 3000);
            
        } catch (error) {
            console.error('❌ Registration error:', error);
            
            showMessage(`Registration failed: ${error.message}`, 'error');
            
            // Re-enable submit button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Handle file uploads
    async function handleFileUploads(formData, userId, schoolData) {
        console.log('📁 Processing file uploads...');
        
        // School badge upload
        const schoolBadgeFile = formData.get('schoolBadge');
        if (schoolBadgeFile && schoolBadgeFile.size > 0) {
            console.log('📸 Uploading school badge...');
            const badgeUrl = await uploadFile(schoolBadgeFile, userId, 'school_badges', 'badge');
            if (badgeUrl) {
                schoolData.school_badge_url = badgeUrl;
                console.log('✅ School badge uploaded');
            }
        }
        
        // Profile photo upload
        const profilePhotoFile = formData.get('profilePhoto');
        if (profilePhotoFile && profilePhotoFile.size > 0) {
            console.log('👤 Uploading profile photo...');
            const photoUrl = await uploadFile(profilePhotoFile, userId, 'profile_photos', 'profile');
            if (photoUrl) {
                schoolData.profile_photo_url = photoUrl;
                console.log('✅ Profile photo uploaded');
            }
        }
        
        // Supporting documents upload
        const supportingDocsFile = formData.get('supportingDocs');
        if (supportingDocsFile && supportingDocsFile.size > 0) {
            console.log('📄 Uploading supporting documents...');
            const docsUrl = await uploadFile(supportingDocsFile, userId, 'supporting_documents', 'tmis');
            if (docsUrl) {
                schoolData.supporting_docs_url = docsUrl;
                console.log('✅ Supporting documents uploaded');
            }
        }
    }

    // Generic file upload function
    async function uploadFile(file, userId, bucket, prefix) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${prefix}_${Date.now()}.${fileExt}`;
            
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (error) {
                console.error(`File upload error (${bucket}):`, error);
                return null;
            }
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);
            
            return urlData.publicUrl;
        } catch (error) {
            console.error(`File upload failed (${bucket}):`, error);
            return null;
        }
    }

    // Show message helper
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.style.cssText = `
            display: block;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            font-weight: 500;
            ${type === 'success' ? 
                'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' :
                'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
            }
        `;
        messageDiv.innerHTML = message;
        form.prepend(messageDiv);
        
        // Auto-remove after 5 seconds for error messages
        if (type === 'error') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    console.log('✅ USRA Registration System loaded successfully!');
});
