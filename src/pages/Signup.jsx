import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import { Briefcase, Medal, Newspaper, ArrowLeft, ArrowRight, Eye } from 'lucide-react';

// -----------------------------------------------------------------------------
// HELPER COMPONENT: RoleCard
// -----------------------------------------------------------------------------
// Reusable card for selecting "Organizer", "Athlete", or "Reporter"
const RoleCard = ({ icon: IconComponent, title, description, selected, onClick }) => (
    <div
        onClick={onClick}
        className={`card glass-panel`}
        style={{
            cursor: 'pointer',
            textAlign: 'center',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            border: selected ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
            transform: selected ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.2s'
        }}
    >
        <div style={{ padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '50%', color: selected ? 'var(--primary)' : 'var(--text-secondary)' }}>
            {React.createElement(IconComponent, { size: 32 })}
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>{title}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{description}</p>
    </div>
);

// -----------------------------------------------------------------------------
// PAGE: SIGNUP
// -----------------------------------------------------------------------------
// This is the most complex form in the app. It handles multi-step registration.
// Step 1: Email/Password
// Step 2: Role Selection
// Step 3: Detailed Profile setup (Dynamic fields based on Role)

export default function Signup() {
    // 1. HOOKS - ALL HOOKS MUST BE AT THE TOP, BEFORE ANY RETURNS
    const navigate = useNavigate();
    const { user, signup, loading: isLoadingAuth } = useAuth();

    // 2. STATE VARIABLES - MUST BE BEFORE ANY CONDITIONAL RETURNS
    const [step, setStep] = useState(1);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        bio: '',
        contact: '',
        website: '',
        profilePicture: '',
        companyName: '',
        firstName: '',
        lastName: '',
        category: 'Boxing',
        previousVictories: '',
        socialMedia: '',
        mediaOrganization: '',
        reporterCategory: 'Sports Reporter',
    });

    // 3. EFFECTS
    React.useEffect(() => {
        if (!isLoadingAuth && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isLoadingAuth, navigate]);

    // 4. EARLY RETURNS (AFTER ALL HOOKS)
    if (isLoadingAuth) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(59, 130, 246, 0.3)', borderRadius: '50%', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    // 5. EVENT HANDLERS
    // 5. EVENT HANDLERS

    // Generic input handler for text fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Step 1: Validate Password & Move to Role Selection
    const handleCredentialsSubmit = (e) => {
        e.preventDefault();
        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        // Validation moved to server side mostly, so we proceed.
        setStep(2);
    };

    // Step 2: Select Role & Move to Details
    const handleRoleSelect = (selectedRole) => {
        setRole(selectedRole);
        setStep(3);
    };

    // Step 3: Final Submission
    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Disable button

        // Security Check: Enforce Role rules
        if (role === 'reporter' && formData.reporterCategory !== 'Sports Reporter') {
            alert('You must identify as a Sports Reporter to access this portal.');
            setLoading(false);
            return;
        }

        // --- PREPARE DATA FOR SUPABASE ---
        // Note: With Supabase, we handle file uploads separately in the storage bucket
        // The signup function in AuthContext will handle the user creation
        const submissionData = {
            email: formData.email,
            password: formData.confirmPassword,
            role: role,
            contact: formData.contact,
            address: formData.address,
            bio: formData.bio
        };

        if (formData.website) submissionData.website = formData.website;

        // Add Profile Picture handling (will be uploaded to Supabase Storage)
        if (formData.profilePicture instanceof File) {
            submissionData.avatar = formData.profilePicture;
        }

        // D. Add Role-Specific Fields
        // Only append data relevant to the chosen role.

        if (role === 'organizer') {
            submissionData.companyName = formData.companyName;
        } else {
            // Both Athletes and Reporters have First/Last names.
            submissionData.firstName = formData.firstName;
            submissionData.lastName = formData.lastName;
        }

        if (role === 'athlete') {
            submissionData.category = formData.category;
            if (formData.previousVictories) submissionData.previousVictories = formData.previousVictories;
            if (formData.socialMedia) submissionData.socialMedia = formData.socialMedia;
        }

        if (role === 'reporter') {
            submissionData.category = formData.category;
            submissionData.mediaOrganization = formData.mediaOrganization;
            submissionData.reporterCategory = formData.reporterCategory;
        }

        // --- SEND TO SERVER ---
        try {
            // Safety Timeout: If server doesn't respond in 15s, throw error.
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Network Error: Request timed out. Connectivity to the server (Supabase) might be blocked by a firewall.")), 15000)
            );

            // Execute Signup API Call
            const result = await Promise.race([signup(submissionData), timeoutPromise]);

            if (result.success) {
                // Success! Redirect to Dashboard.
                // The signup function in Context already handles auto-login.
                navigate('/dashboard');
            } else {
                // Error Handling logic

                // Check if email is already taken
                const isDuplicate = result.details?.email?.code === 'validation_not_unique' ||
                    result.details?.username?.code === 'validation_not_unique';

                if (isDuplicate) {
                    const toLogin = window.confirm("Account already exists!\n\nThe email address you entered is already registered.\n\nClick OK to Log In or Cancel to try a different email.");
                    if (toLogin) {
                        navigate('/login');
                        return; // Stop execution
                    }
                }

                // Show detailed error
                const debugInfo = result.details ? JSON.stringify(result.details, null, 2) : "";
                alert("Signup Failed:\n" + (result.error || "Unknown Error") + "\n\nDetails:\n" + debugInfo);
            }
        } catch (err) {
            console.error(err);
            alert("Critical Error: " + err.message);
        } finally {
            setLoading(false); // Re-enable button
        }
    }

    // 4. RENDER WIZARD UI
    return (
        <div style={{ maxWidth: step === 2 ? '900px' : '600px', margin: '0 auto' }}>

            {/* Progress Indicator (1 - 2 - 3) */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
                {[1, 2, 3].map(s => (
                    <div key={s} style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: step >= s ? 'var(--primary)' : 'var(--bg-tertiary)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                    }}>
                        {s}
                    </div>
                ))}
            </div>

            {/* --- STEP 1: EMAIL & PASSWORD --- */}
            {step === 1 && (
                <div className="card glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ color: "var(--text-primary)",  textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem' }}>Create Account</h2>
                    <form onSubmit={handleCredentialsSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input required type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="user@example.com" autoComplete="username" disabled={loading} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input required type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} autoComplete="new-password" disabled={loading} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input required type="password" name="confirmPassword" className="form-input" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" disabled={loading} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                            Next <ArrowRight size={18} />
                        </button>

                        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
                            Already have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/login')}>Log In</span>
                        </p>
                    </form>
                </div>
            )}

            {/* --- STEP 2: ROLE SELECTION --- */}
            {step === 2 && (
                <div>
                    <h2 style={{ color: "var(--text-primary)",  textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>Choose your Role</h2>
                    {/* Grid Layout for Roles */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <RoleCard
                            icon={Briefcase}
                            title="Organization"
                            description="Create & manage events"
                            selected={role === 'organizer'}
                            onClick={() => handleRoleSelect('organizer')}
                        />
                        <RoleCard
                            icon={Medal}
                            title="Athlete"
                            description="Join events & compete."
                            onClick={() => handleRoleSelect('athlete')}
                        />
                        <RoleCard
                            icon={Newspaper}
                            title="Reporter"
                            description="Cover news & publish."
                            onClick={() => handleRoleSelect('reporter')}
                        />
                        <RoleCard
                            icon={Eye}
                            title="Viewer"
                            description="Browse & explore content."
                            onClick={() => handleRoleSelect('viewer')}
                        />
                    </div>
                    <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ marginTop: '2rem', color: 'var(--text-secondary)' }}>
                        <ArrowLeft size={18} />
                    </button>
                </div>
            )}

            {/* --- STEP 3: DETAILS FORM --- */}
            {step === 3 && (
                <div className="card glass-panel" style={{ padding: '2rem' }}>
                    <h2 style={{ color: "var(--text-primary)",  textAlign: 'center', marginBottom: '1.5rem', fontSize: '2rem' }}>
                        {role.charAt(0).toUpperCase() + role.slice(1)} Details
                    </h2>

                    <form onSubmit={handleFinalSubmit}>

                        {/* 1. Identity Fields (Name/Company) */}
                        {role !== 'organizer' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input required type="text" name="firstName" className="form-input" value={formData.firstName} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input required type="text" name="lastName" className="form-input" value={formData.lastName} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        {role === 'organizer' && (
                            <div className="form-group">
                                <label className="form-label">Company Name</label>
                                <input required type="text" name="companyName" className="form-input" value={formData.companyName} onChange={handleChange} />
                            </div>
                        )}

                        {/* 2. Common Fields */}
                        <div className="form-group">
                            <label className="form-label">Bio {role === 'viewer' && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>(Optional)</span>}</label>
                            <textarea required={role !== 'viewer'} name="bio" className="form-textarea" rows="3" value={formData.bio} onChange={handleChange} placeholder={role === 'viewer' ? 'Tell us about yourself (optional)...' : 'Tell us about yourself...'} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Profile Picture</label>
                            {/* Special Image Component for Previews */}
                            <ImageUpload
                                value={formData.profilePicture}
                                onChange={(val) => setFormData(prev => ({ ...prev, profilePicture: val }))}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Contact Number</label>
                                <input required type="tel" name="contact" className="form-input" value={formData.contact} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input required type="text" name="address" className="form-input" value={formData.address} onChange={handleChange} />
                            </div>
                        </div>

                        {/* 3. Role-Specific Logic Blocks */}

                        {/* ORGANIZER */}
                        {role === 'organizer' && (
                            <div className="form-group">
                                <label className="form-label">Website Link</label>
                                <input type="url" name="website" className="form-input" value={formData.website} onChange={handleChange} />
                            </div>
                        )}

                        {/* ATHLETE */}
                        {role === 'athlete' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Sports Category</label>
                                    <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
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
                                <div className="form-group">
                                    <label className="form-label">Previous Victories</label>
                                    <textarea name="previousVictories" className="form-textarea" placeholder="List major wins..." value={formData.previousVictories} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Social Media Handles</label>
                                    <input type="text" name="socialMedia" className="form-input" value={formData.socialMedia} onChange={handleChange} />
                                </div>
                            </>
                        )}

                        {/* REPORTER */}
                        {role === 'reporter' && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Role Title</label>
                                    <input disabled type="text" name="reporterCategory" className="form-input" value="Sports Reporter" style={{ opacity: 0.7 }} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sports Category</label>
                                    <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
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
                                <div className="form-group">
                                    <label className="form-label">Media Organization</label>
                                    <input required type="text" name="mediaOrganization" className="form-input" value={formData.mediaOrganization} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Website / Portfolio</label>
                                    <input type="url" name="website" className="form-input" value={formData.website} onChange={handleChange} />
                                </div>
                            </>
                        )}

                        {/* ACTION BUTTONS */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button type="button" onClick={() => setStep(2)} className="btn btn-outline" disabled={loading}>Back</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                {loading ? 'Processing...' : 'Complete Signup'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
