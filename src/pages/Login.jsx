import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowLeft, ArrowRight, Key } from 'lucide-react';

// -----------------------------------------------------------------------------
// PAGE: LOGIN
// -----------------------------------------------------------------------------
// This page handles user authentication.
// It uses functions from AuthContext to check credentials and start a valid session.

export default function Login() {
    // 1. HOOKS
    const navigate = useNavigate(); // For redirecting after login
    const { user, login, requestPasswordReset, loading: isLoadingAuth } = useAuth(); // Import auth functions

    // Redirect if already logged in
    React.useEffect(() => {
        if (!isLoadingAuth && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isLoadingAuth, navigate]);

    // 2. STATE (Local to this page)
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState(''); // To display error messages (e.g. "Wrong Password")
    const [message, setMessage] = useState(''); // To display success messages (e.g. "Link Sent")
    const [loading, setLoading] = useState(false); // To disable buttons while processing
    const [isForgotMode, setIsForgotMode] = useState(false); // Toggle between Login and Password Reset forms

    if (isLoadingAuth) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59, 130, 246, 0.3)', borderRadius: '50%', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    // 3. HANDLERS

    // Handle Login Submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Stop page reload
        
        // Prevent multiple submissions
        if (loading) return;
        
        setError('');
        setLoading(true);

        try {
            // Call the login function from AuthContext
            const result = await login(formData.email, formData.password);

            if (result.success) {
                // Don't navigate here - let the useEffect handle it
                // The auth state listener will update the user and trigger the redirect
            } else {
                // If failed, show error message
                setError(result.error || 'Invalid email or password');
                setLoading(false);
            }
        } catch (err) {
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    // Handle Password Reset Submission
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        // Call reset function
        const result = await requestPasswordReset(formData.email);

        if (result.success) {
            setMessage('Password reset link sent! Check your email.');
            setLoading(false);
        } else {
            setError(result.error || 'Failed to send reset link.');
            setLoading(false);
        }
    }

    // 4. RENDER
    return (
        <div style={{ maxWidth: '450px', margin: '4rem auto', padding: '0 1rem' }}>
            <div className="card glass-panel" style={{ padding: '2.5rem' }}>

                {/* --- HEADER SECTION --- */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '60px', height: '60px', background: 'var(--bg-tertiary)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1rem',
                        color: 'var(--primary)', border: '1px solid var(--glass-border)'
                    }}>
                        <Lock size={30} />
                    </div>
                    <h2 style={{ color: "var(--text-primary)",  fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {isForgotMode ? 'Reset Password' : 'Welcome Back'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isForgotMode ? 'Enter your email to receive a reset link' : 'Enter your credentials to access your account'}
                    </p>
                </div>

                {/* --- STATUS MESSAGES --- */}
                {/* Conditionally renders an Error Box or Success Box if needed */}
                {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{error}</div>}
                {message && <div style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.3)' }}>{message}</div>}

                {/* --- MAIN FORM --- */}
                {/* One form handles both modes based on isForgotMode state */}
                <form onSubmit={isForgotMode ? handleForgotSubmit : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Email Input (Always Visible) */}
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                required
                                type="email"
                                className="form-input"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="name@example.com"
                                style={{ paddingLeft: '2.8rem' }}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Password Input (Login Mode Only) */}
                    {!isForgotMode && (
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                Password
                                <span
                                    onClick={() => setIsForgotMode(true)}
                                    style={{ fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'none' }}
                                >
                                    Forgot Password?
                                </span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    required
                                    type="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    style={{ paddingLeft: '2.8rem' }}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                        {loading ? 'Processing...' : (isForgotMode ? 'Send Reset Link' : 'Log In')}
                        {!loading && !isForgotMode && <ArrowRight size={18} />}
                    </button>

                </form>

                {/* --- FOOTER --- */}
                <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                    {isForgotMode ? (
                        // Back to Login Link
                        <button
                            onClick={() => setIsForgotMode(false)}
                            className="btn btn-ghost"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <ArrowLeft size={16} />
                        </button>
                    ) : (
                        // Sign Up Link
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Don't have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }} onClick={() => navigate('/signup')}>Sign Up</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
