import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Medal, Newspaper, ArrowRight } from 'lucide-react';

// -----------------------------------------------------------------------------
// HELPER COMPONENT: RoleCard
// -----------------------------------------------------------------------------
// A small, reusable component just for this page to display the role options (Organizer, Athlete, etc.)
// It takes an Icon, Title, Description, and Selection State as props.
const RoleCard = ({ icon: IconComponent, title, description, selected, onClick }) => (
    <div
        onClick={onClick}
        className={`card ${selected ? 'selected' : ''}`}
        style={{
            cursor: 'pointer',
            textAlign: 'center',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            // Visual feedback: If selected, enhance the border and background color.
            border: selected ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
            background: selected ? 'rgba(59, 130, 246, 0.1)' : 'var(--glass-bg)'
        }}
    >
        <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '50%', color: selected ? 'var(--primary)' : 'var(--text-secondary)' }}>
            {React.createElement(IconComponent, { size: 24 })}
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{title}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{description}</p>
    </div>
);

// -----------------------------------------------------------------------------
// PAGE: HOME (Landing Page)
// -----------------------------------------------------------------------------
// This is the first page a user sees if they are NOT logged in.
// It explains what the app is and provides Login/Signup buttons.

export default function Home() {
    const navigate = useNavigate(); // Hook for programmatic navigation (redirects).
    const { user, loading } = useAuth(); // Get the current user from our AuthContext.

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [loading, user, navigate]);

    // LOGIC: Auto-Redirect
    // If a user is already logged in, they shouldn't see this landing page.
    // We redirect them straight to their Dashboard.
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59, 130, 246, 0.3)', borderRadius: '50%', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    if (user) {
        return null; // Don't render anything while redirecting.
    }

    return (
        <div className="container-lg">
            {/* HERO SECTION */}
            <div className="hero-section">
                <h1 className="hero-title" style={{ color: "var(--text-primary)" }}>
                    The Unified Sports Ecosystem
                </h1>
                <p className="hero-subtitle">
                    Connect, Compete, and Cover. The ultimate platform for creating and experiencing sports events.
                </p>

                {/* CALL TO ACTION BUTTONS */}
                <div className="hero-actions">
                    <button onClick={() => navigate('/login')} className="btn btn-outline" style={{ fontSize: '1.1rem' }}>
                        Log In
                    </button>
                    <button onClick={() => navigate('/signup')} className="btn btn-primary" style={{ fontSize: '1.1rem' }}>
                        Sign Up <ArrowRight size={20} />
                    </button>
                </div>
            </div>

            {/* Feature Highlights/Visuals could go here in the future */}
        </div>
    );
}
