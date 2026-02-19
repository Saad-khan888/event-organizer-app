import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getImageUrl } from '../lib/supabase';
import { User, LogOut, Trash2, RefreshCw, ChevronRight, Shield, Bell, Lock, Moon, Sun } from 'lucide-react';

// -----------------------------------------------------------------------------
// PAGE: SETTINGS
// -----------------------------------------------------------------------------
// This page manages global account settings and user preferences.
// It includes: Theme Toggling, Logging Out, and Account Deletion.

export default function Settings() {
    // 1. HOOKS
    const { user, logout, deleteAccount } = useAuth(); // Auth-related actions
    const { theme, toggleTheme } = useTheme();       // Theme-related actions
    const navigate = useNavigate();

    // 2. HANDLERS

    // Permanently remove the user from the system
    const handleDeleteAccount = async () => {
        if (window.confirm("⚠️ WARNING: Delete Account?\n\nThis will permanently delete your profile and all associated data.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?")) {
            try {
                const result = await deleteAccount();
                if (result?.success) {
                    alert('Your account has been deleted successfully.');
                    navigate('/');
                }
            } catch (error) {
                console.error('Delete account error:', error);
                alert('Failed to delete account. Please try again or contact support.');
            }
        }
    };

    // End the current session
    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to log out?")) {
            await logout();
            navigate('/login');
        }
    };

    // Safety check: ensure user object exists
    if (!user) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Please log in to view settings.</div>;
    }

    // 3. RENDER
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ color: "var(--text-primary)", marginBottom: '2rem', textAlign: 'center' }}>Settings & Preferences</h1>

            {/* --- USER ACCOUNT SUMMARY --- */}
            <div className="card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '2rem', background: 'var(--bg-secondary)', flexWrap: 'wrap' }}>
                {/* Profile Photo Display */}
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {user.avatar || user.profilePicture ?
                        <img src={getImageUrl('avatars', user.avatar || user.profilePicture)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <User size={40} color="white" />
                    }
                </div>
                {/* Info & View Profile Link */}
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', wordBreak: 'break-word' }}>{user.firstName || user.companyName} {user.lastName}</h2>
                    <p style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user.role} Account</p>
                </div>
                <button onClick={() => navigate(`/profile/${user.id}`)} className="btn btn-outline btn-full-mobile" style={{ flexShrink: 0 }}>
                    View Profile
                </button>
            </div>

            {/* --- SETTINGS GROUPS --- */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>

                {/* 1. VISUAL PREFERENCES */}
                <div className="card" style={{ background: 'var(--bg-secondary)' }}>
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Preferences</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {/* Dark Mode Toggle Switch */}
                        <button onClick={toggleTheme} className="btn btn-ghost" style={{ justifyContent: 'space-between', padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                                <span>Dark Mode</span>
                            </div>
                            {/* Visual Switch Component */}
                            <div style={{ position: 'relative', width: '40px', height: '20px', background: theme === 'dark' ? 'var(--primary)' : 'var(--text-secondary)', borderRadius: '20px', transition: 'background 0.3s' }}>
                                <div style={{
                                    position: 'absolute', top: '2px', left: theme === 'dark' ? '22px' : '2px',
                                    width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'left 0.3s'
                                }} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* 2. ACCOUNT ACTIONS (LOGOUT) */}
                <div className="card" style={{ background: 'var(--bg-secondary)' }}>
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Account Actions</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button onClick={handleLogout} className="btn btn-ghost" style={{ justifyContent: 'space-between', padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <LogOut size={20} />
                                <span>Log Out</span>
                            </div>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* 3. DANGER ZONE (DESTRUCTIVE ACTIONS) */}
                <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'var(--bg-secondary)' }}>
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', color: 'var(--accent)' }}>Danger Zone</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button onClick={handleDeleteAccount} className="btn btn-ghost" style={{ justifyContent: 'space-between', padding: '1rem', color: 'var(--accent)' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', minWidth: 0, flex: 1 }}>
                                <Trash2 size={20} style={{ flexShrink: 0 }} />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <span style={{ display: 'block', wordBreak: 'break-word' }}>Delete Account</span>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.8, wordBreak: 'break-word' }}>Permanently delete your account and data</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
