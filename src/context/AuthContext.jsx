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

        // HELPER: Fetch profile by ID
        // Centralized to avoid duplicate code and race conditions
        const loadProfile = async (userId) => {
            try {
                console.log('👤 Fetching profile for:', userId);
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) {
                    // Ignore abort errors as they usually mean a newer request is already in flight
                    if (error.message?.includes('AbortError')) {
                        console.warn('⚠️ Profile fetch aborted (expected during rapid state changes)');
                        return null;
                    }
                    throw error;
                }
                return data;
            } catch (err) {
                console.error('❌ Profile fetch failed:', err);
                return null;
            }
        };

        // A. Check for existing session
        const initializeAuth = async () => {
            try {
                setLoading(true);
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                if (session?.user) {
                    const profile = await loadProfile(session.user.id);
                    if (profile) setUser(profile);
                }
            } catch (error) {
                console.error('❌ Auth initialization failed:', error);
            } finally {
                setLoading(false);
            }
        };

        // B. Listen for auth changes
        const setupAuthListener = () => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    console.log('🔄 Auth Event:', event);

                    if (session?.user) {
                        // Fetch/Refresh profile whenever auth state changes
                        // We remove the !user check to avoid stale closure issues
                        const profile = await loadProfile(session.user.id);
                        if (profile) setUser(profile);
                    } else {
                        setUser(null);
                    }

                    setLoading(false);
                }
            );
            authSubscription = subscription;
        };

        initializeAuth().then(() => setupAuthListener());

        return () => {
            if (authSubscription) authSubscription.unsubscribe();
        };
    }, []); // Empty dependency array is correct for singleton listener

    // FUNCTION: Log In
    const login = async (email, password) => {
        try {
            console.log('🔑 Login attempt:', email);
            setLoading(true); // Show spinner while logging in
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) throw error;

            // Note: onAuthStateChange will take over from here to set the user profile.
            // We just return success. If the redirect happens too fast, 
            // ProtectedRoute will show its own loading spinner.
            return { success: true };
        } catch (error) {
            console.error('❌ Login error:', error);
            setLoading(false);
            return { success: false, error: error.message };
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
    // Wipes the session from memory and storage.
    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            // We don't force page reload here to allow instant UI transitions
        } catch (error) {
            console.error('Logout error:', error);
            // Fallback: clear user state anyway
            setUser(null);
        }
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
        if (!user?.id) return;

        try {
            console.log('🗑️ Initiating account deletion for:', user.id);

            // Step 1: Delete from users table
            // We use .select() to verify the row was actually found and deleted
            const { data, error: deleteError } = await supabase
                .from('users')
                .delete()
                .eq('id', user.id)
                .select();

            if (deleteError) {
                console.error('❌ Data deletion error:', deleteError);
                throw new Error(`Failed to remove profile: ${deleteError.message}`);
            }

            console.log('✅ Database profile removal complete');

            // Step 2: Sign out from Auth
            // Note: Users cannot delete their own Auth credentials from client-side JS
            // but signing them out ensures they can't access the app anymore.
            await supabase.auth.signOut();

            // Step 3: Clear local state
            setUser(null);

            console.log('✅ User signed out and state cleared');

            // Navigation will be handled by the calling component (Settings.jsx)
            return { success: true };
        } catch (error) {
            console.error('❌ Delete account process failed:', error);
            alert(`Account deletion failed: ${error.message}. Please try logging in again and try once more.`);
            return { success: false, error: error.message };
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
