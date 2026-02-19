import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useTicketing } from '../context/TicketingContext';
import { getImageUrl } from '../lib/supabase';
import { Search as SearchIcon, MapPin, Calendar, Tag, CheckCircle, AlertCircle, Filter, Briefcase } from 'lucide-react';

// -----------------------------------------------------------------------------
// PAGE: EVENTS (Public Listing)
// -----------------------------------------------------------------------------
// This page displays ALL upcoming sports events.
// It includes Filtering (by Sport, Location, Search) and Joining logic.

export default function Events() {
    // 1. HOOKS
    const navigate = useNavigate();
    const { events, users } = useData(); // Get data from global store
    const { user } = useAuth(); // Get current user info
    const { hasJoinedEvent, getEventParticipationStatus } = useTicketing();

    // 2. STATE (Local Filters)
    const [filters, setFilters] = useState({
        sport: '',
        location: '',
        search: ''
    });

    // 4. SORTING & FILTERING

    // Sort: Newest/Upcoming first
    const sortedEvents = [...events].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Filter: Apply search terms
    const filteredEvents = sortedEvents.filter(ev => {
        // Filter by Sport Category dropdown
        const matchSport = filters.sport ? ev.category === filters.sport : true;

        // Filter by Location text (case-insensitive)
        const matchLocation = filters.location ? ev.location.toLowerCase().includes(filters.location.toLowerCase()) : true;

        // Filter by Search text (checks Title AND Description)
        const matchSearch = filters.search ? (
            ev.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            ev.description.toLowerCase().includes(filters.search.toLowerCase())
        ) : true;

        return matchSport && matchLocation && matchSearch;
    });

    // 5. RENDER
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            {/* --- HEADER --- */}
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ color: "var(--text-primary)", fontSize: '2.5rem', marginBottom: '1rem' }}>
                    Upcoming Sports Events
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    Discover and join competitions in your sports category.
                </p>
            </div>

            {/* --- FILTERS TOOLBAR --- */}
            <div className="card glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>

                    {/* Search Input */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <SearchIcon size={16} /> Search
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Event title or description..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    {/* Sport Dropdown */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Tag size={16} /> Sport Category
                        </label>
                        <select
                            className="form-select"
                            value={filters.sport}
                            onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                        >
                            <option value="">All Sports</option>
                            {/* Predefined list of sports */}
                            {['Boxing', 'MMA', 'Tennis', 'Badminton', 'Gymnastics'].map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Location Input */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={16} /> City / Location
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Filter by city..."
                            value={filters.location}
                            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* --- EVENTS GRID --- */}
            <div className="grid grid-auto-fill gap-3">

                {filteredEvents.length > 0 ? (
                    // Loop through filtered events and render cards
                    filteredEvents.map(event => {
                        return (
                            <div
                                key={event.id}
                                className="card"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    overflow: 'visible'
                                }}
                                onClick={() => navigate(`/events/${event.id}`)}
                            >
                                {/* Category Badge (Top Right) */}
                                <div className="badge badge-primary" style={{
                                    position: 'absolute',
                                    top: 'var(--space-2)',
                                    right: 'var(--space-2)',
                                    zIndex: 2
                                }}>
                                    <Tag size={12} /> {event.category}
                                </div>

                                {/* Organizer Info (Top Left) */}
                                <div style={{
                                    padding: 'var(--space-2)',
                                    paddingBottom: 'var(--space-1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)'
                                }}>
                                    {(() => {
                                        const organizer = users.find(u => u.id === event.organizer);
                                        return (
                                            <>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'var(--bg-tertiary)',
                                                    border: '1px solid var(--border)',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    {(() => {
                                                        let src = null;
                                                        if (organizer) {
                                                            if (organizer.avatar) src = getImageUrl('avatars', organizer.avatar);
                                                            else if (organizer.profilePicture) src = getImageUrl('avatars', organizer.profilePicture);
                                                        }

                                                        return src ? (
                                                            <img src={src} alt="Org" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <Briefcase size={20} style={{ color: 'var(--text-secondary)' }} />
                                                        );
                                                    })()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--text-secondary)',
                                                        display: 'block',
                                                        lineHeight: 1
                                                    }}>Organized by</span>
                                                    <span style={{
                                                        fontSize: '0.95rem',
                                                        fontWeight: '600',
                                                        display: 'block',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>{organizer?.companyName || 'Unknown Org'}</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Event Details (Body) */}
                                <div style={{ padding: '0 var(--space-2) var(--space-2)', flex: 1 }}>
                                    <h3 style={{
                                        fontSize: '1.25rem',
                                        fontWeight: '600',
                                        marginBottom: 'var(--space-1)',
                                        paddingRight: '3rem',
                                        lineHeight: 1.3
                                    }}>{event.title}</h3>

                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        marginBottom: 'var(--space-2)',
                                        lineHeight: '1.5',
                                        fontSize: '0.9rem',
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical'
                                    }}>
                                        {event.description}
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                            <Calendar size={16} style={{ color: 'var(--md-primary)', flexShrink: 0 }} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                {event.time && ` • ${event.time}`}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                            <MapPin size={16} style={{ color: 'var(--md-primary)', flexShrink: 0 }} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.location}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer: Participants & Join Button */}
                                <div style={{
                                    padding: 'var(--space-2)',
                                    borderTop: '1px solid var(--divider)',
                                    background: 'var(--bg-secondary)'
                                }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>

                                        {/* Participants Facepile */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                            <div style={{ display: 'flex', paddingLeft: '8px' }}>
                                                {event.participants && event.participants.slice(0, 4).map((pid, idx) => {
                                                    const pUser = users.find(u => u.id === pid);

                                                    let pSrc = null;
                                                    if (pUser) {
                                                        if (pUser.avatar) pSrc = getImageUrl('avatars', pUser.avatar);
                                                        else if (pUser.profilePicture) pSrc = getImageUrl('avatars', pUser.profilePicture);
                                                    }

                                                    return (
                                                        <div key={pid} style={{
                                                            width: '28px', height: '28px', borderRadius: '50%',
                                                            background: 'var(--bg-tertiary)', border: '2px solid var(--bg-elevated)',
                                                            marginLeft: '-8px', overflow: 'hidden', position: 'relative', zIndex: 10 - idx
                                                        }} title={pUser?.firstName}>
                                                            {pSrc ? (
                                                                <img src={pSrc} alt="P" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : <div style={{ width: '100%', height: '100%', background: 'var(--md-primary)', opacity: 0.5 }} />}
                                                        </div>
                                                    );
                                                })}
                                                {event.participants && event.participants.length > 4 && (
                                                    <div style={{
                                                        width: '28px', height: '28px', borderRadius: '50%',
                                                        background: 'var(--bg-tertiary)', border: '2px solid var(--bg-elevated)',
                                                        marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.7rem', fontWeight: 'bold', zIndex: 0
                                                    }}>
                                                        +{event.participants.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '4px' }}>
                                                <strong>{event.participants ? event.participants.length : 0}</strong> joined
                                            </div>
                                        </div>

                                        {(() => {
                                            if (!user) return null;

                                            const isAthlete = user.role === 'athlete';
                                            const isAthleteJoined = isAthlete && event.participants?.includes(user?.id);

                                            if (isAthleteJoined) {
                                                return (
                                                    <div className="badge badge-secondary" style={{
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}>
                                                        <CheckCircle size={14} /> Joined
                                                    </div>
                                                );
                                            }

                                            // Athletes don't have tickets/pending statuses
                                            if (isAthlete) return null;

                                            const status = getEventParticipationStatus
                                                ? getEventParticipationStatus(event.id).status
                                                : (hasJoinedEvent(event.id) ? 'joined' : 'not_joined');

                                            if (status === 'joined') {
                                                return (
                                                    <div className="badge badge-secondary" style={{
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}>
                                                        <CheckCircle size={14} /> Joined
                                                    </div>
                                                );
                                            }

                                            if (status === 'pending_verification') {
                                                return (
                                                    <div className="badge badge-secondary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                        Pending verification
                                                    </div>
                                                );
                                            }

                                            if (status === 'pending_payment') {
                                                return (
                                                    <div className="badge badge-secondary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                        Pending payment
                                                    </div>
                                                );
                                            }

                                            return null;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    // EMPTY STATE (No events found)
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                        <div style={{ marginBottom: 'var(--space-2)', opacity: 0.5 }}>
                            <SearchIcon size={48} style={{ margin: '0 auto' }} />
                        </div>
                        <h3>No events found</h3>
                        <p>Try adjusting filters to see more results.</p>
                        <button
                            className="btn btn-ghost"
                            style={{ marginTop: 'var(--space-2)' }}
                            onClick={() => setFilters({ sport: '', location: '', search: '' })}
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
