import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTicketing } from '../../context/TicketingContext'; // NEW
import { Calendar, Plus, MapPin, Edit, Trash2, X, Check, Ticket, CreditCard, Scan, DollarSign } from 'lucide-react';
import TicketConfiguration from '../ticketing/TicketConfiguration';
import PaymentMethodSetup from '../ticketing/PaymentMethodSetup';
import PaymentVerificationDashboard from '../ticketing/PaymentVerificationDashboard'; // NEW

// -----------------------------------------------------------------------------
// COMPONENT: ORGANIZER DASHBOARD
// -----------------------------------------------------------------------------
// This is the "Command Center" for Event Organizers.
// They can: Create events, edit existing ones, verify payments, etc.

export default function OrganizerDashboard() {
    // 1. HOOKS & CONTEXT
    const { user } = useAuth(); // Current organizer (logged-in user)
    const { addEvent, updateEvent, deleteEvent, events, users } = useData(); // Global Data Actions
    const { orders, ticketTypes, loading: ticketingLoading } = useTicketing(); // Ticketing stats
    const navigate = useNavigate();

    // UI Local State
    const [view, setView] = useState('events'); // 'events' or 'verifications'
    const [showCreate, setShowCreate] = useState(false); // Toggle visibility of the Event Form
    const [editingId, setEditingId] = useState(null); // Tracks if we are "Updating" or "Creating New"
    const [showTicketConfig, setShowTicketConfig] = useState(null); // Event ID to configure tickets for
    const [showPaymentSetup, setShowPaymentSetup] = useState(null); // Event ID to configure payments for
    const [isSubmitting, setIsSubmitting] = useState(false); // Global saving indicator

    // 2. FORM STATE
    const [formData, setFormData] = useState({ title: '', date: '', time: '', location: '', description: '', category: 'Boxing', prize_first: '', prize_second: '', prize_third: '' });

    // Filter the global events list down to only the ones BELONGING to this organizer.
    const myEvents = events.filter(e => String(e.organizer) === String(user.id) || String(e.organizerId) === String(user.id));

    // Count pending verifications
    const pendingCount = orders.filter(o => o.status === 'pending_verification').length;

    const getEventTicketStats = (eventId) => {
        const eventIdStr = String(eventId);
        const types = (ticketTypes || []).filter(tt => String(tt.event_id) === eventIdStr);

        const totals = types.reduce((acc, tt) => {
            acc.total += (tt.total_quantity || 0);
            acc.sold += (tt.sold_count || 0);
            acc.left += (tt.available_quantity || 0);
            return acc;
        }, { total: 0, sold: 0, left: 0 });

        const eventOrders = (orders || []).filter(o => String(o.event_id) === eventIdStr);
        const pendingPayment = eventOrders.filter(o => o.status === 'pending_payment').length;
        const pendingVerification = eventOrders.filter(o => o.status === 'pending_verification').length;
        const paid = eventOrders.filter(o => o.status === 'paid').length;

        return {
            hasTicketTypes: types.length > 0,
            total: totals.total,
            sold: totals.sold,
            left: totals.left,
            pendingPayment,
            pendingVerification,
            paid
        };
    };

    // 3. EVENT HANDLERS

    // Clear the form and hide it
    const resetForm = () => {
        setFormData({ title: '', date: '', time: '', location: '', description: '', category: 'Boxing', prize_first: '', prize_second: '', prize_third: '' });
        setEditingId(null);
        setShowCreate(false);
    };

    // Prepare to edit an existing event
    const handleEditClick = (event) => {
        setFormData({
            title: event.title,
            date: event.date,
            time: event.time || '',
            location: event.location,
            description: event.description,
            category: event.category,
            prize_first: event.prize_first || '',
            prize_second: event.prize_second || '',
            prize_third: event.prize_third || ''
        });
        setEditingId(event.id); // Set the ID so the system knows we are editing
        setShowCreate(true);
        window.scrollTo(0, 0); // Scroll up to the form
    };

    // Main Submit (Save to Database)
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            if (editingId) {
                // SCENARIO: EDITING
                await updateEvent(editingId, { ...formData });
                alert("Event updated successfully!");
            } else {
                // SCENARIO: BRAND NEW
                await addEvent({ ...formData, organizer: user.id, organizerId: user.id });
                alert("Event created successfully!");
            }
            resetForm(); // Clean up ONLY on success
        } catch (err) {
            console.error('Submit error:', err);
            alert("Failed to save event: " + (err.message || "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to take down this event? This action cannot be undone.")) {
            deleteEvent(id);
        }
    };

    // 4. RENDER
    return (
        <div className="animate-fade-in">
            {/* --- HEADER --- */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(--space-3)',
                flexWrap: 'wrap',
                gap: 'var(--space-2)'
            }}>
                <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.25rem' }}>Organizer Dashboard</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage your events, tickets, and payments.</p>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', flex: '0 1 auto' }}>
                    {/* Verify Payments Toggle */}
                    <button
                        className={`btn btn-sm ${view === 'verifications' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setView(view === 'events' ? 'verifications' : 'events')}
                        style={{ position: 'relative', whiteSpace: 'nowrap' }}
                    >
                        <DollarSign size={18} />
                        <span className="hide-mobile">{view === 'events' ? 'Verify Payments' : 'Back to Events'}</span>
                        <span className="show-mobile">{view === 'events' ? 'Payments' : 'Back'}</span>
                        {pendingCount > 0 && view === 'events' && (
                            <span className="badge badge-error" style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                minWidth: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 6px',
                                fontSize: '0.7rem',
                                fontWeight: 'bold'
                            }}>
                                {pendingCount}
                            </span>
                        )}
                    </button>

                    {!showCreate && view === 'events' && (
                        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)} style={{ whiteSpace: 'nowrap' }}>
                            <Plus size={18} />
                            <span className="hide-mobile">Create New Event</span>
                            <span className="show-mobile">Create</span>
                        </button>
                    )}
                </div>
            </div>

            {/* --- VIEW: PAYMENT VERIFICATIONS --- */}
            {view === 'verifications' && (
                <PaymentVerificationDashboard />
            )}

            {/* --- VIEW: EVENTS (Default) --- */}
            {view === 'events' && (
                <>
                    {/* --- EVENT DRAFTING FORM (Visible only when needed) --- */}
                    {showCreate && (
                        <div className="card glass-panel" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1.25rem' }}>{editingId ? 'Edit Event' : 'Create New Event'}</h3>
                                <button onClick={resetForm} className="btn btn-ghost"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Event Title</label>
                                    <input required className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Date</label>
                                        <input required type="date" className="form-input" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Time</label>
                                        <input required type="time" className="form-input" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select className="form-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                            <option value="Badminton">Badminton</option>
                                            <option value="Basketball">Basketball</option>
                                            <option value="Bowling">Bowling</option>
                                            <option value="Boxing">Boxing</option>
                                            <option value="Fencing">Fencing</option>
                                            <option value="Futsal">Futsal (Indoor Soccer)</option>
                                            <option value="Gymnastics">Gymnastics</option>
                                            <option value="Handball">Handball</option>
                                            <option value="Ice Hockey">Ice Hockey</option>
                                            <option value="Indoor Cricket">Indoor Cricket</option>
                                            <option value="Judo">Judo</option>
                                            <option value="Karate">Karate</option>
                                            <option value="MMA">MMA (Mixed Martial Arts)</option>
                                            <option value="Netball">Netball</option>
                                            <option value="Pickleball">Pickleball</option>
                                            <option value="Squash">Squash</option>
                                            <option value="Table Tennis">Table Tennis</option>
                                            <option value="Taekwondo">Taekwondo</option>
                                            <option value="Tennis">Tennis</option>
                                            <option value="Volleyball">Volleyball</option>
                                            <option value="Wrestling">Wrestling</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input required className="form-input" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea required className="form-textarea" rows="4" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '1.25rem'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label">1st Place Prize (Gold)</label>
                                        <input className="form-input" value={formData.prize_first} onChange={e => setFormData({ ...formData, prize_first: e.target.value })} placeholder="e.g., PKR 50,000 / Medal / Trophy" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">2nd Place Prize (Silver)</label>
                                        <input className="form-input" value={formData.prize_second} onChange={e => setFormData({ ...formData, prize_second: e.target.value })} placeholder="e.g., PKR 25,000 / Medal" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">3rd Place Prize (Bronze)</label>
                                        <input className="form-input" value={formData.prize_third} onChange={e => setFormData({ ...formData, prize_third: e.target.value })} placeholder="e.g., PKR 10,000 / Medal" />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                    <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>Saving...</>
                                        ) : editingId ? (
                                            <><Check size={18} /> Update Event</>
                                        ) : (
                                            <><Plus size={18} /> Publish Event</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* --- OWNED EVENTS LIST --- */}
                    {showTicketConfig && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div className="card glass-panel" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                                <TicketConfiguration
                                    eventId={showTicketConfig}
                                    onClose={() => setShowTicketConfig(null)}
                                />
                            </div>
                        </div>
                    )}

                    {showPaymentSetup && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div className="card glass-panel" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                                <PaymentMethodSetup
                                    eventId={showPaymentSetup}
                                    onClose={() => setShowPaymentSetup(null)}
                                />
                            </div>
                        </div>
                    )}

                    <h3 style={{
                        marginBottom: 'var(--space-2)',
                        borderBottom: '1px solid var(--divider)',
                        paddingBottom: 'var(--space-1)',
                        fontSize: '1.25rem',
                        fontWeight: 600
                    }}>Your Published Events</h3>

                    {myEvents.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-3)' }}>
                            <p style={{ color: 'var(--text-secondary)' }}>You haven't created any events yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-auto-fill gap-3">
                            {myEvents.map(ev => (
                                <div key={ev.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                        <span className="badge badge-primary">{ev.category}</span>
                                        <button
                                            onClick={() => handleEditClick(ev)}
                                            className="btn-icon btn-ghost"
                                            title="Edit Event"
                                        >
                                            <Edit size={18} />
                                        </button>
                                    </div>
                                    <h4 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-2)', fontWeight: 600 }}>{ev.title}</h4>
                                    <div style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)',
                                        display: 'grid',
                                        gap: 'var(--space-1)',
                                        marginBottom: 'var(--space-2)'
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                            <Calendar size={14} style={{ flexShrink: 0 }} /> {ev.date}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                            <MapPin size={14} style={{ flexShrink: 0 }} /> {ev.location}
                                        </span>
                                    </div>

                                    {(() => {
                                        const stats = getEventTicketStats(ev.id);
                                        return (
                                            <div style={{
                                                display: 'grid',
                                                gap: 'var(--space-1)',
                                                marginBottom: 'var(--space-2)'
                                            }}>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                                    gap: 'var(--space-1)'
                                                }}>
                                                    <div className="card" style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total seats</div>
                                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                            {ticketingLoading ? '...' : (stats.hasTicketTypes ? stats.total : '—')}
                                                        </div>
                                                    </div>
                                                    <div className="card" style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sold/Reserved</div>
                                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                            {ticketingLoading ? '...' : (stats.hasTicketTypes ? stats.sold : '—')}
                                                        </div>
                                                    </div>
                                                    <div className="card" style={{ padding: '0.75rem' }}>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Seats left</div>
                                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                            {ticketingLoading ? '...' : (stats.hasTicketTypes ? stats.left : '—')}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                                                    <span className="badge badge-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        Pending payment: {ticketingLoading ? '...' : stats.pendingPayment}
                                                    </span>
                                                    <span className="badge badge-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        Pending verify: {ticketingLoading ? '...' : stats.pendingVerification}
                                                    </span>
                                                    <span className="badge badge-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        Paid: {ticketingLoading ? '...' : stats.paid}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* PARTICIPANT STATS */}
                                    <div style={{
                                        marginTop: 'auto',
                                        paddingTop: 'var(--space-2)',
                                        borderTop: '1px solid var(--divider)'
                                    }}>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--md-primary)' }}>
                                                    {ev.participants.filter(pid => users.find(u => u.id === pid)?.role === 'athlete').length}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Athletes</div>
                                            </div>
                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--md-primary)' }}>
                                                    {ev.participants.filter(pid => users.find(u => u.id === pid)?.role === 'reporter').length}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reporters</div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 'var(--space-1)' }}>
                                            <button
                                                onClick={() => setShowTicketConfig(ev.id)}
                                                className="btn btn-outline btn-sm"
                                                title="Manage Tickets"
                                            >
                                                <Ticket size={14} /> <span className="hide-mobile">Tickets</span>
                                            </button>
                                            <button
                                                onClick={() => setShowPaymentSetup(ev.id)}
                                                className="btn btn-outline btn-sm"
                                                title="Payment Methods"
                                            >
                                                <CreditCard size={14} /> <span className="hide-mobile">Payments</span>
                                            </button>
                                            <button
                                                onClick={() => navigate(`/scan-tickets/${ev.id}`)}
                                                className="btn btn-outline btn-sm"
                                                title="Validate Tickets"
                                            >
                                                <Scan size={14} /> <span className="hide-mobile">Validate</span><span className="show-mobile">Check</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ev.id)}
                                                className="btn btn-outline btn-sm"
                                                style={{
                                                    color: 'var(--md-error)',
                                                    borderColor: 'var(--md-error)'
                                                }}
                                                title="Delete Event"
                                            >
                                                <Trash2 size={16} />
                                                <span className="hide-mobile" style={{ marginLeft: '4px' }}>Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
