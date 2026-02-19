import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../lib/supabase';
import { MapPin, Calendar, Tag, CheckCircle, AlertCircle, ArrowLeft, User, Briefcase, Clock, Ticket } from 'lucide-react';
import { useTicketing } from '../context/TicketingContext';
import TicketPurchase from '../components/ticketing/TicketPurchase';

// -----------------------------------------------------------------------------
// PAGE: EVENT DETAILS
// -----------------------------------------------------------------------------
// This page shows the full information for a single sports event.
// Users can see who's organizing it, who else is participating, 
// and join the event if they are eligible.

export default function EventDetails() {
    // 1. HOOKS & PARAMETERS
    const { id } = useParams(); // Get the unique Event ID from the URL
    const navigate = useNavigate();
    const { events, users, joinEvent } = useData(); // Global Data
    const { user } = useAuth(); // Current logged-in user

    // 2. STATE (Local to this event)
    const event = events.find(e => e.id === id); // Find the specific event object
    const [showTicketPurchase, setShowTicketPurchase] = useState(false);
    const { getEventTicketTypes, loading: ticketingLoading, hasJoinedEvent, getEventParticipationStatus } = useTicketing();

    // Check if event has tickets
    const hasTickets = !ticketingLoading && event ? getEventTicketTypes(event.id).length > 0 : false;

    const organizer = event ? users.find(u => u.id === event.organizer) : null;
    const participantsList = event?.participants && event.participants.length > 0
        ? users.filter(u => event.participants.includes(u.id))
        : [];

    // Error Handling: If the ID in the URL is wrong
    if (!event) {
        return (
            <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1rem' }}>Event not found</h2>
                <button onClick={() => navigate('/events')} className="btn btn-outline">Back to Events</button>
            </div>
        );
    }

    // 4. ELIGIBILITY LOGIC
    const isAthlete = user?.role === 'athlete';
    const isAthleteJoined = isAthlete && event.participants?.includes(user?.id);

    const participationStatus = user && getEventParticipationStatus
        ? getEventParticipationStatus(event.id).status
        : (user && hasJoinedEvent(event.id) ? 'joined' : 'not_joined');

    const isJoined = participationStatus === 'joined' || isAthleteJoined;

    // Format the timestamp for human reading
    const eventDate = new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 5. RENDER
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Navigation Header */}
            <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: 0 }}>
                <ArrowLeft size={20} />
            </button>

            {/* Ticket Purchase Modal */}
            {showTicketPurchase && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card glass-panel" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <TicketPurchase
                            event={event}
                            onClose={() => setShowTicketPurchase(false)}
                            onPurchaseComplete={() => {
                                // Optional: navigate to payment submission or show success message
                                // For now, the component handles the alert
                            }}
                        />
                    </div>
                </div>
            )}

            {/* --- MAIN EVENT CARD --- */}
            <div className="card glass-panel" style={{ padding: '0', overflow: 'hidden' }}>

                {/* A. Top Header (Titles & Badges) */}
                <div style={{ padding: '3rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span className="badge badge-primary">{event.category}</span>
                        {isJoined && <span className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={12} /> Joined</span>}
                    </div>

                    <h1 style={{ fontSize: '2.5rem', lineHeight: '1.2', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>{event.title}</h1>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={20} className="text-primary" />
                            <span>{eventDate} {event.time && `at ${event.time}`}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={20} className="text-primary" />
                            <span>{event.location}</span>
                        </div>
                    </div>
                </div>

                {/* B. Organizer Info Bar */}
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-tertiary)', overflow: 'hidden', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(() => {
                            let src = null;
                            if (organizer) {
                                if (organizer.avatar) src = getImageUrl('avatars', organizer.avatar);
                                else if (organizer.profilePicture) src = getImageUrl('avatars', organizer.profilePicture);
                            }
                            return src ? <img src={src} alt="Org" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Briefcase size={24} />;
                        })()}
                    </div>
                    <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block' }}>Organized by</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{organizer ? (organizer.companyName || `${organizer.firstName} ${organizer.lastName}`) : 'Unknown Organizer'}</span>
                    </div>
                </div>

                {/* C. The Big "About" Description Text */}
                <div style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>About this Event</h3>
                    <p style={{ lineHeight: '1.8', color: 'var(--text-primary)', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
                        {event.description}
                    </p>

                    {(event.prize_first || event.prize_second || event.prize_third) && (
                        <div style={{ marginTop: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Prizes</h3>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {event.prize_first && (
                                    <div className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                                        <span className="badge badge-primary">1st (Gold)</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{event.prize_first}</span>
                                    </div>
                                )}
                                {event.prize_second && (
                                    <div className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                                        <span className="badge badge-secondary">2nd (Silver)</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{event.prize_second}</span>
                                    </div>
                                )}
                                {event.prize_third && (
                                    <div className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                                        <span className="badge badge-outline">3rd (Bronze)</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{event.prize_third}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* D. Bottom Action Bar (Ticket Purchase Only) */}
                <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>

                    {/* CASE 1: USER IS ALREADY JOINED */}
                    {isJoined ? (
                        <button disabled className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'default', borderColor: 'var(--success)', color: 'var(--success)' }}>
                            <CheckCircle size={20} /> You have joined this event
                        </button>
                    ) : (
                        <>
                            {participationStatus === 'pending_verification' ? (
                                <button disabled className="btn btn-outline" style={{ cursor: 'default' }}>
                                    Pending verification
                                </button>
                            ) : participationStatus === 'pending_payment' ? (
                                <button disabled className="btn btn-outline" style={{ cursor: 'default' }}>
                                    Pending payment
                                </button>
                            ) : null}

                            {ticketingLoading ? (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    Loading...
                                </p>
                            ) : isAthlete ? (
                                user ? (
                                    <button
                                        onClick={async () => {
                                            const res = await joinEvent(event.id, user.id);
                                            if (res.success) {
                                                alert('Successfully joined the event!');
                                            } else {
                                                alert('Failed to join: ' + res.error);
                                            }
                                        }}
                                        className="btn btn-primary"
                                        style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <CheckCircle size={20} /> Join Event
                                    </button>
                                ) : (
                                    <button onClick={() => navigate('/login')} className="btn btn-primary">Login to Join Event</button>
                                )
                            ) : hasTickets ? (
                                user ? (
                                    <button
                                        onClick={() => setShowTicketPurchase(true)}
                                        className="btn btn-primary"
                                        style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        disabled={participationStatus === 'pending_payment' || participationStatus === 'pending_verification'}
                                    >
                                        <Ticket size={20} /> Buy Tickets
                                    </button>
                                ) : (
                                    <button onClick={() => navigate('/login')} className="btn btn-primary">Login to Buy Tickets</button>
                                )
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    Tickets are not available yet.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* --- PARTICIPANTS DIRECTORY --- */}
            <div style={{ marginTop: '3rem' }}>
                <h2 style={{ color: "var(--text-primary)", marginBottom: '1.5rem', fontSize: '1.75rem' }}>Confirmed Participants ({participantsList.length})</h2>
                {participantsList.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No participants have joined yet. Be the first!</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {participantsList.map(p => (
                            <div
                                key={p.id}
                                className="card glass-panel"
                                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer' }}
                                onClick={() => navigate(`/profile/${p.id}`)}
                            >
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {(() => {
                                        let src = null;
                                        if (p.avatar) src = getImageUrl('avatars', p.avatar);
                                        else if (p.profilePicture) src = getImageUrl('avatars', p.profilePicture);
                                        return src ? <img src={src} alt={p.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} />;
                                    })()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{p.firstName} {p.lastName}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.role} • {p.category || 'N/A'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
