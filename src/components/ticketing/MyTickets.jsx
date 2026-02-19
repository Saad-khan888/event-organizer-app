import React, { useState } from 'react';
import { useTicketing } from '../../context/TicketingContext';
import { useAuth } from '../../context/AuthContext';
import { Ticket, Calendar, MapPin, CheckCircle, Upload, X } from 'lucide-react';

// =====================================================
// COMPONENT: MY TICKETS
// =====================================================
// Displays user's purchased tickets

export default function MyTickets() {
    const { user } = useAuth();
    if (user?.role === 'athlete') return null;
    const { tickets, orders, loading, submitPaymentProof } = useTicketing();
    const [selectedTicketGroup, setSelectedTicketGroup] = useState(null);
    const [uploadingOrder, setUploadingOrder] = useState(null);
    const [proofFile, setProofFile] = useState(null);
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const groupTickets = (ticketList) => {
        const groups = new Map();
        for (const t of ticketList) {
            const eventId = t?.event_id ?? 'unknown_event';
            const typeId = t?.ticket_type_id ?? 'unknown_type';
            const key = `${eventId}:${typeId}`;

            if (!groups.has(key)) {
                groups.set(key, {
                    key,
                    event_id: eventId,
                    ticket_type_id: typeId,
                    event: t.event,
                    ticket_type: t.ticket_type,
                    status: t.status,
                    tickets: []
                });
            }
            groups.get(key).tickets.push(t);
        }

        return Array.from(groups.values()).sort((a, b) => {
            const aDate = a.event?.date ? new Date(a.event.date).getTime() : 0;
            const bDate = b.event?.date ? new Date(b.event.date).getTime() : 0;
            return bDate - aDate;
        });
    };

    const activeTicketGroups = groupTickets(tickets.filter(t => t.status === 'active'));
    const usedTicketGroups = groupTickets(tickets.filter(t => t.status === 'used'));

    // NEW: Filter for pending orders so users see immediate feedback
    // FIX: Ensure we only show orders belonging to the CURRENT USER (not all organizer orders)
    const pendingOrders = orders.filter(o =>
        (o.status === 'pending_payment' || o.status === 'pending_verification') &&
        o.user_id === user.id
    );

    const handleUploadClick = (order) => {
        setUploadingOrder(order);
        setProofFile(null);
        setTransactionId('');
    };

    const handleSubmitProof = async (e) => {
        e.preventDefault();
        if (!proofFile || !transactionId) {
            alert('Please provide both the transaction ID and the proof image.');
            return;
        }

        setIsSubmitting(true);
        try {
            const paymentDetails = {
                transactionId,
                paymentDate: new Date().toISOString(),
                method: uploadingOrder.payment_method_id // Simplification
            };

            const result = await submitPaymentProof(uploadingOrder.id, paymentDetails, proofFile);

            if (result.success) {
                alert('Payment proof submitted successfully! The organizer will verify it shortly.');
                setUploadingOrder(null);
            } else {
                alert('Error submitting proof: ' + result.error);
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        // ... (loading logic remains same)
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading tickets...</p>
            </div>
        );
    }

    return (
        <div>

            {/* NEW SECTION: Pending Orders */}
            {pendingOrders.length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        Orders in Progress ({pendingOrders.length})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(350px, 100%), 1fr))', gap: '1.5rem' }}>
                        {pendingOrders.map(order => (
                            <div key={order.id} className="card glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--accent)', minWidth: 0 }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <h4 style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '0.5rem', wordBreak: 'break-word' }}>
                                        {order.event?.title || 'Event'}
                                    </h4>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span className="badge badge-outline" style={{ wordBreak: 'break-word' }}>{order.ticket_type?.name}</span>
                                        <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <p>Quantity: {order.quantity}</p>
                                    <p>Total: PKR {order.total_amount}</p>
                                    <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                                        {order.status === 'pending_payment'
                                            ? 'Waiting for you to submit payment proof.'
                                            : 'Waiting for organizer verification.'}
                                    </p>

                                    {order.status === 'pending_payment' && (
                                        <button
                                            onClick={() => handleUploadClick(order)}
                                            className="btn btn-primary btn-sm btn-full-mobile"
                                            style={{ marginTop: '1rem', width: '100%' }}
                                        >
                                            <Upload size={16} style={{ marginRight: '0.5rem' }} />
                                            Upload Payment Proof
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Tickets */}
            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    Active Tickets ({activeTicketGroups.reduce((sum, g) => sum + g.tickets.length, 0)})
                </h3>

                {activeTicketGroups.length === 0 ? (
                    <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                        <Ticket size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)', opacity: 0.5 }} />
                        <p style={{ color: 'var(--text-secondary)' }}>
                            No active tickets. {pendingOrders.length > 0 ? 'Check your pending orders above.' : 'Purchase tickets for upcoming events!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-auto-fill gap-3">
                        {activeTicketGroups.map(group => (
                            <div key={group.key} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ marginBottom: 'var(--space-2)' }}>
                                    <h4 style={{
                                        color: 'var(--md-primary)',
                                        fontSize: '1.125rem',
                                        marginBottom: 'var(--space-1)',
                                        fontWeight: 600
                                    }}>
                                        {group.event?.title}
                                    </h4>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <div className="badge badge-secondary">
                                            {group.ticket_type?.name}
                                        </div>
                                        <div className="badge badge-outline">
                                            Qty: {group.tickets.length}
                                        </div>
                                    </div>
                                </div>

                                {/* Event Details */}
                                <div style={{ display: 'grid', gap: 'var(--space-1)', fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                                        <Calendar size={16} style={{ flexShrink: 0 }} />
                                        <span>{new Date(group.event?.date).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                                        <MapPin size={16} style={{ flexShrink: 0 }} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.event?.location}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                                        <Ticket size={16} style={{ flexShrink: 0 }} />
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>Tickets: {group.tickets.length}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ marginTop: 'auto', display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => setSelectedTicketGroup(group)}
                                        className="btn btn-primary btn-full-mobile"
                                        style={{ flex: 1 }}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Used Tickets */}
            {usedTicketGroups.length > 0 && (
                <div>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        Used Tickets ({usedTicketGroups.reduce((sum, g) => sum + g.tickets.length, 0)})
                    </h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {usedTicketGroups.map(group => (
                            <div key={group.key} className="card glass-panel" style={{ padding: '1rem', opacity: 0.7 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                            {group.event?.title}
                                        </h4>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            {group.ticket_type?.name} • Qty: {group.tickets.length}
                                        </p>
                                    </div>
                                    <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Full Ticket Modal */}
            {selectedTicketGroup && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                    onClick={() => setSelectedTicketGroup(null)}
                >
                    <div
                        className="card glass-panel"
                        style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>
                            {selectedTicketGroup.event?.title}
                        </h3>

                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <strong>Ticket Type:</strong> {selectedTicketGroup.ticket_type?.name}
                            </div>
                            <div>
                                <strong>Date:</strong> {new Date(selectedTicketGroup.event?.date).toLocaleDateString()}
                            </div>
                            <div>
                                <strong>Location:</strong> {selectedTicketGroup.event?.location}
                            </div>
                            <div>
                                <strong>Quantity:</strong> {selectedTicketGroup.tickets.length}
                            </div>
                            <div>
                                <strong>Ticket IDs:</strong>
                                <div style={{ marginTop: '0.5rem', maxHeight: '140px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem' }}>
                                    {selectedTicketGroup.tickets.map(t => (
                                        <div key={t.id} style={{ padding: '0.25rem 0' }}>{t.id}</div>
                                    ))}
                                </div>
                            </div>
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)'
                            }}>
                                Present this ticket information at the event entrance for verification.
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setSelectedTicketGroup(null)}
                                className="btn btn-primary btn-full-mobile"
                                style={{ flex: 1 }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Upload Proof Modal */}
            {uploadingOrder && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                    onClick={() => setUploadingOrder(null)}
                >
                    <div
                        className="card glass-panel"
                        style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: 'var(--primary)', margin: 0 }}>Submit Payment Proof</h3>
                            <button onClick={() => setUploadingOrder(null)} className="btn-icon btn-ghost">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitProof}>
                            <div className="form-group">
                                <label className="form-label">Order Details</label>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                    {uploadingOrder.event?.title} - {uploadingOrder.ticket_type?.name} (x{uploadingOrder.quantity})<br />
                                    <strong>Total: PKR {uploadingOrder.total_amount}</strong>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Transaction ID / Reference No.</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    required
                                    value={transactionId}
                                    onChange={e => setTransactionId(e.target.value)}
                                    placeholder="e.g. TRX-123456789"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Payment Screenshot</label>
                                <input
                                    type="file"
                                    className="form-input"
                                    required
                                    accept="image/*"
                                    onChange={e => setProofFile(e.target.files[0])}
                                    style={{ padding: '0.5rem' }}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-full-mobile"
                                style={{ width: '100%', marginTop: '1rem' }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Uploading...' : 'Submit Proof'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
