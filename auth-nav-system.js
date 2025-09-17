// USRA Navigation Authentication System
// Manages login/logout state and navigation UI updates

(function() {
    'use strict';
    
    console.log('🔐 Loading USRA Navigation Authentication System...');
    
    // Global authentication state
    window.USRANavAuth = {
        supabase: null,
        user: null,
        isAuthenticated: false,
        userProfile: null,
        initialized: false
    };
    
    // Initialize Supabase client
    function initializeSupabase() {
        try {
            const SUPABASE_URL = 'https://ycdsyaenakevtozcomgk.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZHN5YWVuYWtldnRvemNvbWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzczMjAsImV4cCI6MjA3MjA1MzMyMH0.BxT4n22lnBEDL0TA7LNqIyti0LJ4dxGMgx5tOZiqQzE';
            
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                window.USRANavAuth.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('✅ Supabase client initialized for navigation auth');
                return true;
            } else {
                console.error('❌ Supabase library not available');
                return false;
            }
        } catch (error) {
            console.error('❌ Error initializing Supabase:', error);
            return false;
        }
    }
    
    // Wait for Supabase library to load
    function waitForSupabase(callback, maxAttempts = 50) {
        let attempts = 0;
        
        const checkSupabase = () => {
            attempts++;
            
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                if (initializeSupabase()) {
                    callback();
                } else {
                    console.error('❌ Failed to initialize Supabase client');
                }
            } else if (attempts < maxAttempts) {
                setTimeout(checkSupabase, 100);
            } else {
                console.error('❌ Supabase library failed to load after maximum attempts');
                // Initialize without Supabase for offline mode
                callback();
            }
        };
        
        checkSupabase();
    }
    
    // Check current authentication status
    async function checkAuthStatus() {
        if (!window.USRANavAuth.supabase) {
            console.warn('⚠️ Supabase not available, checking localStorage for auth state');
            // Fallback to localStorage for offline mode
            const savedAuth = localStorage.getItem('usra_auth_state');
            if (savedAuth) {
                try {
                    const authData = JSON.parse(savedAuth);
                    window.USRANavAuth.user = authData.user;
                    window.USRANavAuth.userProfile = authData.profile;
                    window.USRANavAuth.isAuthenticated = true;
                    updateNavigationUI();
                    return;
                } catch (error) {
                    console.error('Error parsing saved auth state:', error);
                }
            }
            updateNavigationUI();
            return;
        }
        
        try {
            const { data: { user } } = await window.USRANavAuth.supabase.auth.getUser();
            
            if (user) {
                window.USRANavAuth.user = user;
                window.USRANavAuth.isAuthenticated = true;
                
                // Get user profile from schools table
                try {
                    const { data: profile } = await window.USRANavAuth.supabase
                        .from('schools')
                        .select('school_name, admin_full_name, profile_photo_url')
                        .eq('user_id', user.id)
                        .single();
                    
                    if (profile) {
                        window.USRANavAuth.userProfile = profile;
                    }
                } catch (profileError) {
                    console.warn('Could not fetch user profile:', profileError);
                }
                
                // Save auth state to localStorage
                localStorage.setItem('usra_auth_state', JSON.stringify({
                    user: user,
                    profile: window.USRANavAuth.userProfile
                }));
                
                console.log('✅ User authenticated:', user.email);
            } else {
                window.USRANavAuth.user = null;
                window.USRANavAuth.isAuthenticated = false;
                window.USRANavAuth.userProfile = null;
                localStorage.removeItem('usra_auth_state');
                console.log('ℹ️ No authenticated user');
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            window.USRANavAuth.isAuthenticated = false;
        }
        
        updateNavigationUI();
    }
    
    // Update navigation UI based on authentication state
    function updateNavigationUI() {
        const signInLink = document.querySelector('a[href="signin.html"]');
        const navDashboard = document.getElementById('navDashboard');
        const navMenu = document.querySelector('.nav-menu') || document.querySelector('.nav-links');
        
        if (!navMenu) {
            console.warn('Navigation menu not found');
            return;
        }
        
        // Remove existing auth elements
        const existingAuthElements = navMenu.querySelectorAll('.auth-element');
        existingAuthElements.forEach(el => el.remove());
        
        if (window.USRANavAuth.isAuthenticated && window.USRANavAuth.user) {
            // User is authenticated - show user menu and logout
            if (signInLink) {
                signInLink.style.display = 'none';
            }
            
            // Show dashboard link
            if (navDashboard) {
                navDashboard.style.display = 'block';
            }
            
            // Create user menu
            const userMenu = createUserMenu();
            navMenu.appendChild(userMenu);
            
            // Add standalone logout button for better visibility
            const logoutMenuItem = createStandaloneLogoutButton();
            navMenu.appendChild(logoutMenuItem);
            
            // Add logout to mobile menu if it exists
            addMobileLogoutOption();
            
        } else {
            // User is not authenticated - show sign in link
            if (signInLink) {
                signInLink.style.display = 'block';
                signInLink.textContent = 'Sign In';
            }
            
            // Hide dashboard link
            if (navDashboard) {
                navDashboard.style.display = 'none';
            }
        }
        
        console.log('✅ Navigation UI updated for auth state:', window.USRANavAuth.isAuthenticated);
    }
    
    // Create user menu dropdown
    function createUserMenu() {
        const userMenuItem = document.createElement('li');
        userMenuItem.className = 'nav-user-menu auth-element';
        
        const userName = window.USRANavAuth.userProfile?.admin_full_name || 
                        window.USRANavAuth.user?.user_metadata?.full_name || 
                        window.USRANavAuth.user?.email?.split('@')[0] || 
                        'User';
        
        const userEmail = window.USRANavAuth.user?.email || '';
        const profilePhoto = window.USRANavAuth.userProfile?.profile_photo_url;
        
        userMenuItem.innerHTML = `
            <a href="#" class="nav-link user-menu-trigger">
                <div class="user-avatar">
                    ${profilePhoto ? 
                        `<img src="${profilePhoto}" alt="Profile" class="avatar-img">` : 
                        `<i class="fas fa-user-circle"></i>`
                    }
                </div>
                <span class="user-name">${userName}</span>
                <i class="fas fa-chevron-down"></i>
            </a>
            <ul class="user-dropdown">
                <li class="user-info">
                    <div class="user-details">
                        <strong>${userName}</strong>
                        <small>${userEmail}</small>
                    </div>
                </li>
                <li><a href="profile.html?schoolId=${window.USRANavAuth.user.id}" class="dropdown-link">
                    <i class="fas fa-user"></i> My Profile
                </a></li>
                <li><a href="profile.html" class="dropdown-link">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </a></li>
                <li class="dropdown-divider"></li>
                <li><a href="#" class="dropdown-link logout-btn">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a></li>
            </ul>
        `;
        
        // Add event listeners
        const trigger = userMenuItem.querySelector('.user-menu-trigger');
        const dropdown = userMenuItem.querySelector('.user-dropdown');
        const logoutBtn = userMenuItem.querySelector('.logout-btn');
        
        // Toggle dropdown
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!userMenuItem.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Logout functionality
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
        
        return userMenuItem;
    }
    
    // Create standalone logout button for better visibility
    function createStandaloneLogoutButton() {
        const logoutMenuItem = document.createElement('li');
        logoutMenuItem.className = 'nav-logout-standalone auth-element';
        
        logoutMenuItem.innerHTML = `
            <a href="#" class="nav-link logout-standalone-btn">
                <i class="fas fa-sign-out-alt"></i> Logout
            </a>
        `;
        
        // Add logout functionality
        const logoutBtn = logoutMenuItem.querySelector('.logout-standalone-btn');
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                handleLogout();
            }
        });
        
        return logoutMenuItem;
    }
    
    // Add logout option to mobile menu
    function addMobileLogoutOption() {
        // Check if there's a mobile menu or dropdown menu
        const mobileMenus = document.querySelectorAll('.dropdown-menu, .mobile-menu, .nav-more ul');
        
        mobileMenus.forEach(menu => {
            // Remove existing mobile logout if present
            const existingMobileLogout = menu.querySelector('.mobile-logout-item');
            if (existingMobileLogout) {
                existingMobileLogout.remove();
            }
            
            // Add logout option to mobile menu
            const mobileLogoutItem = document.createElement('li');
            mobileLogoutItem.className = 'mobile-logout-item auth-element';
            mobileLogoutItem.innerHTML = `
                <a href="#" class="mobile-logout-btn" style="color: #dc3545; font-weight: 600;">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            `;
            
            // Add logout functionality
            const mobileLogoutBtn = mobileLogoutItem.querySelector('.mobile-logout-btn');
            mobileLogoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    handleLogout();
                }
            });
            
            menu.appendChild(mobileLogoutItem);
        });
    }
    
    // Handle user logout
    async function handleLogout() {
        try {
            if (window.USRANavAuth.supabase) {
                const { error } = await window.USRANavAuth.supabase.auth.signOut();
                if (error) {
                    console.error('Logout error:', error);
                    showNotification('Logout failed. Please try again.', 'error');
                    return;
                }
            }
            
            // Clear local state
            window.USRANavAuth.user = null;
            window.USRANavAuth.isAuthenticated = false;
            window.USRANavAuth.userProfile = null;
            localStorage.removeItem('usra_auth_state');
            
            // Update UI
            updateNavigationUI();
            
            // Show success message
            showNotification('Successfully logged out!', 'success');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
            console.log('✅ User logged out successfully');
            
        } catch (error) {
            console.error('Error during logout:', error);
            showNotification('Logout failed. Please try again.', 'error');
        }
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);
        
        // Hide notification
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }
    
    // Listen for auth state changes
    function setupAuthStateListener() {
        if (window.USRANavAuth.supabase) {
            window.USRANavAuth.supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event, session?.user?.email);
                
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    window.USRANavAuth.user = session.user;
                    window.USRANavAuth.isAuthenticated = true;
                    checkAuthStatus(); // This will update the profile and UI
                } else if (event === 'SIGNED_OUT') {
                    window.USRANavAuth.user = null;
                    window.USRANavAuth.isAuthenticated = false;
                    window.USRANavAuth.userProfile = null;
                    localStorage.removeItem('usra_auth_state');
                    updateNavigationUI();
                }
            });
        }
    }
    
    // Initialize the authentication system
    function initializeAuthSystem() {
        waitForSupabase(async () => {
            setupAuthStateListener();
            await checkAuthStatus();
            window.USRANavAuth.initialized = true;
            console.log('✅ USRA Navigation Authentication System initialized');
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAuthSystem);
    } else {
        initializeAuthSystem();
    }
    
    // Expose global functions
    window.USRANavAuth.checkStatus = checkAuthStatus;
    window.USRANavAuth.logout = handleLogout;
    window.USRANavAuth.updateUI = updateNavigationUI;
    
})();
