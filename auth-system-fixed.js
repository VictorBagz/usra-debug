// USRA Authentication System - Fixed Version
// This file provides a unified authentication system for all pages

(function() {
    'use strict';
    
    console.log('🔐 Loading USRA Authentication System...');
    
    // Global authentication state
    window.USRAAuth = {
        supabase: null,
        user: null,
        isLoading: true,
        isAuthenticated: false,
        callbacks: []
    };
    
    // Initialize Supabase client
    function initializeSupabase() {
        try {
            const SUPABASE_URL = 'https://ycdsyaenakevtozcomgk.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZHN5YWVuYWtldnRvemNvbWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzczMjAsImV4cCI6MjA3MjA1MzMyMH0.BxT4n22lnBEDL0TA7LNqIyti0LJ4dxGMgx5tOZiqQzE';
            
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                window.USRAAuth.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('✅ Supabase client initialized successfully');
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
            }
        };
        
        checkSupabase();
    }
    
    // Get current user
    async function getCurrentUser() {
        if (!window.USRAAuth.supabase) {
            throw new Error('Supabase not initialized');
        }
        
        try {
            const { data: { user }, error } = await window.USRAAuth.supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
    
    // Sign in with email and password
    async function signInWithEmail(email, password) {
        if (!window.USRAAuth.supabase) {
            throw new Error('Supabase not initialized');
        }
        
        try {
            const { data, error } = await window.USRAAuth.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Update auth state
            window.USRAAuth.user = data.user;
            window.USRAAuth.isAuthenticated = !!data.user;
            
            console.log('✅ User signed in successfully');
            return { data, error: null };
        } catch (error) {
            console.error('❌ Sign in error:', error);
            return { data: null, error };
        }
    }
    
    // Sign up with email and password
    async function signUpWithEmail(email, password, metadata = {}) {
        if (!window.USRAAuth.supabase) {
            throw new Error('Supabase not initialized');
        }
        
        try {
            const { data, error } = await window.USRAAuth.supabase.auth.signUp({
                email,
                password,
                options: { data: metadata }
            });
            
            if (error) throw error;
            
            console.log('✅ User signed up successfully');
            return { data, error: null };
        } catch (error) {
            console.error('❌ Sign up error:', error);
            return { data: null, error };
        }
    }
    
    // Sign out
    async function signOut() {
        if (!window.USRAAuth.supabase) {
            throw new Error('Supabase not initialized');
        }
        
        try {
            const { error } = await window.USRAAuth.supabase.auth.signOut();
            if (error) throw error;
            
            // Update auth state
            window.USRAAuth.user = null;
            window.USRAAuth.isAuthenticated = false;
            
            console.log('✅ User signed out successfully');
            return { error: null };
        } catch (error) {
            console.error('❌ Sign out error:', error);
            return { error };
        }
    }
    
    // Check authentication state
    async function checkAuthState() {
        try {
            const user = await getCurrentUser();
            window.USRAAuth.user = user;
            window.USRAAuth.isAuthenticated = !!user;
            window.USRAAuth.isLoading = false;
            
            console.log('🔍 Auth state checked:', window.USRAAuth.isAuthenticated ? 'Authenticated' : 'Not authenticated');
            
            // Execute callbacks
            window.USRAAuth.callbacks.forEach(callback => {
                try {
                    callback(window.USRAAuth);
                } catch (error) {
                    console.error('Error in auth callback:', error);
                }
            });
            
            return window.USRAAuth;
        } catch (error) {
            console.error('Error checking auth state:', error);
            window.USRAAuth.isLoading = false;
            return window.USRAAuth;
        }
    }
    
    // Add auth state callback
    function onAuthStateChange(callback) {
        if (typeof callback === 'function') {
            window.USRAAuth.callbacks.push(callback);
            
            // If already loaded, execute immediately
            if (!window.USRAAuth.isLoading) {
                callback(window.USRAAuth);
            }
        }
    }
    
    // Require authentication (redirect to signin if not authenticated)
    function requireAuth(redirectUrl = 'signin.html') {
        onAuthStateChange((auth) => {
            if (!auth.isAuthenticated) {
                console.log('🚫 Authentication required, redirecting to signin');
                window.location.href = redirectUrl;
            }
        });
    }
    
    // Redirect if already authenticated
    function redirectIfAuthenticated(redirectUrl = 'dashboard.html') {
        onAuthStateChange((auth) => {
            if (auth.isAuthenticated) {
                console.log('✅ Already authenticated, redirecting to dashboard');
                window.location.href = redirectUrl;
            }
        });
    }
    
    // Public API
    window.USRAAuth.getCurrentUser = getCurrentUser;
    window.USRAAuth.signInWithEmail = signInWithEmail;
    window.USRAAuth.signUpWithEmail = signUpWithEmail;
    window.USRAAuth.signOut = signOut;
    window.USRAAuth.checkAuthState = checkAuthState;
    window.USRAAuth.onAuthStateChange = onAuthStateChange;
    window.USRAAuth.requireAuth = requireAuth;
    window.USRAAuth.redirectIfAuthenticated = redirectIfAuthenticated;
    
    // Maintain backward compatibility
    window.USRA = {
        supabase: null, // Will be set after initialization
        getCurrentUser,
        signInWithEmail,
        signUpWithEmail,
        signOut
    };
    
    // Initialize when DOM is ready
    function initializeAuth() {
        waitForSupabase(async () => {
            // Set backward compatibility reference
            window.USRA.supabase = window.USRAAuth.supabase;
            window.supabaseClient = window.USRAAuth.supabase;
            
            // Set up auth state listener
            window.USRAAuth.supabase.auth.onAuthStateChange((event, session) => {
                console.log('🔄 Auth state changed:', event, session?.user?.id || 'No user');
                window.USRAAuth.user = session?.user || null;
                window.USRAAuth.isAuthenticated = !!session?.user;
                
                // Execute callbacks
                window.USRAAuth.callbacks.forEach(callback => {
                    try {
                        callback(window.USRAAuth);
                    } catch (error) {
                        console.error('Error in auth state change callback:', error);
                    }
                });
            });
            
            // Initial auth check
            await checkAuthState();
        });
    }
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAuth);
    } else {
        initializeAuth();
    }
    
    console.log('✅ USRA Authentication System loaded');
})();
