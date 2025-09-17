// Profile Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing Profile Page');
    
    // Initialize AOS if available
    if (typeof AOS !== 'undefined') {
        console.log('Initializing AOS animation library');
        AOS.init({
            duration: 1000,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });
    }

    const loadingOverlay = document.getElementById('loadingOverlay');
    const printButton = document.getElementById('printProfile');

    // Load profile data from URL parameters or sessionStorage
    loadProfileData();

    // Set up print functionality
    if (printButton) {
        printButton.addEventListener('click', function() {
            console.log('Print button clicked');
            window.print();
        });
    }

    // Hide loading overlay after content loads
    setTimeout(() => {
        if (loadingOverlay) {
            console.log('Hiding loading overlay');
            loadingOverlay.style.display = 'none';
        }
    }, 1000);

    function loadProfileData() {
        console.log('Loading profile data...');
        try {
            // Try to get data from URL parameters first
            const urlParams = new URLSearchParams(window.location.search);
            const schoolId = urlParams.get('schoolId');
            console.log('URL Parameters:', Object.fromEntries(urlParams.entries()));
            
            let data = null;
            
            // Look in sessionStorage first (where our registration system saves data)
            const storedData = sessionStorage.getItem('registrationData');
            console.log('Session Storage Data:', storedData ? 'Exists' : 'Not found');
            
            if (storedData) {
                console.log('Parsing session storage data');
                data = JSON.parse(storedData);
                console.log('Session Data:', data);
            } else {
                // Fallback to localStorage (for backward compatibility)
                console.log('Checking localStorage for registration data');
                const localStorageData = localStorage.getItem('registrationData');
                console.log('Local Storage Data:', localStorageData ? 'Exists' : 'Not found');
                
                if (localStorageData) {
                    console.log('Parsing local storage data');
                    data = JSON.parse(localStorageData);
                    console.log('Local Data:', data);
                }
            }

            if (data) {
                console.log('Data found, populating profile');
                populateProfileData(data);
                // Clear sessionStorage after use for security
                sessionStorage.removeItem('registrationData');
                console.log('Cleared session storage data');
            } else {
                // No data available, redirect to registration
                console.warn('No registration data available');
                showNoDataMessage();
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
            showNoDataMessage();
        }
    }

    function populateProfileData(data) {
        console.log('Populating profile with data:', data);
        
        // School Information - using snake_case field names to match registration data
        setElementText('schoolName', data.school_name || data.schoolName);
        setElementText('centerNumber', data.center_number || data.centerNumber);
        setElementText('schoolEmail', data.school_email || data.schoolEmail);
        setElementText('contact1', data.school_phone1 || data.schoolPhone1);
        setElementText('region', data.region);
        setElementText('district', data.district);
        setElementText('address', data.address);

        // Representative Information
        setElementText('adminFullName', data.admin_full_name || data.adminFullName);
        setElementText('nin', data.nin);
        setElementText('role', data.role);
        setElementText('sex', data.sex);
        setElementText('qualification', data.qualification);
        setElementText('adminContact1', data.contact1 || data.contact1);

        // Display school badge if available
        console.log('Attempting to display school badge');
        displaySchoolBadge(data);

        // Handle uploaded files
        console.log('Handling uploaded files');
        handleUploadedFiles(data);

        // Update page title with school name
        if (data.school_name || data.schoolName) {
            document.title = `${data.school_name || data.schoolName} - Registration Profile - USRA`;
            console.log('Updated page title');
        }

        // Display registration date if available
        if (data.registration_date || data.registrationDate) {
            const regDate = data.registration_date || data.registrationDate;
            const registrationDate = new Date(regDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Add registration date to the status section
            const statusSection = document.querySelector('.sidebar-card');
            if (statusSection) {
                const dateInfo = document.createElement('p');
                dateInfo.style.cssText = 'margin-top: 10px; color: #666; font-size: 0.85rem;';
                dateInfo.innerHTML = `<i class="fas fa-calendar"></i> Registered: ${registrationDate}`;
                statusSection.appendChild(dateInfo);
                console.log('Added registration date to profile');
            }
        }
    }

  function displaySchoolBadge(data) {
    console.log('Displaying school badge with data:', data);
    
    // Handle both direct URLs and base64 data
    let schoolBadgeUrl = null;
    
    // Check for fileUrls first (this is where your data actually is)
    if (data.fileUrls && data.fileUrls.schoolBadge) {
        console.log('Found school badge in fileUrls.schoolBadge');
        schoolBadgeUrl = data.fileUrls.schoolBadge;
    }
    // Then check for base64 data from our fallback system
    else if (data.school_badge && data.school_badge.data) {
        console.log('Found school badge in base64 format');
        schoolBadgeUrl = data.school_badge.data;
    } 
    else if (data.schoolBadge && data.schoolBadge.data) {
        console.log('Found school badge in schoolBadge.data property');
        schoolBadgeUrl = data.schoolBadge.data;
    }
    else {
        console.warn('No school badge found in data structure');
        console.log('Available data keys:', Object.keys(data));
    }

    console.log('School badge URL:', schoolBadgeUrl);

    if (schoolBadgeUrl) {
        console.log('Creating school badge display');
        // Find a good place to display the school badge
        const schoolInfoSection = document.querySelector('.info-section');
        if (schoolInfoSection) {
            // Create a badge display element
            const badgeContainer = document.createElement('div');
            badgeContainer.style.cssText = `
                text-align: center;
                margin: 20px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                border: 2px dashed #ddd;
            `;
            
            badgeContainer.innerHTML = `
                <h4 style="margin-bottom: 15px; color: var(--primary-red);">
                    <i class="fas fa-image"></i> School Badge
                </h4>
                <img src="${schoolBadgeUrl}" alt="School Badge" 
                     style="max-width: 200px; max-height: 200px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);"
                     onerror="this.style.display='none'; console.error('Failed to load school badge image')">
            `;
            
            // Insert after the school information grid
            const infoGrid = schoolInfoSection.querySelector('.info-grid');
            if (infoGrid) {
                schoolInfoSection.insertBefore(badgeContainer, infoGrid.nextSibling);
                console.log('School badge displayed successfully');
            }
        }
    } else {
        console.warn('No school badge URL available to display');
        
        // Add a placeholder message
        const schoolInfoSection = document.querySelector('.info-section');
        if (schoolInfoSection) {
            const noBadgeMessage = document.createElement('div');
            noBadgeMessage.style.cssText = `
                text-align: center;
                margin: 20px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                border: 2px dashed #ddd;
                color: #666;
            `;
            
            noBadgeMessage.innerHTML = `
                <h4 style="margin-bottom: 15px; color: var(--primary-red);">
                    <i class="fas fa-image"></i> School Badge
                </h4>
                <p><i class="fas fa-exclamation-triangle"></i> No school badge available</p>
            `;
            
            const infoGrid = schoolInfoSection.querySelector('.info-grid');
            if (infoGrid) {
                schoolInfoSection.insertBefore(noBadgeMessage, infoGrid.nextSibling);
            }
        }
    }
}
    function setElementText(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value || '-';
        }
    }

    function handleUploadedFiles(data) {
        console.log('Handling uploaded files with data:', data);
        
        const fileDownloads = document.getElementById('fileDownloads');
        const documentsSection = document.getElementById('documentsSection');
        
        if (!fileDownloads || !documentsSection) {
            console.warn('File downloads or documents section not found');
            return;
        }

        const files = [];
        
        // Handle base64 file data from our fallback system
        if (data.school_badge && data.school_badge.data) {
            console.log('Adding school badge to file list');
            files.push({
                name: 'School Badge',
                type: 'image',
                icon: 'fas fa-image',
                url: data.school_badge.data
            });
        }
        
        // Show profile photo above School Representative section if available
        const profilePhotoImg = document.getElementById('profilePhoto');
        if (data.profile_photo && data.profile_photo.data) {
            console.log('Adding profile photo to file list');
            files.push({
                name: 'Profile Photo',
                type: 'image',
                icon: 'fas fa-camera',
                url: data.profile_photo.data
            });
            if (profilePhotoImg) {
                profilePhotoImg.src = data.profile_photo.data;
                profilePhotoImg.style.display = 'inline-block';
            }
        } else if (data.fileUrls && data.fileUrls.profilePhoto && profilePhotoImg) {
            // Fallback for direct URL
            profilePhotoImg.src = data.fileUrls.profilePhoto;
            profilePhotoImg.style.display = 'inline-block';
        }
        
        if (data.supporting_docs && data.supporting_docs.data) {
            console.log('Adding supporting docs to file list');
            files.push({
                name: 'TMIS Certificate',
                type: 'document',
                icon: 'fas fa-file-pdf',
                url: data.supporting_docs.data
            });
        }
        
        // Also handle direct URLs for backward compatibility
        if (!files.length && data.fileUrls) {
            console.log('Checking fileUrls for uploaded files');
            const fileUrls = data.fileUrls;
            
            if (fileUrls.schoolBadge) {
                console.log('Adding school badge from fileUrls');
                files.push({
                    name: 'School Badge',
                    type: 'image',
                    icon: 'fas fa-image',
                    url: fileUrls.schoolBadge
                });
            }
            
            if (fileUrls.profilePhoto) {
                console.log('Adding profile photo from fileUrls');
                files.push({
                    name: 'Profile Photo',
                    type: 'image',
                    icon: 'fas fa-camera',
                    url: fileUrls.profilePhoto
                });
            }
            
            if (fileUrls.supportingDocs) {
                console.log('Adding supporting docs from fileUrls');
                files.push({
                    name: 'TMIS Certificate',
                    type: 'document',
                    icon: 'fas fa-file-pdf',
                    url: fileUrls.supportingDocs
                });
            }
        }

        console.log('Total files found:', files.length);
        
        if (files.length > 0) {
            console.log('Populating file downloads section');
            fileDownloads.innerHTML = '';
            files.forEach(file => {
                const fileItem = createFileItem(file);
                fileDownloads.appendChild(fileItem);
            });
        } else {
            console.log('No files found, hiding documents section');
            documentsSection.style.display = 'none';
        }
    }

    function createFileItem(file) {
        console.log('Creating file item:', file);
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">
                    <i class="${file.icon}"></i>
                </div>
                <div>
                    <div style="font-weight: 500;">${file.name}</div>
                    <div style="font-size: 0.8rem; color: #666;">${file.type.toUpperCase()}</div>
                </div>
            </div>
            <a href="${file.url}" target="_blank" class="btn btn-outline" style="padding: 8px 12px; font-size: 0.8rem;">
                <i class="fas fa-download"></i>
                View
            </a>
        `;
        
        return fileItem;
    }

    function showNoDataMessage() {
        console.log('Showing no data message');
        // Show message when no registration data is available
        const profileMain = document.querySelector('.profile-main');
        if (profileMain) {
            profileMain.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 20px;"></i>
                    <h3>No Registration Data Found</h3>
                    <p style="color: #666; margin-bottom: 30px;">
                        We couldn't find your registration information. This might happen if you accessed this page directly.
                    </p>
                    <a href="registration.html" class="btn btn-primary">
                        <i class="fas fa-plus"></i>
                        Start New Registration
                    </a>
                </div>
            `;
        }

        // Update hero section
        const profileHeader = document.querySelector('.profile-header');
        if (profileHeader) {
            profileHeader.innerHTML = `
                <div class="success-icon" style="color: #ff6b6b;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h1>Registration Not Found</h1>
                <p>Please complete the registration process to view your profile</p>
            `;
        }
    }

    // Enhanced mobile navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            console.log('Hamburger menu clicked');
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                console.log('Nav link clicked, closing menu');
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                console.log('Smooth scrolling to:', this.getAttribute('href'));
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add interactive button effects
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.transition = 'all 0.3s ease';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Auto-hide loading overlay on page interactions
    document.addEventListener('click', function() {
        if (loadingOverlay && loadingOverlay.style.display !== 'none') {
            console.log('Hiding loading overlay on interaction');
            loadingOverlay.style.display = 'none';
        }
    });

    // Handle browser back button
    window.addEventListener('popstate', function(event) {
        console.log('Browser back button pressed, clearing stored data');
        // Clear any stored registration data when navigating away
        sessionStorage.removeItem('registrationData');
        localStorage.removeItem('registrationData');
    });

    console.log('Profile page initialized! 👤');
});