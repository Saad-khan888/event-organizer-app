import React, { useState } from 'react';
import { useTicketing } from '../../context/TicketingContext';
import { CreditCard, Plus, Edit, Trash2, X, Building2, Smartphone, Wallet } from 'lucide-react';

// =====================================================
// COMPONENT: PAYMENT METHOD SETUP
// =====================================================
// Allows organizers to configure payment methods for their events

const PAYMENT_TYPES = [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
    { value: 'easypaisa', label: 'Easypaisa', icon: Smartphone },
    { value: 'jazzcash', label: 'JazzCash', icon: Smartphone },
    { value: 'cash', label: 'Cash on Arrival', icon: Wallet }
];

export default function PaymentMethodSetup({ eventId, onClose }) {
    const {
        createPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        getEventPaymentMethods
    } = useTicketing();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'bank_transfer',
        account_details: {
            accountTitle: '',
            accountNumber: '',
            bankName: '',
            phoneNumber: '',
            instructions: ''
        },
        instructions: '',
        display_order: 1
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const eventPaymentMethods = getEventPaymentMethods(eventId);

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'bank_transfer',
            account_details: {
                accountTitle: '',
                accountNumber: '',
                bankName: '',
                phoneNumber: '',
                instructions: ''
            },
            instructions: '',
            display_order: 1
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (method) => {
        setFormData({
            name: method.name,
            type: method.type,
            account_details: method.account_details || {},
            instructions: method.instructions || '',
            display_order: method.display_order
        });
        setEditingId(method.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const paymentMethodData = {
                ...formData,
                event_id: eventId
            };

            let result;
            if (editingId) {
                result = await updatePaymentMethod(editingId, paymentMethodData);
            } else {
                result = await createPaymentMethod(paymentMethodData);
            }

            if (result.success) {
                alert(editingId ? 'Payment method updated!' : 'Payment method created!');
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
        if (window.confirm('Delete this payment method?')) {
            const result = await deletePaymentMethod(id);
            if (result.success) {
                alert('Payment method deleted!');
            } else {
                alert('Error: ' + result.error);
            }
        }
    };

    const updateAccountDetails = (field, value) => {
        setFormData({
            ...formData,
            account_details: {
                ...formData.account_details,
                [field]: value
            }
        });
    };

    const renderTypeSpecificFields = () => {
        switch (formData.type) {
            case 'bank_transfer':
                return (
                    <>
                        <div className="form-group">
                            <label className="form-label">Account Title *</label>
                            <input
                                required
                                type="text"
                                className="form-input"
                                value={formData.account_details.accountTitle || ''}
                                onChange={e => updateAccountDetails('accountTitle', e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Account Number / IBAN *</label>
                            <input
                                required
                                type="text"
                                className="form-input"
                                value={formData.account_details.accountNumber || ''}
                                onChange={e => updateAccountDetails('accountNumber', e.target.value)}
                                placeholder="PK12XXXX1234567890123456"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Bank Name *</label>
                            <input
                                required
                                type="text"
                                className="form-input"
                                value={formData.account_details.bankName || ''}
                                onChange={e => updateAccountDetails('bankName', e.target.value)}
                                placeholder="HBL, UBL, Meezan, etc."
                            />
                        </div>
                    </>
                );

            case 'easypaisa':
            case 'jazzcash':
                return (
                    <>
                        <div className="form-group">
                            <label className="form-label">Account Title *</label>
                            <input
                                required
                                type="text"
                                className="form-input"
                                value={formData.account_details.accountTitle || ''}
                                onChange={e => updateAccountDetails('accountTitle', e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number *</label>
                            <input
                                required
                                type="tel"
                                className="form-input"
                                value={formData.account_details.phoneNumber || ''}
                                onChange={e => updateAccountDetails('phoneNumber', e.target.value)}
                                placeholder="03XX-XXXXXXX"
                            />
                        </div>
                    </>
                );

            case 'cash':
                return (
                    <div className="form-group">
                        <label className="form-label">Collection Instructions *</label>
                        <textarea
                            required
                            className="form-textarea"
                            value={formData.account_details.instructions || ''}
                            onChange={e => updateAccountDetails('instructions', e.target.value)}
                            placeholder="Where and when to collect cash? e.g., 'Pay at venue entrance on event day'"
                            rows="3"
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    const getIcon = (type) => {
        const paymentType = PAYMENT_TYPES.find(pt => pt.value === type);
        const Icon = paymentType?.icon || CreditCard;
        return <Icon size={20} />;
    };

    return (
        <div style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                        💳 Payment Methods
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Configure how attendees can pay for tickets
                    </p>
                </div>
                <button onClick={onClose} className="btn btn-ghost">
                    <X size={20} />
                </button>
            </div>

            {/* Create Button */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="btn btn-primary btn-full-mobile"
                    style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} /> Add Payment Method
                </button>
            )}

            {/* Form */}
            {showForm && (
                <div className="card glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
                        {editingId ? 'Edit Payment Method' : 'New Payment Method'}
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Payment Type *</label>
                            <select
                                required
                                className="form-select"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                {PAYMENT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Display Name *</label>
                            <input
                                required
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., HBL Bank Transfer, My Easypaisa"
                            />
                        </div>

                        {renderTypeSpecificFields()}

                        <div className="form-group">
                            <label className="form-label">Additional Instructions</label>
                            <textarea
                                className="form-textarea"
                                value={formData.instructions}
                                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                placeholder="Any special instructions for users..."
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Display Order</label>
                            <input
                                type="number"
                                min="1"
                                className="form-input"
                                value={formData.display_order}
                                onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                            />
                            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                                Lower numbers appear first
                            </small>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : (editingId ? 'Update' : 'Add')} Payment Method
                            </button>
                            <button type="button" onClick={resetForm} className="btn btn-ghost" disabled={isSubmitting}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Payment Methods List */}
            <div>
                <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Configured Methods <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '400', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>{eventPaymentMethods.length}</span>
                </h3>

                {eventPaymentMethods.length === 0 ? (
                    <div className="card glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <CreditCard size={40} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            No payment methods configured.
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
                            Add at least one to enable ticket sales!
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                        {eventPaymentMethods.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map(method => (
                            <div key={method.id} className="card glass-panel" style={{
                                padding: '1.5rem',
                                borderLeft: `4px solid ${method.is_active ? 'var(--primary)' : 'var(--text-secondary)'}`,
                                transition: 'transform 0.2s ease'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ color: 'var(--primary)', background: 'rgba(var(--primary-rgb, 59, 130, 246), 0.1)', padding: '8px', borderRadius: '10px' }}>
                                                {getIcon(method.type)}
                                            </div>
                                            <h4 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: '600', margin: 0 }}>
                                                {method.name}
                                            </h4>
                                            {method.is_active !== false && (
                                                <span style={{
                                                    background: 'rgba(34, 197, 94, 0.15)',
                                                    color: '#4ade80',
                                                    padding: '2px 10px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    Active
                                                </span>
                                            )}
                                        </div>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                                            gap: '1rem',
                                            padding: '1.25rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            overflow: 'hidden'
                                        }}>
                                            {method.type === 'bank_transfer' && (
                                                <>
                                                    <div style={{ fontSize: '0.9rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Account Title</div>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{method.account_details?.accountTitle}</div>
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', overflowWrap: 'break-word', wordBreak: 'break-all' }}>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Account Number / IBAN</div>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '1px' }}>{method.account_details?.accountNumber}</div>
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem' }}>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Bank Name</div>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{method.account_details?.bankName}</div>
                                                    </div>
                                                </>
                                            )}

                                            {(method.type === 'easypaisa' || method.type === 'jazzcash') && (
                                                <>
                                                    <div style={{ fontSize: '0.9rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Account Title</div>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{method.account_details?.accountTitle}</div>
                                                    </div>
                                                    <div style={{ fontSize: '0.9rem', overflowWrap: 'break-word', wordBreak: 'break-all' }}>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Mobile Number</div>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '1px' }}>{method.account_details?.phoneNumber}</div>
                                                    </div>
                                                </>
                                            )}

                                            {method.type === 'cash' && (
                                                <div style={{ fontSize: '0.9rem', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Payment Instructions</div>
                                                    <div style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>{method.account_details?.instructions}</div>
                                                </div>
                                            )}
                                        </div>

                                        {method.instructions && (
                                            <div style={{
                                                marginTop: '1rem',
                                                padding: '0.75rem 1rem',
                                                borderLeft: '3px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(255,255,255,0.01)',
                                                overflowWrap: 'break-word',
                                                wordBreak: 'break-word'
                                            }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Additional Notes</div>
                                                <em style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'normal' }}>{method.instructions}</em>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEdit(method)}
                                            className="btn btn-ghost"
                                            style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.05)' }}
                                            title="Edit Payment Method"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(method.id)}
                                            className="btn btn-ghost"
                                            style={{ padding: '0.6rem', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)' }}
                                            title="Delete Payment Method"
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

