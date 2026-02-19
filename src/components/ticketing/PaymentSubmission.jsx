import React, { useState } from 'react';
import { useTicketing } from '../../context/TicketingContext';
import { Upload, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

// =====================================================
// COMPONENT: PAYMENT SUBMISSION
// =====================================================
// Allows users to submit payment proof for their orders

export default function PaymentSubmission({ order, onClose, onSubmitted }) {
    const { submitPaymentProof } = useTicketing();

    const [paymentDetails, setPaymentDetails] = useState({
        transactionId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [proofFile, setProofFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProofFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!proofFile) {
            alert('Please upload payment proof');
            return;
        }

        setLoading(true);
        const result = await submitPaymentProof(order.id, paymentDetails, proofFile);
        setLoading(false);

        if (result.success) {
            alert('Payment proof submitted! Waiting for organizer verification.');
            if (onSubmitted) onSubmitted();
            onClose();
        } else {
            alert('Error: ' + result.error);
        }
    };

    const paymentMethod = order.payment_method || {};
    const accountDetails = paymentMethod.account_details || {};

    return (
        <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ color: "var(--text-primary)", fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                💳 Submit Payment Proof
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Order #{order.id.substring(0, 8)}
            </p>

            {/* Order Summary */}
            <div className="card glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Order Summary</h3>
                <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
                    <div><strong>Event:</strong> {order.event?.title}</div>
                    <div><strong>Ticket Type:</strong> {order.ticket_type?.name}</div>
                    <div><strong>Quantity:</strong> {order.quantity}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--primary)', marginTop: '0.5rem' }}>
                        <strong>Total Amount:</strong> PKR {order.total_amount}
                    </div>
                </div>
            </div>

            {/* Payment Instructions */}
            <div className="card glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                    Payment Instructions
                </h3>
                <div style={{ marginBottom: '1rem' }}>
                    <strong>Payment Method:</strong> {paymentMethod.name}
                </div>

                {paymentMethod.type === 'bank_transfer' && (
                    <div style={{ display: 'grid', gap: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                        <div><strong>Account Title:</strong> {accountDetails.accountTitle}</div>
                        <div><strong>Account Number:</strong> {accountDetails.accountNumber}</div>
                        <div><strong>Bank Name:</strong> {accountDetails.bankName}</div>
                    </div>
                )}

                {(paymentMethod.type === 'easypaisa' || paymentMethod.type === 'jazzcash') && (
                    <div style={{ display: 'grid', gap: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                        <div><strong>Account Title:</strong> {accountDetails.accountTitle}</div>
                        <div><strong>Phone Number:</strong> {accountDetails.phoneNumber}</div>
                    </div>
                )}

                {paymentMethod.type === 'cash' && (
                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                        <div>{accountDetails.instructions}</div>
                    </div>
                )}

                {paymentMethod.instructions && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.9rem' }}>
                        <em>{paymentMethod.instructions}</em>
                    </div>
                )}
            </div>

            {/* Payment Proof Form */}
            <form onSubmit={handleSubmit}>
                <div className="card glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                        Upload Payment Proof
                    </h3>

                    <div className="form-group">
                        <label className="form-label">Transaction ID / Reference Number</label>
                        <input
                            type="text"
                            className="form-input"
                            value={paymentDetails.transactionId}
                            onChange={e => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                            placeholder="e.g., TXN123456789"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Payment Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={paymentDetails.paymentDate}
                            onChange={e => setPaymentDetails({ ...paymentDetails, paymentDate: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Payment Screenshot / Receipt *</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="form-input"
                            required
                        />
                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem' }}>
                            Upload a clear screenshot or photo of your payment receipt
                        </small>
                    </div>

                    {preview && (
                        <div style={{ marginTop: '1rem' }}>
                            <label className="form-label">Preview:</label>
                            <img
                                src={preview}
                                alt="Payment proof preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Additional Notes (Optional)</label>
                        <textarea
                            className="form-textarea"
                            value={paymentDetails.notes}
                            onChange={e => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
                            placeholder="Any additional information..."
                            rows="3"
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !proofFile}
                        style={{ flex: 1 }}
                    >
                        {loading ? 'Submitting...' : 'Submit Payment Proof'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-ghost"
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {/* Info Box */}
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                gap: '0.75rem'
            }}>
                <AlertCircle size={20} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Important:</strong> Your payment will be verified by the event organizer.
                    You'll receive your tickets once the payment is approved. This usually takes a few hours.
                </div>
            </div>
        </div>
    );
}
