// Dashboard Authentication - Fixed Version
// This script handles authentication and data loading for the dashboard

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Loading Dashboard with Authentication...');
    
    // Require authentication - redirect to signin if not authenticated
    window.USRAAuth.requireAuth('signin.html');
    
    // Dashboard state
    let currentUser = null;
    let dashboardData = {
        schools: [],
        players: [],
        contacts: [],
        events: []
    };
    
    // Initialize dashboard when authenticated
    window.USRAAuth.onAuthStateChange(async (auth) => {
        if (auth.isAuthenticated) {
            currentUser = auth.user;
            console.log('✅ User authenticated, initializing dashboard for:', currentUser.email);
            
            // Update user display
            updateUserDisplay();
            
            // Load dashboard data
            await loadDashboardData();
            
            // Initialize dashboard functionality
            initializeDashboard();
        }
    });
    
    // Update user display in navigation
    function updateUserDisplay() {
        const userChip = document.querySelector('.user-chip');
        if (userChip && currentUser) {
            userChip.innerHTML = `
                <i class="fas fa-user-shield"></i>
                <span>${currentUser.email}</span>
                <button onclick="handleSignOut()" style="background:none;border:none;color:inherit;margin-left:8px;cursor:pointer;" title="Sign Out">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            `;
        }
    }
    
    // Load all dashboard data
    async function loadDashboardData() {
        try {
            console.log('📊 Loading dashboard data...');
            
            // Show loading indicators
            showLoadingState();
            
            // Load data in parallel
            const [schoolsResult, playersResult, contactsResult, eventsResult] = await Promise.allSettled([
                loadSchools(),
                loadPlayers(),
                loadContacts(),
                loadEvents()
            ]);
            
            // Process results
            if (schoolsResult.status === 'fulfilled') {
                dashboardData.schools = schoolsResult.value || [];
            } else {
                console.error('Failed to load schools:', schoolsResult.reason);
            }
            
            if (playersResult.status === 'fulfilled') {
                dashboardData.players = playersResult.value || [];
            } else {
                console.error('Failed to load players:', playersResult.reason);
            }
            
            if (contactsResult.status === 'fulfilled') {
                dashboardData.contacts = contactsResult.value || [];
            } else {
                console.error('Failed to load contacts:', contactsResult.reason);
            }
            
            if (eventsResult.status === 'fulfilled') {
                dashboardData.events = eventsResult.value || [];
            } else {
                console.error('Failed to load events:', eventsResult.reason);
            }
            
            // Update dashboard displays
            updateDashboardStats();
            updateSchoolsList();
            updateMessagesList();
            updateEventsList();
            updateRecentRegistrations();
            
            console.log('✅ Dashboard data loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            showErrorMessage('Failed to load dashboard data. Please refresh the page.');
        } finally {
            hideLoadingState();
        }
    }
    
    // Load schools data
    async function loadSchools() {
        const { data, error } = await window.USRAAuth.supabase
            .from('schools')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }
    
    // Load players data
    async function loadPlayers() {
        const { data, error } = await window.USRAAuth.supabase
            .from('players')
            .select('*, schools(school_name)')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }
    
    // Load contacts data
    async function loadContacts() {
        const { data, error } = await window.USRAAuth.supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }
    
    // Load events data
    async function loadEvents() {
        const { data, error } = await window.USRAAuth.supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: true });
        
        if (error) throw error;
        return data;
    }
    
    // Update dashboard statistics
    function updateDashboardStats() {
        const statSchools = document.getElementById('statSchools');
        const statPlayers = document.getElementById('statPlayers');
        const statEvents = document.getElementById('statEvents');
        
        if (statSchools) statSchools.textContent = dashboardData.schools.length;
        if (statPlayers) statPlayers.textContent = dashboardData.players.length;
        if (statEvents) {
            const upcomingEvents = dashboardData.events.filter(event => 
                new Date(event.event_date) >= new Date()
            ).length;
            statEvents.textContent = upcomingEvents;
        }
    }
    
    // Update schools list
    function updateSchoolsList() {
        const schoolsList = document.getElementById('schoolsList');
        if (!schoolsList) return;
        
        if (dashboardData.schools.length === 0) {
            schoolsList.innerHTML = '<div class="empty">No schools registered yet.</div>';
            return;
        }
        
        schoolsList.innerHTML = dashboardData.schools.map(school => `
            <div class="school-item" onclick="selectSchool('${school.id}')">
                <img src="${school.school_badge_url || 'photos/usraLogo.png'}" alt="Badge" class="badge" onerror="this.src='photos/usraLogo.png'">
                <div>
                    <div class="school-name">${school.school_name || 'Unknown School'}</div>
                    <div class="school-meta">${school.region || 'Unknown Region'} • ${school.district || 'Unknown District'}</div>
                    <div class="school-meta">Contact: ${school.admin_full_name || 'Unknown'}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Update messages list
    function updateMessagesList() {
        const messageList = document.getElementById('messageList');
        if (!messageList) return;
        
        if (dashboardData.contacts.length === 0) {
            messageList.innerHTML = '<div class="empty">No messages received yet.</div>';
            return;
        }
        
        messageList.innerHTML = dashboardData.contacts.map(contact => `
            <div class="message-card" onclick="showMessage('${contact.id}')">
                <div class="from">${contact.name}</div>
                <div class="subject">${contact.subject}</div>
                <div style="font-size:0.85rem;color:#6b7280;margin-top:4px;">
                    ${new Date(contact.created_at).toLocaleDateString()}
                </div>
            </div>
        `).join('');
    }
    
    // Update events list
    function updateEventsList() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;
        
        if (dashboardData.events.length === 0) {
            eventsList.innerHTML = '<div class="empty">No events scheduled yet.</div>';
            return;
        }
        
        eventsList.innerHTML = dashboardData.events.map(event => `
            <div class="card" style="padding:12px;">
                <h4 style="margin:0 0 8px 0;color:var(--primary-red);">${event.title}</h4>
                <div style="font-size:0.9rem;color:#6b7280;">
                    <div><i class="fas fa-calendar"></i> ${new Date(event.event_date).toLocaleDateString()}</div>
                    <div><i class="fas fa-map-marker-alt"></i> ${event.location || 'Location TBD'}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Update recent registrations
    function updateRecentRegistrations() {
        const recentList = document.getElementById('recentList');
        if (!recentList) return;
        
        const recentSchools = dashboardData.schools.slice(0, 5);
        
        if (recentSchools.length === 0) {
            recentList.innerHTML = '<div class="empty">No recent registrations.</div>';
            return;
        }
        
        recentList.innerHTML = recentSchools.map(school => `
            <div style="padding:8px;border-bottom:1px solid #f1f5f9;">
                <div style="font-weight:600;">${school.school_name || 'Unknown School'}</div>
                <div style="font-size:0.85rem;color:#6b7280;">
                    ${new Date(school.created_at).toLocaleDateString()} • ${school.region || 'Unknown Region'}
                </div>
            </div>
        `).join('');
    }
    
    // Initialize dashboard functionality
    function initializeDashboard() {
        // Tab switching
        const tabs = document.querySelectorAll('.tab');
        const sections = document.querySelectorAll('.section');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-target');
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active section
                sections.forEach(s => s.classList.remove('active'));
                const targetSection = document.getElementById(target);
                if (targetSection) {
                    targetSection.classList.add('active');
                }
            });
        });
        
        // Search functionality
        const searchInput = document.getElementById('searchSchools');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                filterSchools(e.target.value);
            });
        }
        
        // Event form
        const eventForm = document.getElementById('eventForm');
        if (eventForm) {
            eventForm.addEventListener('submit', handleEventSubmit);
        }
        
        // Modal functionality
        const messageModal = document.getElementById('messageModal');
        const messageModalClose = document.getElementById('messageModalClose');
        
        if (messageModalClose) {
            messageModalClose.addEventListener('click', () => {
                messageModal.classList.remove('open');
            });
        }
        
        console.log('✅ Dashboard functionality initialized');
    }
    
    // Global functions for onclick handlers
    window.selectSchool = function(schoolId) {
        const school = dashboardData.schools.find(s => s.id === schoolId);
        if (!school) return;
        
        const schoolPlayers = dashboardData.players.filter(p => p.school_id === schoolId);
        
        // Update selected school title
        const title = document.getElementById('selectedSchoolTitle');
        if (title) {
            title.textContent = `Players - ${school.school_name}`;
        }
        
        // Update players table
        const tbody = document.getElementById('playersTableBody');
        if (tbody) {
            if (schoolPlayers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6b7280;">No players registered for this school yet.</td></tr>';
            } else {
                tbody.innerHTML = schoolPlayers.map(player => `
                    <tr>
                        <td><img src="${player.photo_url || 'photos/usraLogo.png'}" alt="Player" class="avatar" onerror="this.src='photos/usraLogo.png'"></td>
                        <td>${player.first_name} ${player.last_name}</td>
                        <td>${player.position || '-'}</td>
                        <td>${player.jersey_number || '-'}</td>
                        <td>${player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString() : '-'}</td>
                        <td>${player.height_cm ? player.height_cm + 'cm' : '-'}</td>
                        <td>${player.weight_kg ? player.weight_kg + 'kg' : '-'}</td>
                    </tr>
                `).join('');
            }
        }
    };
    
    window.showMessage = function(messageId) {
        const message = dashboardData.contacts.find(c => c.id === messageId);
        if (!message) return;
        
        const modal = document.getElementById('messageModal');
        const modalBody = document.getElementById('messageModalBody');
        
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="margin-bottom:12px;">
                    <strong>From:</strong> ${message.name} (${message.email})<br>
                    <strong>Subject:</strong> ${message.subject}<br>
                    <strong>Date:</strong> ${new Date(message.created_at).toLocaleString()}
                </div>
                <div style="background:#f8f9fa;padding:12px;border-radius:8px;">
                    ${message.message.replace(/\n/g, '<br>')}
                </div>
            `;
        }
        
        if (modal) {
            modal.classList.add('open');
        }
    };
    
    window.handleSignOut = async function() {
        try {
            await window.USRAAuth.signOut();
            window.location.href = 'signin.html';
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };
    
    // Filter schools
    function filterSchools(searchTerm) {
        const filteredSchools = dashboardData.schools.filter(school => 
            (school.school_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (school.region || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (school.district || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const schoolsList = document.getElementById('schoolsList');
        if (schoolsList) {
            if (filteredSchools.length === 0) {
                schoolsList.innerHTML = '<div class="empty">No schools match your search.</div>';
            } else {
                schoolsList.innerHTML = filteredSchools.map(school => `
                    <div class="school-item" onclick="selectSchool('${school.id}')">
                        <img src="${school.school_badge_url || 'photos/usraLogo.png'}" alt="Badge" class="badge" onerror="this.src='photos/usraLogo.png'">
                        <div>
                            <div class="school-name">${school.school_name || 'Unknown School'}</div>
                            <div class="school-meta">${school.region || 'Unknown Region'} • ${school.district || 'Unknown District'}</div>
                            <div class="school-meta">Contact: ${school.admin_full_name || 'Unknown'}</div>
                        </div>
                    </div>
                `).join('');
            }
        }
    }
    
    // Handle event form submission
    async function handleEventSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const eventData = {
            title: formData.get('title'),
            location: formData.get('location'),
            event_date: formData.get('date'),
            description: formData.get('description')
        };
        
        try {
            const { error } = await window.USRAAuth.supabase
                .from('events')
                .insert([eventData]);
            
            if (error) throw error;
            
            // Reload events data
            dashboardData.events = await loadEvents();
            updateEventsList();
            updateDashboardStats();
            
            // Reset form
            e.target.reset();
            
            console.log('✅ Event created successfully');
            
        } catch (error) {
            console.error('❌ Error creating event:', error);
            showErrorMessage('Failed to create event. Please try again.');
        }
    }
    
    // Utility functions
    function showLoadingState() {
        // Add loading indicators to stat cards
        document.querySelectorAll('.stat').forEach(stat => {
            stat.innerHTML = '<div class="loading"></div>';
        });
    }
    
    function hideLoadingState() {
        // Loading indicators will be replaced by actual data
    }
    
    function showErrorMessage(message) {
        // Create and show error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            z-index: 10000;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    console.log('✅ Dashboard authentication system loaded');
});
