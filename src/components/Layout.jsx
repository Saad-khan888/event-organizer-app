import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../lib/supabase';
import { Menu, X, User, LogOut, LayoutDashboard, Globe, Search as SearchIcon, Calendar, Settings, Trash2, RefreshCw, Ticket, CreditCard } from 'lucide-react';

// -----------------------------------------------------------------------------
// COMPONENT: NAVBAR
// -----------------------------------------------------------------------------
// The main navigation bar that stays at the top of every page.
// It changes based on whether the user is logged in or out.

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = React.useState(false);

    const isActive = (path) => location.pathname === path;

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => menuOpen && setMenuOpen(false);
        if (menuOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [menuOpen]);

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 'var(--z-sticky)',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--divider)',
            boxShadow: 'var(--elevation-1)'
        }}>
            {/* Top Bar */}
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '64px'
            }}>
                {/* Logo */}
                <Link to="/" style={{
                    color: "var(--text-primary)",
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    letterSpacing: '-0.5px'
                }}>
                    SportsApp
                </Link>

                {/* Right Side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {user ? (
                        <>
                            {/* Profile Avatar */}
                            <Link
                                to={`/profile/${user.id}`}
                                title="My Profile"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '4px',
                                    borderRadius: '50%',
                                    transition: 'transform var(--transition-fast)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'var(--bg-tertiary)',
                                    overflow: 'hidden',
                                    border: '2px solid var(--md-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {(() => {
                                        let src = null;
                                        if (user.avatar) src = getImageUrl('avatars', user.avatar);
                                        else if (user.profilePicture) src = getImageUrl('avatars', user.profilePicture);

                                        return src ? (
                                            <img src={src} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <User size={20} style={{ color: 'var(--text-secondary)' }} />
                                        );
                                    })()}
                                </div>
                            </Link>

                            {/* Menu Toggle */}
                            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="btn-icon btn-ghost"
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    aria-label="Menu"
                                >
                                    {menuOpen ? <X size={24} /> : <Menu size={24} />}
                                </button>

                                {/* Dropdown Menu */}
                                {menuOpen && (
                                    <div className="menu-dropdown">
                                        <Link to="/settings" className="menu-item" onClick={() => setMenuOpen(false)}>
                                            <Settings size={20} /> Settings
                                        </Link>

                                        {user.role !== 'athlete' && (
                                            <Link to="/my-tickets" className="menu-item" onClick={() => setMenuOpen(false)}>
                                                <Ticket size={20} /> My Tickets
                                            </Link>
                                        )}

                                        {user.role === 'organizer' && (
                                            <Link to="/verify-payments" className="menu-item" onClick={() => setMenuOpen(false)}>
                                                <CreditCard size={20} /> Verify Payments
                                            </Link>
                                        )}

                                        <div style={{ height: '1px', background: 'var(--divider)', margin: '8px 0' }}></div>

                                        <button onClick={() => { logout(); navigate('/'); }} className="menu-item" style={{ color: 'var(--md-error)' }}>
                                            <LogOut size={20} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Link to="/login" className="btn btn-ghost">Log In</Link>
                            <Link to="/signup" className="btn btn-primary">Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation (Logged In Users Only) */}
            {user && (
                <div className="container" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px 0',
                    borderTop: '1px solid var(--divider)',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    <Link
                        to="/feed"
                        className={`btn ${isActive('/feed') ? 'btn-primary' : 'btn-ghost'}`}
                        style={{
                            flex: '1 1 0',
                            minWidth: 'fit-content',
                            maxWidth: '200px'
                        }}
                    >
                        <Globe size={20} />
                        <span className="nav-label">Feed</span>
                    </Link>
                    <Link
                        to="/events"
                        className={`btn ${isActive('/events') ? 'btn-primary' : 'btn-ghost'}`}
                        style={{
                            flex: '1 1 0',
                            minWidth: 'fit-content',
                            maxWidth: '200px'
                        }}
                    >
                        <Calendar size={20} />
                        <span className="nav-label">Events</span>
                    </Link>
                    <Link
                        to="/search"
                        className={`btn ${isActive('/search') ? 'btn-primary' : 'btn-ghost'}`}
                        style={{
                            flex: '1 1 0',
                            minWidth: 'fit-content',
                            maxWidth: '200px'
                        }}
                    >
                        <SearchIcon size={20} />
                        <span className="nav-label">Search</span>
                    </Link>
                    <Link
                        to="/dashboard"
                        className={`btn ${isActive('/dashboard') ? 'btn-primary' : 'btn-ghost'}`}
                        style={{
                            flex: '1 1 0',
                            minWidth: 'fit-content',
                            maxWidth: '200px'
                        }}
                    >
                        <LayoutDashboard size={20} />
                        <span className="nav-label">Dashboard</span>
                    </Link>
                </div>
            )}
        </nav>
    );
};

// -----------------------------------------------------------------------------
// COMPONENT: LAYOUT (Wrapper)
// -----------------------------------------------------------------------------
// This wraps every page in the app.
// It ensures the Navbar is always at the top and the Footer is at the bottom.

export default function Layout({ children }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            {/* Main Content */}
            <main style={{
                flex: 1,
                paddingTop: 'var(--space-3)',
                paddingBottom: 'var(--space-4)'
            }} className="container">
                {children}
            </main>

            {/* Footer */}
            <footer style={{
                padding: 'var(--space-4) 0',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                borderTop: '1px solid var(--divider)',
                background: 'var(--bg-secondary)',
                marginTop: 'auto',
                fontSize: '14px'
            }}>
                <div className="container">
                    <p>© 2026 SportsApp Platform. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
