import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// -----------------------------------------------------------------------------
// AUTHENTICATION CONTEXT
// -----------------------------------------------------------------------------
// This file manages the "Global State" for user authentication.
// Think of it as a secure vault that holds the current user's information
// and provides keys (functions) to login, signup, and logout from anywhere in the app.

// 1. Create the Context
// This creates a "Data Layer" that can be accessed by any component in the app.
const AuthContext = createContext();

// 2. Custom Hook
// This is a shortcut so other components can just import `useAuth()`
// instead of importing both React and the Context object every time.
export const useAuth = () => useContext(AuthContext);

// 3. The Provider Component
// This component wraps the entire application (see App.jsx).
// It grants all child components access to the user state and auth functions.
export const AuthProvider = ({ children }) => {
    // STATE: Holds the current logged-in user object (or null if logged out).
    const [user, setUser] = useState(null);

    // STATE: Tracks if the app is still checking for a session (loading).
    // While true, we usually show a spinner so the user doesn't see a "flash" of the login screen.
    const [loading, setLoading] = useState(true);

    // EFFECT: Runs once when the app starts.
    useEffect(() => {
        let authSubscription = null;

        // A. Check for existing session (CRITICAL: Must complete before Realtime subscriptions)
        const initializeAuth = async () => {
            try {
                console.log('🔐 Initializing auth session...');
                
                // Get the current session from Supabase
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('❌ Session error:', sessionError);
                    throw sessionError;
                }

                if (session?.user) {
                    console.log('✅ Session found for user:', session.user.id);
                    
                    // Fetch the full user profile from our users table
                    const { data: profile, error: profileError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profileError) {
                        console.error('❌ Profile fetch error:', profileError);
                    } else {
                        console.log('✅ Profile loaded:', profile.email);
                        setUser(profile);
                    }
                } else {
                    console.log('ℹ️ No active session found');
                }
            } catch (error) {
                console.error('❌ Error initializing auth:', error);
            } finally {
                // CRITICAL: Set loading to false AFTER session restoration completes
                // This ensures UI doesn't freeze and other contexts can proceed
                setLoading(false);
                console.log('✅ Auth initialization complete');
            }
        };

        // B. Listen for auth changes (login/logout in other tabs, token expiry)
        const setupAuthListener = () => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    console.log('🔄 Auth state changed:', event);
                    
                    if (session?.user) {
                        // User logged in - fetch their profile
                        const { data: profile } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                        setUser(profile);
                    } else {
                        // User logged out
                        setUser(null);
                    }
                }
            );

            authSubscription = subscription;
        };

        // Initialize auth first, then set up listener
        initializeAuth().then(() => {
            setupAuthListener();
        });

        // Cleanup: Stop listening when component unmounts
        return () => {
            if (authSubscription) {
                authSubscription.unsubscribe();
            }
        };
    }, []);

    // FUNCTION: Log In
    // Takes email/password, sends them to Supabase.
    const login = async (email, password) => {
        try {
            console.log('🔐 Attempting login for:', email);

            // Sign in with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                console.error('❌ Auth error:', authError);
                throw authError;
            }

            console.log('✅ Auth successful, user ID:', authData.user.id);

            // Fetch the user profile from our users table
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (profileError) {
                console.error('❌ Profile fetch error:', profileError);
                throw profileError;
            }

            if (!profile) {
                console.error('❌ No profile found for user:', authData.user.id);
                throw new Error('User profile not found. Please complete signup.');
            }

            console.log('✅ Profile loaded:', profile.email, 'Role:', profile.role);
            setUser(profile);
            return { success: true };
        } catch (error) {
            console.error('❌ Login failed:', error);
            let msg = 'Login failed. Please check your credentials.';
            if (error.message.includes('Invalid login credentials')) {
                msg = 'Invalid email or password.';
            } else if (error.message.includes('Email not confirmed')) {
                msg = 'Please confirm your email address before logging in.';
            } else if (error.message.includes('User profile not found')) {
                msg = error.message;
            }
            return { success: false, error: msg };
        }
    };

    // FUNCTION: Sign Up
    // Creates a new user account in Supabase Auth and our users table.
    const signup = async (userData) => {
        try {
            const { email, password, avatar, ...profileData } = userData;

            // 1. Create auth user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password
            });

            if (authError) throw authError;

            // 2. Handle avatar upload if provided
            let avatarPath = null;
            if (avatar instanceof File) {
                const fileExt = avatar.name.split('.').pop();
                const fileName = `${authData.user.id}/${Date.now()}.${fileExt}`;

                try {
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, avatar, {
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        console.error('Avatar upload error:', uploadError);
                        throw new Error(`Avatar upload failed: ${uploadError.message}. Please check if 'avatars' storage bucket exists and is public.`);
                    }
                    
                    avatarPath = uploadData.path;
                } catch (uploadErr) {
                    console.error('Avatar upload failed:', uploadErr);
                    // Continue with signup even if avatar upload fails
                    console.warn('Continuing signup without avatar...');
                }
            }

            // 3. Create user profile in our users table
            const { error: profileError } = await supabase
                .from('users')
                .insert([{
                    id: authData.user.id,
                    email: email,
                    avatar: avatarPath,
                    ...profileData
                }]);

            if (profileError) throw profileError;

            // 4. Auto-login after signup
            await login(email, password);

            return { success: true };
        } catch (error) {
            console.error('Signup failed:', error);
            return {
                success: false,
                error: error.message || 'Signup failed.',
                details: error
            };
        }
    };

    // FUNCTION: Log Out
    // Wipes the session from memory and storage, then reloads the page.
    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        window.location.href = '/'; // Force page reload to ensure all states are reset
    };

    const requestPasswordReset = async (email) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Password reset request failed:', error);
            return { success: false, error: error.message };
        }
    };

    // FUNCTION: Update Profile
    // Allows users to change their bio, name, or avatar.
    const updateProfile = async (id, data) => {
        try {
            const { data: record, error } = await supabase
                .from('users')
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Update local user state
            setUser(record);
            return { success: true, record };
        } catch (error) {
            console.error('Update profile failed:', error);
            return { success: false, error: error.message };
        }
    };

    // FUNCTION: Delete Account
    // Permanently removes the user from the database and auth.
    const deleteAccount = async () => {
        if (user) {
            try {
                console.log('🗑️ Deleting account for user:', user.id);

                // Step 1: Delete from users table first
                // (This cascades to delete related data via foreign keys)
                const { data, error: deleteError } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', user.id);

                console.log('Delete response:', { data, error: deleteError });

                if (deleteError) {
                    console.error('❌ Error deleting user profile:', deleteError);
                    alert('Failed to delete account: ' + deleteError.message);
                    throw deleteError;
                }

                console.log('✅ User profile deleted');

                // Step 2: Delete from Supabase Auth
                // Note: Supabase doesn't allow users to delete their own auth account from client
                // The email will remain reserved in auth.users
                // User will need to contact support or use a different email to sign up again
                
                // Sign out
                await supabase.auth.signOut();
                console.log('✅ User signed out');

                // Clear local state
                setUser(null);
                
                // Show success message with note about email
                alert('Your account has been deleted successfully.\n\nNote: Your email address is now deactivated. To create a new account, please use a different email address or contact support to fully remove your email from the system.');
                
                // Redirect to home
                window.location.href = '/';
            } catch (error) {
                console.error('❌ Delete account failed:', error);
                alert('Failed to delete account: ' + error.message);
            }
        }
    };

    // EXPORT
    // We package all these variables and functions into an object
    // and pass it to the Provider. Any child component can now access them.
    return (
        <AuthContext.Provider value={{
            user,            // The current user object (id, email, name, avatar...)
            loading,         // Are we still checking if logged in?
            login,           // Function to log in
            signup,          // Function to sign up
            logout,          // Function to log out
            requestPasswordReset,
            updateProfile,   // Function to edit profile
            deleteAccount    // Function to delete account 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
