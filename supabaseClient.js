// USRA Unified Supabase Client
// Single source of truth for all Supabase operations

(function() {
    'use strict';
    
    console.log('🔐 Initializing USRA Supabase Client...');
    
    // Prevent multiple initializations
    if (window.USRA && window.USRA.supabase) {
        console.log('✅ USRA client already initialized');
        return;
    }
    
    const SUPABASE_URL = 'https://ycdsyaenakevtozcomgk.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZHN5YWVuYWtldnRvemNvbWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzczMjAsImV4cCI6MjA3MjA1MzMyMH0.BxT4n22lnBEDL0TA7LNqIyti0LJ4dxGMgx5tOZiqQzE';
    
    // Wait for Supabase library to load
    function initializeSupabase(callback, attempts = 0) {
        const maxAttempts = 50;
        
        if (attempts >= maxAttempts) {
            console.error('❌ Supabase library failed to load after', maxAttempts, 'attempts');
            return;
        }
        
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            try {
                const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                
                // Test the client
                supabase.auth.getUser().then(() => {
                    console.log('✅ Supabase client initialized and tested successfully');
                }).catch((error) => {
                    console.warn('⚠️ Supabase client initialized but auth test failed:', error);
                });
                
                // Authentication functions
                async function getCurrentUser() {
                    try {
                        const { data: { user }, error } = await supabase.auth.getUser();
                        if (error) throw error;
                        return user;
                    } catch (error) {
                        console.error('Get user error:', error);
                        return null;
                    }
                }

                async function signInWithEmail(email, password) {
                    try {
                        const { data, error } = await supabase.auth.signInWithPassword({ 
                            email: email.trim().toLowerCase(), 
                            password: password 
                        });
                        if (error) throw error;
                        return { data, error: null };
                    } catch (error) {
                        console.error('Sign in error:', error);
                        return { data: null, error };
                    }
                }

                async function signUpWithEmail(email, password, metadata = {}) {
                    try {
                        const { data, error } = await supabase.auth.signUp({ 
                            email: email.trim().toLowerCase(), 
                            password: password, 
                            options: { data: metadata } 
                        });
                        if (error) throw error;
                        return { data, error: null };
                    } catch (error) {
                        console.error('Sign up error:', error);
                        return { data: null, error };
                    }
                }

                async function signOut() {
                    try {
                        const { error } = await supabase.auth.signOut();
                        if (error) throw error;
                        return { error: null };
                    } catch (error) {
                        console.error('Sign out error:', error);
                        return { error };
                    }
                }
                
                // Create unified USRA object
                window.USRA = {
                    supabase,
                    getCurrentUser,
                    signInWithEmail,
                    signUpWithEmail,
                    signOut,
                    initialized: true
                };
                
                // Also create legacy aliases for compatibility
                window.supabaseClient = supabase;
                window.USRAAuth = window.USRA;
                window.USRANavAuth = window.USRA;
                
                if (callback) callback();
                
            } catch (error) {
                console.error('❌ Error creating Supabase client:', error);
            }
        } else {
            // Retry after a short delay
            setTimeout(() => initializeSupabase(callback, attempts + 1), 100);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initializeSupabase());
    } else {
        initializeSupabase();
    }
    
})();
