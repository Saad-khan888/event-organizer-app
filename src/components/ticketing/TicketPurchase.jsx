import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketing } from '../../context/TicketingContext';
import { useAuth } from '../../context/AuthContext';
import { Ticket, ShoppingCart, Users, DollarSign, Calendar, AlertCircle } from 'lucide-react';

// =====================================================
// COMPONENT: TICKET PURCHASE
// =====================================================
// Allows users to select and purchase tickets for an event

export default function TicketPurchase({ event, onClose, onPurchaseComplete }) {
    const { user } = useAuth();
    const { getEventTicketTypes, getEventPaymentMethods, createOrder, getTicketPurchaseEligibility } = useTicketing();

    const [selectedTicketType, setSelectedTicketType] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [step, setStep] = useState(1); // 1: Select Ticket, 2: Select Payment, 3: Confirm
    const [loading, setLoading] = useState(false);

    const ticketTypes = getEventTicketTypes(event.id);
    const paymentMethods = getEventPaymentMethods(event.id);

    const eligibility = getTicketPurchaseEligibility ? getTicketPurchaseEligibility(event) : { allowed: true, reason: null };

    const selectedTicket = ticketTypes.find(t => t.id === selectedTicketType);
    const selectedPayment = paymentMethods.find(p => p.id === selectedPaymentMethod);
    const totalPrice = selectedTicket ? selectedTicket.price * quantity : 0;

    const navigate = useNavigate(); // Add this hook

    const handlePurchase = async () => {
        if (!eligibility.allowed) {
            alert(eligibility.reason || 'You are not eligible to purchase tickets for this event.');
            return;
        }

        if (!selectedTicketType || !selectedPaymentMethod) {
            alert('Please select ticket type and payment method');
            return;
        }

        setLoading(true);
        const result = await createOrder({
            event_id: event.id,
            ticket_type_id: selectedTicketType,
            quantity: quantity,
            payment_method_id: selectedPaymentMethod
        });

        setLoading(false);

        if (result.success) {
            // alert('Order created! Please proceed to payment.'); // Removed annoying alert
            if (onPurchaseComplete) {
                onPurchaseComplete(result.orderId);
            }
            onClose();
            // Redirect to profile so they see the "Pending Order" immediately
            navigate(`/profile/${user.id}`);
        } else {
            alert('Error: ' + result.error);
        }
    };

    const canProceed = () => {
        if (step === 1) return selectedTicketType && quantity > 0;
        if (step === 2) return selectedPaymentMethod;
        return true;
    };

    if (!eligibility.allowed) {
        return (
            <div style={{ padding: 'var(--space-2)', maxWidth: '800px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                    <h2 style={{ color: "var(--text-primary)", fontSize: 'clamp(1.25rem, 4vw, 1.8rem)', marginBottom: 'var(--space-1)' }}>
                        🎫 Purchase Tickets
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>{event.title}</p>
                </div>

                <div className="card glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <AlertCircle size={20} style={{ color: 'var(--md-error)', marginTop: '2px' }} />
                        <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>You can’t purchase tickets for this event</div>
                            <div style={{ color: 'var(--text-secondary)' }}>{eligibility.reason}</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                    <button onClick={onClose} className="btn btn-primary" style={{ minWidth: '120px' }}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 'var(--space-2)', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-3)' }}>
                <h2 style={{ color: "var(--text-primary)",  fontSize: 'clamp(1.25rem, 4vw, 1.8rem)', marginBottom: 'var(--space-1)' }}>
                    🎫 Purchase Tickets
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>{event.title}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginTop: 'var(--space-2)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: 'var(--text-secondary)' }}>
                    <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                    <span>📍 {event.location}</span>
                </div>

            {!eligibility.allowed && (
                <div className="card glass-panel" style={{ padding: '1rem', marginBottom: 'var(--space-3)', border: '1px solid rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertCircle size={18} style={{ color: 'var(--md-error)' }} />
                        <div style={{ color: 'var(--text-secondary)' }}>{eligibility.reason}</div>
                    </div>
                </div>
            )}
            </div>

            {/* Progress Steps */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(0.5rem, 2vw, 1rem)', marginBottom: 'var(--space-3)', overflowX: 'auto', paddingBottom: 'var(--space-1)' }}>
                {[1, 2, 3].map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', minWidth: 'fit-content' }}>
                        <div style={{
                            width: 'clamp(28px, 6vw, 32px)',
                            height: 'clamp(28px, 6vw, 32px)',
                            borderRadius: '50%',
                            background: step >= s ? 'var(--md-primary)' : 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '600',
                            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                            flexShrink: 0
                        }}>
                            {s}
                        </div>
                        <span style={{ color: step >= s ? 'var(--md-primary)' : 'var(--text-secondary)', fontSize: 'clamp(0.75rem, 2vw, 0.9rem)', whiteSpace: 'nowrap' }} className="hide-mobile">
                            {s === 1 ? 'Select' : s === 2 ? 'Payment' : 'Confirm'}
                        </span>
                        {s < 3 && <span style={{ color: 'var(--text-secondary)', margin: '0 clamp(0.25rem, 1vw, 0.5rem)' }}>→</span>}
                    </div>
                ))}
            </div>

            {/* Step 1: Select Ticket Type */}
            {step === 1 && (
                <div className="animate-fade-in">
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                        Select Ticket Type
                    </h3>

                    {ticketTypes.length === 0 ? (
                        <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                            <AlertCircle size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)', opacity: 0.5 }} />
                            <p style={{ color: 'var(--text-secondary)' }}>
                                No tickets available for this event yet.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {ticketTypes.map(ticket => {
                                const availableQty = (ticket.total_quantity || 0) - (ticket.sold_count || 0);
                                const isAvailable = availableQty > 0;
                                
                                return (
                                <div
                                    key={ticket.id}
                                    onClick={() => isAvailable && setSelectedTicketType(ticket.id)}
                                    className="card glass-panel"
                                    style={{
                                        padding: '1.5rem',
                                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                                        opacity: isAvailable ? 1 : 0.6,
                                        border: selectedTicketType === ticket.id ? '2px solid var(--primary)' : '2px solid transparent',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                                                {ticket.name}
                                                {!isAvailable && <span style={{ color: 'var(--md-error)', fontSize: '0.9rem', marginLeft: '0.5rem' }}>(SOLD OUT)</span>}
                                            </h4>
                                            {ticket.description && (
                                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                                    {ticket.description}
                                                </p>
                                            )}
                                            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
                                                <div>
                                                    <div style={{ color: 'var(--text-secondary)' }}>Price</div>
                                                    <div style={{ fontSize: '1.3rem', fontWeight: '600', color: 'var(--primary)' }}>
                                                        PKR {ticket.price}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ color: 'var(--text-secondary)' }}>Available</div>
                                                    <div style={{ 
                                                        fontSize: '1.1rem', 
                                                        fontWeight: '600',
                                                        color: availableQty === 0 ? 'var(--md-error)' : availableQty < 10 ? '#fbbf24' : 'var(--md-success)'
                                                    }}>
                                                        {availableQty} / {ticket.total_quantity || 0}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {selectedTicketType === ticket.id && (
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                background: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white'
                                            }}>
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})}

                        </div>
                    )}

                    {selectedTicket && (
                        <div className="card glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
                            <label className="form-label">Quantity</label>
                            <input
                                type="number"
                                min="1"
                                max={(selectedTicket.total_quantity || 0) - (selectedTicket.sold_count || 0)}
                                value={quantity}
                                onChange={e => {
                                    const val = parseInt(e.target.value) || 1;
                                    const maxAvailable = (selectedTicket.total_quantity || 0) - (selectedTicket.sold_count || 0);
                                    setQuantity(Math.min(val, maxAvailable));
                                }}
                                className="form-input"
                                style={{ maxWidth: '150px' }}
                            />
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Maximum available: {(selectedTicket.total_quantity || 0) - (selectedTicket.sold_count || 0)}
                            </p>
                            <div style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: '600' }}>
                                Total: PKR {totalPrice}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Select Payment Method */}
            {step === 2 && (
                <div className="animate-fade-in">
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                        Select Payment Method
                    </h3>

                    {paymentMethods.length === 0 ? (
                        <div className="card glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                            <AlertCircle size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-secondary)', opacity: 0.5 }} />
                            <p style={{ color: 'var(--text-secondary)' }}>
                                No payment methods configured yet.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {paymentMethods.map(method => (
                                <div
                                    key={method.id}
                                    onClick={() => setSelectedPaymentMethod(method.id)}
                                    className="card glass-panel"
                                    style={{
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        border: selectedPaymentMethod === method.id ? '2px solid var(--primary)' : '2px solid transparent',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                                {method.name}
                                            </h4>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {method.type.replace('_', ' ').toUpperCase()}
                                            </p>
                                        </div>
                                        {selectedPaymentMethod === method.id && (
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                background: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white'
                                            }}>
                                                ✓
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
                <div className="animate-fade-in">
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
                        Confirm Your Order
                    </h3>

                    <div className="card glass-panel" style={{ padding: '2rem' }}>
                        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Ticket Details</h4>
                            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.95rem' }}>
                                <div><strong>Type:</strong> {selectedTicket?.name}</div>
                                <div><strong>Quantity:</strong> {quantity}</div>
                                <div><strong>Price per ticket:</strong> PKR {selectedTicket?.price}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Payment Method</h4>
                            <div>{selectedPayment?.name}</div>
                        </div>

                        <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--primary)' }}>
                            Total Amount: PKR {totalPrice}
                        </div>

                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                ℹ️ After confirming, you'll need to make the payment and submit proof for verification.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="btn btn-ghost"
                            style={{ minWidth: '100px' }}
                        >
                            ← Back
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="btn btn-ghost" style={{ minWidth: '100px' }}>
                        Cancel
                    </button>
                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="btn btn-primary"
                            disabled={!canProceed() || !eligibility.allowed}
                            style={{ minWidth: '100px' }}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={handlePurchase}
                            className="btn btn-primary"
                            disabled={loading || !eligibility.allowed}
                            style={{ minWidth: '120px' }}
                        >
                            {loading ? 'Processing...' : 'Confirm'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
