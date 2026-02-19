import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Eye, Calendar, Newspaper, TrendingUp } from 'lucide-react';

// -----------------------------------------------------------------------------
// COMPONENT: VIEWER DASHBOARD
// -----------------------------------------------------------------------------
// This is the dashboard for Viewers - users who browse and explore content
// They can see events, reports, and general statistics

export default function ViewerDashboard() {
    // 1. HOOKS & CONTEXT
    const { user } = useAuth();
    const { events, reports } = useData();
    const navigate = useNavigate();

    // 2. STATISTICS
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).length;
    const totalReports = reports.length;

    // Get recent events (next 5 upcoming)
    const recentEvents = events
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);

    // Get recent reports (last 5)
    const recentReports = reports
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    // 3. RENDER
    return (
        <div className="dashboard-container">
            {/* --- WELCOME HEADER --- */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>
                    Welcome, {user.firstName || 'Viewer'}! 👋
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Explore upcoming events and the latest sports news.
                </p>
            </div>

            {/* --- STATISTICS CARDS --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <Calendar size={32} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
                    <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{upcomingEvents}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upcoming Events</p>
                </div>

                <div className="card glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <Newspaper size={32} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
                    <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{totalReports}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>News Articles</p>
                </div>

                <div className="card glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <TrendingUp size={32} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
                    <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Active</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Community Status</p>
                </div>
            </div>

            {/* --- QUICK ACCESS SECTIONS --- */}
            <div className="dashboard-grid">
                {/* LEFT: UPCOMING EVENTS */}
                <div className="main-column">
                    <div className="card glass-panel">
                        <div style={{ padding: '0 0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Calendar size={20} className="text-primary" />
                                <h3 style={{ fontSize: '1.25rem' }}>Upcoming Events</h3>
                            </div>
                            <button onClick={() => navigate('/events')} className="btn btn-outline btn-sm">
                                View All
                            </button>
                        </div>

                        {recentEvents.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                No upcoming events at the moment.
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {recentEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className="card glass-panel"
                                        style={{ padding: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onClick={() => navigate(`/events/${event.id}`)}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                                    >
                                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{event.title}</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            📅 {new Date(event.date).toLocaleDateString()} • 📍 {event.location}
                                        </p>
                                        <span className="badge badge-primary" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                                            {event.sport}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: LATEST NEWS */}
                <div className="side-column">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                            Latest News
                        </h3>
                        <button onClick={() => navigate('/feed')} className="btn btn-ghost btn-sm">
                            View All
                        </button>
                    </div>

                    {recentReports.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                            No news articles yet.
                        </p>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {recentReports.map(report => (
                                <div
                                    key={report.id}
                                    className="card glass-panel"
                                    style={{ padding: '1rem', cursor: 'pointer' }}
                                    onClick={() => navigate(`/reports/${report.id}`)}
                                >
                                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                                        {report.category}
                                    </span>
                                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>{report.title}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- CALL TO ACTION --- */}
            <div className="card glass-panel" style={{ marginTop: '2rem', padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))' }}>
                <Eye size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Explore the Sports Ecosystem</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Discover events, read news coverage, and stay connected with the local sports community.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/events')} className="btn btn-primary">
                        Browse Events
                    </button>
                    <button onClick={() => navigate('/feed')} className="btn btn-outline">
                        Read News
                    </button>
                    <button onClick={() => navigate('/search')} className="btn btn-outline">
                        Search
                    </button>
                </div>
            </div>

            {/* Custom Responsive Layout */}
            <style>{`.dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; } @media (min-width: 1024px) { .dashboard-grid { grid-template-columns: 2fr 1fr; } }`}</style>
        </div>
    );
}
