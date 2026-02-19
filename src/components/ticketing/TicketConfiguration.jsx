import React, { useState } from 'react';
import { useTicketing } from '../../context/TicketingContext';
import { useData } from '../../context/DataContext';
import { Ticket, Plus, Edit, Trash2, X, DollarSign, Calendar, Users } from 'lucide-react';

// =====================================================
// COMPONENT: TICKET CONFIGURATION
// =====================================================
// Allows organizers to create and manage ticket types for their events

export default function TicketConfiguration({ eventId, onClose }) {
    const { events } = useData();
    const {
        createTicketType,
        updateTicketType,
        deleteTicketType,
        getEventTicketTypes
    } = useTicketing();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        total_quantity: '',
        sale_start_date: '',
        sale_end_date: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const event = events.find(e => e.id === eventId);
    const eventTickets = getEventTicketTypes(eventId);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            total_quantity: '',
            sale_start_date: '',
            sale_end_date: ''
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (ticket) => {
        setFormData({
            name: ticket.name,
            description: ticket.description || '',
            price: ticket.price,
            total_quantity: ticket.total_quantity,
            sale_start_date: ticket.sale_start_date?.split('T')[0] || '',
            sale_end_date: ticket.sale_end_date?.split('T')[0] || ''
        });
        setEditingId(ticket.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;

        // Basic validation
        const priceNum = parseFloat(formData.price);
        const qtyNum = parseInt(formData.total_quantity);

        if (isNaN(priceNum) || priceNum < 0) {
            alert('Please enter a valid price.');
            return;
        }
        if (isNaN(qtyNum) || qtyNum < 1) {
            alert('Please enter a valid total quantity (at least 1).');
            return;
        }

        setIsSubmitting(true);
        try {
            // Sanitize data: convert empty strings to null for dates
            // and ensure numeric types are correct.
            const ticketData = {
                name: formData.name,
                description: formData.description || null,
                price: priceNum,
                total_quantity: qtyNum,
                sale_start_date: formData.sale_start_date || null,
                sale_end_date: formData.sale_end_date || null,
                event_id: eventId,
                // On creation, all tickets are available
                available_quantity: editingId ? undefined : qtyNum,
                sold_count: editingId ? undefined : 0
            };

            let result;
            if (editingId) {
                result = await updateTicketType(editingId, ticketData);
            } else {
                result = await createTicketType(ticketData);
            }

            if (result.success) {
                alert(editingId ? 'Ticket type updated!' : 'Ticket type created!');
                resetForm();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (err) {
            console.error('Submission failed:', err);
            alert('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this ticket type? This cannot be undone.')) {
            const result = await deleteTicketType(id);
            if (result.success) {
                alert('Ticket type deleted!');
            } else {
                alert('Error: ' + result.error);
            }
        }
    };

    return (
        <div style={{ padding: 'var(--space-2)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <h2 style={{ color: "var(--text-primary)", fontSize: 'clamp(1.25rem, 4vw, 1.8rem)', marginBottom: 'var(--space-1)', wordBreak: 'break-word' }}>
                        🎫 Ticket Configuration
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', wordBreak: 'break-word' }}>
                        {event?.title || 'Event'}
                    </p>
                </div>
                <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ flexShrink: 0 }}>
                    <X size={20} />
                </button>
            </div>

            {/* Create Button */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="btn btn-primary"
                    style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} /> Create Ticket Type
                </button>
            )}

            {/* Form */}
            {showForm && (
                <div className="card glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
                        {editingId ? 'Edit Ticket Type' : 'New Ticket Type'}
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Ticket Name *</label>
                            <input
                                required
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., VIP, General Admission, Early Bird"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-textarea"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What's included in this ticket?"
                                rows="3"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Price (PKR) *</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="form-input"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Total Quantity *</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    className="form-input"
                                    value={formData.total_quantity}
                                    onChange={e => setFormData({ ...formData, total_quantity: e.target.value })}
                                    placeholder="100"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Sale Start Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.sale_start_date}
                                    onChange={e => setFormData({ ...formData, sale_start_date: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Sale End Date</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.sale_end_date}
                                    onChange={e => setFormData({ ...formData, sale_end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: '1 1 120px' }} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                            </button>
                            <button type="button" onClick={resetForm} className="btn btn-ghost" style={{ flex: '1 1 100px' }} disabled={isSubmitting}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Ticket Types List */}
            <div>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    Ticket Types ({eventTickets.length})
                </h3>

                {eventTickets.length === 0 ? (
                    <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                        <Ticket size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)', opacity: 0.5 }} />
                        <p style={{ color: 'var(--text-secondary)' }}>
                            No ticket types created yet. Click "Create Ticket Type" to get started!
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {eventTickets.map(ticket => {
                            const available = (ticket.total_quantity || 0) - (ticket.sold_count || 0);
                            const soldPercentage = ticket.total_quantity > 0
                                ? Math.min(100, Math.round((ticket.sold_count / ticket.total_quantity) * 100))
                                : 0;

                            return (
                                <div key={ticket.id} className="card glass-panel" style={{
                                    padding: '1.5rem',
                                    borderLeft: `4px solid ${available > 0 ? 'var(--primary)' : 'var(--danger)'}`,
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                                                    {ticket.name}
                                                </h4>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '20px',
                                                    background: available > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                    color: available > 0 ? '#4ade80' : '#f87171',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {available > 0 ? 'Active' : 'Sold Out'}
                                                </span>
                                            </div>

                                            {ticket.description && (
                                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                                    {ticket.description}
                                                </p>
                                            )}

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                                        <DollarSign size={14} />
                                                        <span>Price</span>
                                                    </div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)' }}>
                                                        PKR {ticket.price.toLocaleString()}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                                        <Users size={14} />
                                                        <span>Availability</span>
                                                    </div>
                                                    <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                                                        {available} <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-secondary)' }}>left of {ticket.total_quantity}</span>
                                                    </div>
                                                    <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${soldPercentage}%`,
                                                            background: soldPercentage > 80 ? 'var(--danger)' : 'var(--primary)',
                                                            transition: 'width 0.5s ease'
                                                        }}></div>
                                                    </div>
                                                </div>

                                                {ticket.sale_end_date && (
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                                            <Calendar size={14} />
                                                            <span>Ends On</span>
                                                        </div>
                                                        <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                                                            {new Date(ticket.sale_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleEdit(ticket)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ticket.id)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
