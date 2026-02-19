import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTicketing } from '../../context/TicketingContext';
import { Scan, CheckCircle, XCircle, AlertTriangle, Camera } from 'lucide-react';

// =====================================================
// COMPONENT: TICKET SCANNER
// =====================================================
// Allows organizers to validate tickets at event entry

export default function QRScanner({ eventId: propEventId }) {
    const { eventId: paramEventId } = useParams();
    const eventId = propEventId || paramEventId;

    const { validateTicket } = useTicketing();

    const [manualCode, setManualCode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);

    const handleManualValidation = async (e) => {
        e.preventDefault();

        if (!manualCode.trim()) {
            alert('Please enter a ticket code');
            return;
        }

        setScanning(true);
        setResult(null);

        const validationResult = await validateTicket(manualCode, eventId);

        setScanning(false);
        setResult(validationResult);

        // Clear after 5 seconds
        setTimeout(() => {
            setResult(null);
            setManualCode('');
        }, 5000);
    };

    const getResultDisplay = () => {
        if (!result) return null;

        if (result.success && result.data?.valid) {
            return (
                <div className="card glass-panel animate-fade-in" style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '2px solid rgba(34, 197, 94, 0.5)',
                    marginTop: '2rem'
                }}>
                    <CheckCircle size={64} style={{ color: '#86efac', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: '#86efac', fontSize: '1.5rem', marginBottom: '1rem' }}>
                        ✅ VALID TICKET
                    </h3>
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        <strong>Ticket Type:</strong> {result.data.ticket?.ticket_type?.name}
                    </div>
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        <strong>Holder:</strong> {result.data.ticket?.user?.firstName} {result.data.ticket?.user?.lastName}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                        Entry granted at {new Date().toLocaleTimeString()}
                    </div>
                </div>
            );
        }

        if (result.success && !result.data?.valid) {
            const reason = result.data?.reason || 'Unknown error';
            return (
                <div className="card glass-panel animate-fade-in" style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    marginTop: '2rem'
                }}>
                    <XCircle size={64} style={{ color: '#fca5a5', margin: '0 auto 1rem' }} />
                    <h3 style={{ color: '#fca5a5', fontSize: '1.5rem', marginBottom: '1rem' }}>
                        ❌ INVALID TICKET
                    </h3>
                    <div style={{ fontSize: '1.1rem' }}>
                        {reason === 'already_used' && 'This ticket has already been used'}
                        {reason === 'not_found' && 'Ticket not found in system'}
                        {reason === 'wrong_event' && 'This ticket is for a different event'}
                        {reason === 'invalid_signature' && 'Ticket signature is invalid (possible forgery)'}
                        {!['already_used', 'not_found', 'wrong_event', 'invalid_signature'].includes(reason) && reason}
                    </div>
                    {result.data?.ticket && (
                        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Ticket ID: {result.data.ticket.id?.substring(0, 8)}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="card glass-panel animate-fade-in" style={{
                padding: '2rem',
                textAlign: 'center',
                background: 'rgba(255, 193, 7, 0.2)',
                border: '2px solid rgba(255, 193, 7, 0.5)',
                marginTop: '2rem'
            }}>
                <AlertTriangle size={64} style={{ color: '#fbbf24', margin: '0 auto 1rem' }} />
                <h3 style={{ color: '#fbbf24', fontSize: '1.5rem', marginBottom: '1rem' }}>
                    ⚠️ ERROR
                </h3>
                <div style={{ fontSize: '1.1rem' }}>
                    {result.error || 'Failed to validate ticket'}
                </div>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ color: "var(--text-primary)",  fontSize: '2rem', marginBottom: 'var(--space-1)' }}>
                    🎫 Ticket Validator
                </h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Enter ticket codes to validate entry
                </p>
            </div>

            {/* Manual Entry Form */}
            <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
                <h3 style={{
                    color: 'var(--md-primary)',
                    marginBottom: 'var(--space-2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-1)',
                    fontSize: '1.125rem',
                    fontWeight: 600
                }}>
                    <Scan size={20} />
                    Ticket Validation
                </h3>

                <form onSubmit={handleManualValidation}>
                    <div className="form-group">
                        <label className="form-label">Ticket ID</label>
                        <input
                            type="text"
                            className="form-input"
                            value={manualCode}
                            onChange={e => setManualCode(e.target.value)}
                            placeholder="Enter ticket ID"
                            autoFocus
                            style={{ fontSize: '1rem', fontFamily: 'monospace' }}
                        />
                        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: 'var(--space-1)' }}>
                            Enter the ticket ID shown on the attendee's ticket
                        </small>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full-mobile"
                        disabled={scanning || !manualCode.trim()}
                        style={{ width: '100%' }}
                    >
                        {scanning ? (
                            <>
                                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                                Validating...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} />
                                Validate Ticket
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Validation Result */}
            {getResultDisplay()}

            {/* Instructions */}
            <div className="card" style={{
                background: 'rgba(25, 118, 210, 0.08)',
                border: '1px solid rgba(25, 118, 210, 0.2)',
                marginTop: 'var(--space-3)'
            }}>
                <h4 style={{ color: 'var(--md-primary)', marginBottom: 'var(--space-2)', fontSize: '1rem', fontWeight: 600 }}>
                    📋 How to Use:
                </h4>
                <ol style={{ paddingLeft: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.8' }}>
                    <li>Ask attendee to show their ticket</li>
                    <li>Enter the Ticket ID shown on their ticket</li>
                    <li>Click "Validate Ticket" to check</li>
                    <li>Grant entry if ticket is valid ✅</li>
                </ol>
            </div>
        </div>
    );
}
