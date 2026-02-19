import React, { useState } from 'react';
import { useTicketing } from '../../context/TicketingContext';
import { CheckCircle, XCircle, Eye, Clock, User, Calendar, DollarSign, AlertCircle } from 'lucide-react';

// =====================================================
// COMPONENT: PAYMENT VERIFICATION DASHBOARD
// =====================================================
// Allows organizers to approve/reject payment proofs

export default function PaymentVerificationDashboard() {
    const { orders, verifyPayment, loading } = useTicketing();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const pendingOrders = orders.filter(o => o.status === 'pending_verification');
    const approvedOrders = orders.filter(o => o.status === 'paid');
    const rejectedOrders = orders.filter(o => o.status === 'rejected');

    const handleVerify = async (orderId, action) => {
        if (action === 'reject' && !rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        if (!window.confirm(`Are you sure you want to ${action} this payment?`)) {
            return;
        }

        setProcessing(true);
        const result = await verifyPayment(
            orderId,
            action,
            action === 'reject' ? rejectionReason : null
        );
        setProcessing(false);

        if (result.success) {
            alert(`Payment ${action}d successfully!`);
            setSelectedOrder(null);
            setRejectionReason('');
        } else {
            alert('Error: ' + result.error);
        }
    };

    const OrderCard = ({ order, showActions = false }) => (
        <div className="card glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.1rem', wordBreak: 'break-word' }}>
                        {order.event?.title}
                    </h4>
                    <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <User size={14} style={{ flexShrink: 0 }} />
                            <span style={{ wordBreak: 'break-word', minWidth: 0 }}>{order.user?.firstName} {order.user?.lastName} ({order.user?.email})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Calendar size={14} style={{ flexShrink: 0 }} />
                            <span>Ordered: {new Date(order.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <DollarSign size={14} style={{ flexShrink: 0 }} />
                            <span style={{ wordBreak: 'break-word' }}>{order.ticket_type?.name} × {order.quantity} = PKR {order.total_amount}</span>
                        </div>
                    </div>
                </div>

                <div style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    background: order.status === 'paid' ? 'rgba(34, 197, 94, 0.2)' :
                        order.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' :
                            'rgba(255, 193, 7, 0.2)',
                    color: order.status === 'paid' ? '#86efac' :
                        order.status === 'rejected' ? '#fca5a5' :
                            '#fbbf24'
                }}>
                    {order.status.replace('_', ' ').toUpperCase()}
                </div>
            </div>

            {showActions && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setSelectedOrder(order)}
                        className="btn btn-ghost btn-full-mobile"
                        style={{ flex: '1 1 120px' }}
                    >
                        <Eye size={16} style={{ marginRight: '0.5rem' }} />
                        <span className="hide-mobile">View Details</span>
                        <span className="show-mobile">View</span>
                    </button>
                    <button
                        onClick={() => handleVerify(order.id, 'approve')}
                        className="btn btn-primary btn-full-mobile"
                        disabled={processing}
                        style={{ flex: '1 1 120px' }}
                    >
                        <CheckCircle size={16} style={{ marginRight: '0.5rem' }} />
                        Approve
                    </button>
                    <button
                        onClick={() => {
                            setSelectedOrder(order);
                            // Will show rejection form
                        }}
                        className="btn btn-ghost btn-full-mobile"
                        style={{ flex: '1 1 120px', color: 'var(--danger)' }}
                    >
                        <XCircle size={16} style={{ marginRight: '0.5rem' }} />
                        Reject
                    </button>
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading orders...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ color: "var(--text-primary)",  fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: '600' }}>
                Payment Verification
            </h2>

            {/* Stats Cards - Material Design */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <div className="card" style={{ 
                    padding: 'var(--space-3)', 
                    background: 'var(--bg-elevated)',
                    borderLeft: '4px solid #fbbf24',
                    boxShadow: 'var(--elevation-2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                        <Clock size={24} style={{ color: '#fbbf24', opacity: 0.8 }} />
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24' }}>
                            {pendingOrders.length}
                        </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Pending Review
                    </div>
                </div>

                <div className="card" style={{ 
                    padding: 'var(--space-3)', 
                    background: 'var(--bg-elevated)',
                    borderLeft: '4px solid var(--md-success)',
                    boxShadow: 'var(--elevation-2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                        <CheckCircle size={24} style={{ color: 'var(--md-success)', opacity: 0.8 }} />
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--md-success)' }}>
                            {approvedOrders.length}
                        </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Approved
                    </div>
                </div>

                <div className="card" style={{ 
                    padding: 'var(--space-3)', 
                    background: 'var(--bg-elevated)',
                    borderLeft: '4px solid var(--md-error)',
                    boxShadow: 'var(--elevation-2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                        <XCircle size={24} style={{ color: 'var(--md-error)', opacity: 0.8 }} />
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--md-error)' }}>
                            {rejectedOrders.length}
                        </div>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Rejected
                    </div>
                </div>
            </div>

            {/* Pending Orders */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <h3 style={{ 
                    marginBottom: 'var(--space-2)', 
                    color: 'var(--text-primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-1)',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    paddingBottom: 'var(--space-1)',
                    borderBottom: '2px solid var(--divider)'
                }}>
                    <Clock size={22} style={{ color: '#fbbf24' }} />
                    Pending Verification
                    <span className="badge badge-accent" style={{ marginLeft: 'auto', fontSize: '0.875rem' }}>
                        {pendingOrders.length}
                    </span>
                </h3>

                {pendingOrders.length === 0 ? (
                    <div className="card" style={{ 
                        padding: 'var(--space-6)', 
                        textAlign: 'center',
                        background: 'var(--bg-secondary)',
                        border: '2px dashed var(--divider)'
                    }}>
                        <CheckCircle size={56} style={{ margin: '0 auto var(--space-2)', color: 'var(--text-disabled)' }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '500' }}>
                            All caught up! No pending payments to verify.
                        </p>
                    </div>
                ) : (
                    pendingOrders.map(order => <OrderCard key={order.id} order={order} showActions={true} />)
                )}
            </div>

            {/* Approved Orders */}
            {approvedOrders.length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
                        <CheckCircle size={20} style={{ color: 'var(--md-success)' }} />
                        Approved Payments ({approvedOrders.length})
                    </h3>
                    {approvedOrders.slice(0, 5).map(order => <OrderCard key={order.id} order={order} />)}
                    {approvedOrders.length > 5 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '1rem' }}>
                            Showing 5 of {approvedOrders.length} approved payments
                        </p>
                    )}
                </div>
            )}

            {/* Rejected Orders */}
            {rejectedOrders.length > 0 && (
                <div style={{ marginBottom: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
                        <AlertCircle size={20} style={{ color: 'var(--md-error)' }} />
                        Rejected Payments ({rejectedOrders.length})
                    </h3>
                    {rejectedOrders.map(order => (
                        <div key={order.id} className="card glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: '4px solid var(--md-error)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                                        {order.event?.title}
                                    </h4>
                                    <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={14} />
                                            <span>{order.user?.firstName} {order.user?.lastName}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <DollarSign size={14} />
                                            <span>{order.ticket_type?.name} × {order.quantity} = PKR {order.total_amount}</span>
                                        </div>
                                        {order.rejection_reason && (
                                            <div style={{ 
                                                marginTop: '0.5rem', 
                                                padding: '0.75rem', 
                                                background: 'rgba(239, 68, 68, 0.1)', 
                                                borderRadius: 'var(--radius-md)',
                                                borderLeft: '3px solid var(--md-error)'
                                            }}>
                                                <strong style={{ color: 'var(--md-error)', fontSize: '0.85rem' }}>Rejection Reason:</strong>
                                                <p style={{ marginTop: '0.25rem', color: 'var(--text-primary)' }}>{order.rejection_reason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="badge badge-error" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                                    REJECTED
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(order)}
                                className="btn btn-ghost btn-sm"
                            >
                                <Eye size={16} style={{ marginRight: '0.5rem' }} />
                                View Details
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
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
                        padding: '2rem',
                        overflowY: 'auto'
                    }}
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        className="card glass-panel"
                        style={{ maxWidth: '700px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>
                            Payment Details
                        </h3>

                        {/* Order Info */}
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                <div><strong>Order ID:</strong> {selectedOrder.id}</div>
                                <div><strong>Event:</strong> {selectedOrder.event?.title}</div>
                                <div><strong>Customer:</strong> {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</div>
                                <div><strong>Email:</strong> {selectedOrder.user?.email}</div>
                                <div><strong>Ticket:</strong> {selectedOrder.ticket_type?.name} × {selectedOrder.quantity}</div>
                                <div><strong>Total:</strong> PKR {selectedOrder.total_amount}</div>
                            </div>
                        </div>

                        {/* Payment Proof */}
                        {selectedOrder.payment_proof_url && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{ marginBottom: '0.75rem' }}>Payment Proof:</h4>
                                <img
                                    src={selectedOrder.payment_proof_url}
                                    alt="Payment proof"
                                    style={{
                                        maxWidth: '100%',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                />
                                {selectedOrder.payment_details && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                        <div><strong>Transaction ID:</strong> {selectedOrder.payment_details.transactionId}</div>
                                        <div><strong>Payment Date:</strong> {new Date(selectedOrder.payment_details.paymentDate).toLocaleString()}</div>
                                        {selectedOrder.payment_details.notes && (
                                            <div><strong>Notes:</strong> {selectedOrder.payment_details.notes}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Rejection Form */}
                        {selectedOrder.status === 'pending_verification' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">Rejection Reason (if rejecting):</label>
                                <textarea
                                    className="form-textarea"
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    placeholder="Explain why the payment is being rejected..."
                                    rows="3"
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                            {selectedOrder.status === 'pending_verification' && (
                                <>
                                    <button
                                        onClick={() => handleVerify(selectedOrder.id, 'approve')}
                                        className="btn btn-primary"
                                        disabled={processing}
                                        style={{ flex: '1 1 140px' }}
                                    >
                                        <CheckCircle size={18} />
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleVerify(selectedOrder.id, 'reject')}
                                        className="btn btn-ghost"
                                        disabled={processing}
                                        style={{ flex: '1 1 140px', color: 'var(--md-error)' }}
                                    >
                                        <XCircle size={18} />
                                        Reject
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="btn btn-ghost"
                                style={{ flex: '1 1 100px' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
