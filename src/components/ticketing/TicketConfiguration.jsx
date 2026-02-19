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
            const ticketData = {
                ...formData,
                event_id: eventId,
                price: priceNum,
                total_quantity: qtyNum,
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
                        {eventTickets.map(ticket => (
                            <div key={ticket.id} className="card glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                                            {ticket.name}
                                        </h4>
                                        {ticket.description && (
                                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                                {ticket.description}
                                            </p>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                    <DollarSign size={16} />
                                                    <span>Price</span>
                                                </div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--primary)' }}>
                                                    PKR {ticket.price}
                                                </div>
                                            </div>

                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                    <Users size={16} />
                                                    <span>Available</span>
                                                </div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                                                    {(ticket.total_quantity || 0) - (ticket.sold_count || 0)} / {ticket.total_quantity || 0}
                                                </div>
                                            </div>

                                            {ticket.sale_end_date && (
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                        <Calendar size={16} />
                                                        <span>Sale Ends</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.95rem' }}>
                                                        {new Date(ticket.sale_end_date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => handleEdit(ticket)}
                                            className="btn btn-ghost btn-sm"
                                            style={{ padding: 'var(--space-1)', minWidth: '40px' }}
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ticket.id)}
                                            className="btn btn-ghost btn-sm"
                                            style={{ padding: 'var(--space-1)', color: 'var(--md-error)', minWidth: '40px' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
