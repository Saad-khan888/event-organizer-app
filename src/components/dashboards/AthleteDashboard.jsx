import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTicketing } from '../../context/TicketingContext';
import { Calendar, MapPin, CheckCircle } from 'lucide-react';

// -----------------------------------------------------------------------------
// COMPONENT: ATHLETE DASHBOARD
// -----------------------------------------------------------------------------
// A personalized view for Athletes.
// It shows: 1. Events they have already joined.
//          2. New upcoming events that match their sports category.

export default function AthleteDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth(); // Current logged-in athlete
    const { events } = useData(); // Global events
    const { hasJoinedEvent, getEventParticipationStatus } = useTicketing();

    // DATA FILTERING
    // A. "My Events" = All events where my ID is in the participants list.
    const myEvents = events.filter(e => e.participants?.includes(user?.id));

    // B. "Available Events" = All events I haven't joined yet that match my category (e.g. Boxing).
    const availableEvents = events.filter(e => {
        if (e.participants?.includes(user?.id)) return false;
        return (user.category === 'All' || !user.category || e.category === user.category);
    });

    return (
        <div>
            {/* --- WELCOME BANNER --- */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ color: "var(--text-primary)", fontSize: '2rem' }}>Welcome, {user.firstName}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Track your victories and find your next challenge.</p>
            </div>

            {/* --- SECTION 1: JOINED EVENTS --- */}
            <h3 style={{ marginBottom: '1rem' }}>My Registered Events</h3>
            {myEvents.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>You haven't joined any events yet.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                    {myEvents.map(ev => (
                        <div key={ev.id} className="card glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>{ev.title}</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{ev.date} @ {ev.location}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-accent)', fontSize: '0.9rem' }}>
                                <CheckCircle size={16} /> Status: Participating
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- SECTION 2: NEW OPPORTUNITIES --- */}
            <h3 style={{ marginBottom: '1rem' }}>New Events in {user.category || 'your sport'}</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
                {availableEvents.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No new events available right now.</p>
                ) : (
                    availableEvents.map(ev => (
                        <div key={ev.id} className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <span className="badge badge-secondary">{ev.category}</span>
                                    <h4 style={{ fontSize: '1.4rem', marginTop: '0.5rem' }}>{ev.title}</h4>
                                </div>
                                {ev.participants?.includes(user?.id) ? (
                                    <div className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                                        <CheckCircle size={14} /> Participating
                                    </div>
                                ) : (
                                    <button onClick={() => navigate(`/events/${ev.id}`)} className="btn btn-primary">View Details</button>
                                )}
                            </div>

                            <p style={{ color: 'var(--text-secondary)' }}>{ev.description}</p>

                            {/* Card Footer Info */}
                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> {ev.date}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MapPin size={16} /> {ev.location}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
