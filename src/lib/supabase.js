import { createClient } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// SUPABASE CONFIGURATION (SINGLETON)
// -----------------------------------------------------------------------------
// This file sets up the connection to the Supabase backend.
// Supabase is a Backend-as-a-Service (BaaS) built on PostgreSQL.
// IMPORTANT: This client is created ONCE and reused across the entire app.

// 1. GET CREDENTIALS FROM ENVIRONMENT VARIABLES
// These are stored in .env.local and loaded automatically by Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. CREATE SUPABASE CLIENT (SINGLETON)
// This client handles all communication with Supabase (auth, database, storage)
// It's created once and exported as a singleton to prevent multiple instances
let supabaseInstance = null;

const createSupabaseClient = () => {
    if (supabaseInstance) {
        return supabaseInstance;
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            // Store auth tokens in localStorage (persists across page refreshes)
            storage: window.localStorage,
            // Auto-refresh tokens before they expire
            autoRefreshToken: true,
            // Persist session across tabs
            persistSession: true,
            // Detect session changes in other tabs
            detectSessionInUrl: true
        },
        // Enable realtime subscriptions with optimized settings
        realtime: {
            params: {
                eventsPerSecond: 10
            },
            // Heartbeat to keep connection alive
            heartbeatIntervalMs: 30000,
            // Reconnect automatically on connection loss
            reconnectAfterMs: (tries) => {
                // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
                return Math.min(1000 * Math.pow(2, tries), 10000);
            }
        }
    });

    return supabaseInstance;
};

// Export the singleton instance
export const supabase = createSupabaseClient();

// -----------------------------------------------------------------------------
// HELPER: GET IMAGE URL FROM SUPABASE STORAGE
// -----------------------------------------------------------------------------
/**
 * Takes a bucket name and filename, then returns the full public URL
 * to display that image on the screen.
 * 
 * @param {string} bucket - The storage bucket name ('avatars', 'event-images', 'report-images')
 * @param {string} filename - The name of the file saved in that bucket
 * @returns {string|null} - The full public URL to the image, or null if empty
 */
export const getImageUrl = (bucket, filename) => {
    // If no image name is provided, return nothing
    if (!filename) return null;

    // Safety: If the name is already a full URL (like from an external site) 
    // or a Base64 string, just return it as is
    if (filename.startsWith('http') || filename.startsWith('data:')) return filename;

    // Get the public URL from Supabase Storage
    // Result looks like: https://xxx.supabase.co/storage/v1/object/public/bucket/filename
    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl;
};

// -----------------------------------------------------------------------------
// HELPER: UPLOAD FILE TO SUPABASE STORAGE
// -----------------------------------------------------------------------------
/**
 * Uploads a file to Supabase Storage and returns the filename
 * 
 * @param {string} bucket - The storage bucket name
 * @param {File} file - The file object to upload
 * @param {string} userId - The user ID (for organizing files in folders)
 * @returns {Promise<string>} - The uploaded filename
 */
export const uploadFile = async (bucket, file, userId) => {
    if (!file) return null;

    // Validate file is actually a File object
    if (!(file instanceof File)) {
        throw new Error('Invalid file object provided');
    }

    // Create a unique filename: userId/timestamp-random.ext
    const fileExt = file.name.split('.').pop();
    const randomPart = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
        ? globalThis.crypto.randomUUID()
        : Math.random().toString(16).slice(2);
    const fileName = `${userId}/${Date.now()}-${randomPart}.${fileExt}`;

    console.log(`📤 Uploading to bucket: ${bucket}, file: ${fileName}`);

    const uploadPromise = supabase.storage
        .from(bucket)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    const timeoutMs = 45000;
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Upload timed out after ${timeoutMs / 1000}s`)), timeoutMs);
    });

    // Upload to Supabase Storage (with timeout to avoid stuck UI)
    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

    if (error) {
        console.error('❌ Upload error:', error);
        
        // Provide helpful error messages
        if (error.message.includes('row-level security')) {
            throw new Error(`Storage bucket '${bucket}' has incorrect permissions. Please set up storage policies.`);
        } else if (error.message.includes('not found')) {
            throw new Error(`Storage bucket '${bucket}' does not exist. Please create it in Supabase dashboard.`);
        } else if (error.message.includes('403')) {
            throw new Error(`Access denied to bucket '${bucket}'. Make sure it's public and has correct policies.`);
        }
        
        throw error;
    }

    console.log('✅ Upload successful:', data.path);
    return data.path;
};

// -----------------------------------------------------------------------------
// HELPER: DELETE FILE FROM SUPABASE STORAGE
// -----------------------------------------------------------------------------
/**
 * Deletes a file from Supabase Storage
 * 
 * @param {string} bucket - The storage bucket name
 * @param {string} filename - The file path to delete
 */
export const deleteFile = async (bucket, filename) => {
    if (!filename) return;

    const { error } = await supabase.storage
        .from(bucket)
        .remove([filename]);

    if (error) {
        console.error('Delete error:', error);
        throw error;
    }
};
