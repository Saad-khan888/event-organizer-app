import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import { getImageUrl } from '../lib/supabase';
import { User, MapPin, Globe, Phone, Mail, Clock, Edit2, Save, X, Trash2 } from 'lucide-react';
import MyTickets from '../components/ticketing/MyTickets';

// -----------------------------------------------------------------------------
// PAGE: PROFILE
// -----------------------------------------------------------------------------
// This page displays a user's profile information (Athlete, Organizer, or Reporter).
// It also allows the owner to edit their details and manage their content.

export default function Profile() {
    // 1. INITIALIZATION
    const { id } = useParams(); // Get user ID from the URL (e.g. /profile/123)
    const { users, events, reports, updateUser, deleteEvent, deleteReport } = useData();
    const { user: currentUser } = useAuth(); // The currently logged-in user

    // Find the user we are currently viewing.
    // If it's the current user, use the auth object (more up-to-date session).
    const user = (currentUser && String(currentUser.id) === String(id)) ? currentUser : users.find(u => String(u.id) === String(id));

    // 2. STATE (For Editing Mode)
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({}); // Stores temporary changes before saving

    // Fallback: If no user found with that ID
    if (!user) return (
        <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h2>User not found</h2>
            <p style={{ color: 'var(--text-secondary)' }}>The user with ID {id} could not be found.</p>
        </div>
    );

    // Permission Check: Is the person viewing this page the owner?
    const isOwnProfile = currentUser && currentUser.id === user.id;

    // 3. CONTENT FILTERING
    const today = new Date().toISOString().split('T')[0];

    // For Organizers: Events they created
    const organizeEvents = events.filter(e => String(e.organizer) === String(user.id) || String(e.organizerId) === String(user.id));

    // Sort Ongoing: Nearest future date first
    const ongoingEvents = organizeEvents
        .filter(e => e.date >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Sort Past: Most recent completed event first
    // For Athletes: Events they joined
    const participatedEvents = events.filter(e => e.participants && e.participants.includes(user.id));

    // For Reporters: News they published
    const userReports = reports.filter(r => r.reporter === user.id);

    // 4. EVENT HANDLERS

    // Start editing mode: Load user data into the temporary edit form.
    const startEdit = () => {
        setEditForm({ ...user });
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditForm({});
    };

    // Save changes to the backend
    const saveEdit = async () => {
        try {
            const updateData = {};

            // Add all text fields
            Object.keys(editForm).forEach(key => {
                if (key !== 'avatar' && key !== 'profilePicture' && key !== 'expand' && key !== 'created' && key !== 'updated' && editForm[key] !== undefined && editForm[key] !== null) {
                    updateData[key] = editForm[key];
                }
            });

            // Handle avatar upload if a new image was chosen
            if (editForm.avatar instanceof File) {
                const { uploadFile } = await import('../lib/supabase');
                const avatarPath = await uploadFile('avatars', editForm.avatar, user.id);
                updateData.avatar = avatarPath;
            }

            await updateUser(user.id, updateData);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    };

    const handleChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    // Management handlers (Delete Content)
    const handleDeleteEvent = (eventId, eventTitle) => {
        if (window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
            deleteEvent(eventId);
        }
    };

    const handleDeleteReport = (reportId, reportTitle) => {
        if (window.confirm(`Are you sure you want to delete "${reportTitle}"?`)) {
            deleteReport(reportId);
        }
    };

    // 5. RENDER
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

            {/* --- PROFILE HEADER CARD --- */}
            <div className="card" style={{
                textAlign: 'center',
                marginBottom: 'var(--space-4)',
                padding: 'var(--space-4)',
                position: 'relative'
            }}>
                {/* Edit Button (Top Right) */}
                {isOwnProfile && !isEditing && (
                    <button
                        onClick={startEdit}
                        className="btn btn-outline btn-sm"
                        style={{
                            position: 'absolute',
                            top: 'var(--space-2)',
                            right: 'var(--space-2)',
                            zIndex: 10
                        }}
                    >
                        <Edit2 size={16} />
                        <span className="hide-mobile">Edit Profile</span>
                    </button>
                )}

                {/* --- IMAGE AREA --- */}
                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'var(--bg-tertiary)',
                    margin: '0 auto var(--space-3)',
                    overflow: 'hidden',
                    border: '3px solid var(--md-primary)',
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: 'var(--elevation-2)'
                }}>
                    {(() => {
                        let src = null;
                        // Determine which image URL to use (Temp Preview vs Database URL vs Default Icon)
                        if (isEditing) {
                            if (editForm.avatar instanceof File) src = URL.createObjectURL(editForm.avatar);
                            else if (typeof editForm.avatar === 'string') src = getImageUrl('avatars', editForm.avatar);
                        }
                        if (!src) {
                            if (user.avatar) src = getImageUrl('avatars', user.avatar);
                            else if (user.profilePicture) src = getImageUrl('avatars', user.profilePicture);
                        }

                        return src ? (
                            <img src={src} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <User size={60} style={{ margin: '30px', color: 'var(--text-secondary)' }} />
                        );
                    })()}
                </div>

                {/* Upload Component (Visible only when editing) */}
                {isEditing && (
                    <div className="form-group" style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
                        <label className="form-label">Profile Picture</label>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <ImageUpload
                                value={editForm.avatar || editForm.profilePicture}
                                onChange={(val) => setEditForm(prev => ({ ...prev, avatar: val }))}
                                placeholder="Change Avatar"
                            />
                        </div>
                    </div>
                )}

                {/* --- NAMES & TITLES --- */}
                {isEditing ? (
                    // Edit Mode Inputs
                    <div style={{ marginBottom: '1rem' }}>
                        {user.role === 'organizer' ? (
                            <input type="text" name="companyName" className="form-input" style={{ fontSize: '1.5rem', textAlign: 'center', fontWeight: 'bold' }} value={editForm.companyName} onChange={handleChange} />
                        ) : (
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <input type="text" name="firstName" className="form-input" value={editForm.firstName} onChange={handleChange} placeholder="First Name" />
                                <input type="text" name="lastName" className="form-input" value={editForm.lastName} onChange={handleChange} placeholder="Last Name" />
                            </div>
                        )}
                    </div>
                ) : (
                    // Display Mode Text
                    <h1 style={{ color: "var(--text-primary)", fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                        {user.companyName || `${user.firstName} ${user.lastName}`}
                    </h1>
                )}

                {/* Role Badges */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{user.role}</span>
                    {user.category && user.category.trim() !== '' && <span className="badge badge-secondary">{user.category}</span>}
                    {user.mediaOrganization && user.mediaOrganization.trim() !== '' && <span className="badge badge-outline">{user.mediaOrganization}</span>}
                </div>

                {/* --- CONTACT INFO GRID --- */}
                <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', color: 'var(--text-secondary)' }}>
                    {isEditing ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', width: '100%' }}>
                            <input name="address" className="form-input" placeholder="Address" value={editForm.address} onChange={handleChange} />
                            <input name="website" className="form-input" placeholder="Website" value={editForm.website} onChange={handleChange} />
                            <input name="contact" className="form-input" placeholder="Phone" value={editForm.contact} onChange={handleChange} />
                        </div>
                    ) : (
                        <>
                            {user.address && <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><MapPin size={18} /> {user.address}</span>}
                            {user.website && <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Globe size={18} /> <a href={user.website} target="_blank" style={{ textDecoration: 'underline' }}>Website</a></span>}
                            {user.email && <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Mail size={18} /> {user.email}</span>}
                            {user.contact && <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Phone size={18} /> {user.contact}</span>}
                        </>
                    )}
                </div>

                {/* Bio Block */}
                <div style={{ maxWidth: '600px', margin: '2rem auto 0', lineHeight: 1.8, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {isEditing ? (
                        <textarea name="bio" className="form-textarea" rows="4" value={editForm.bio} onChange={handleChange} />
                    ) : (
                        user.bio
                    )}
                </div>

                {/* Athlete-Only: Champions / Wins */}
                {(user.previousVictories || isEditing) && user.role === 'athlete' && (
                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Championships & Victories</h4>
                        {isEditing ? (
                            <textarea name="previousVictories" className="form-textarea" value={editForm.previousVictories} onChange={handleChange} />
                        ) : (
                            <p>{user.previousVictories || 'None listed.'}</p>
                        )}
                    </div>
                )}

                {/* SAVE/CANCEL ACTIONS */}
                {isEditing && (
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                        <button onClick={cancelEdit} className="btn btn-outline"><X size={18} /> Cancel</button>
                        <button onClick={saveEdit} className="btn btn-primary"><Save size={18} /> Save Changes</button>
                    </div>
                )}
            </div>

            {/* --- MY TICKETS SECTION (Only for Owner) --- */}
            {isOwnProfile && user.role !== 'athlete' && (
                <div style={{ marginBottom: 'var(--space-6)' }}>
                    <div style={{
                        marginBottom: 'var(--space-3)',
                        paddingBottom: 'var(--space-2)',
                        borderBottom: '2px solid var(--divider)'
                    }}>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)'
                        }}>My Tickets</h2>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem',
                            marginTop: 'var(--space-1)'
                        }}>View and manage your event tickets</p>
                    </div>
                    <MyTickets />
                </div>
            )}

            {/* --- BOTTOM CONTENT SECTIONS --- */}



            {/* --- BOTTOM CONTENT SECTIONS --- */}

            {/* 1. ORGANIZER EVENTS LIST */}
            {
                user.role === 'organizer' && (
                    <div style={{ display: 'grid', gap: '3rem' }}>
                        <div>
                            <h2 style={{ color: "var(--text-primary)", marginBottom: '1.5rem' }}>Ongoing & Upcoming Events</h2>
                            {ongoingEvents.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No active events.</p> : (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {ongoingEvents.map(ev => (
                                        <div key={ev.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #10b981' }}>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: '1.25rem' }}>{ev.title}</h3>
                                                <p style={{ color: 'var(--text-secondary)' }}>
                                                    {new Date(ev.date).toLocaleDateString()} • {ev.location}
                                                </p>
                                            </div>
                                            {isOwnProfile && (
                                                <button onClick={() => handleDeleteEvent(ev.id, ev.title)} className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <h2 style={{ color: "var(--text-primary)", marginBottom: '1.5rem', opacity: 0.8 }}>Past Event History</h2>
                            {/* Similar logic for past events... */}
                        </div>
                    </div>
                )
            }

            {/* 2. ATHLETE HISTORY */}
            {
                user.role === 'athlete' && (
                    <div style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: "var(--text-primary)", marginBottom: '1.5rem' }}>Event Participation History</h2>
                        {participatedEvents.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No event history.</p> : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {participatedEvents.map(ev => (
                                    <div key={ev.id} className="card glass-panel">
                                        <h4 style={{ marginBottom: '0.5rem' }}>{ev.title}</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{new Date(ev.date).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }

            {/* 3. REPORTER ARTICLES */}
            {
                user.role === 'reporter' && (
                    <div style={{ marginBottom: '3rem' }}>
                        <h2 style={{ color: "var(--text-primary)", marginBottom: '1.5rem' }}>Published Reports</h2>
                        {userReports.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No reports published.</p> : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {userReports.map(r => (
                                    <div key={r.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '1.25rem' }}>{r.title}</h3>
                                        {isOwnProfile && (
                                            <button onClick={() => handleDeleteReport(r.id, r.title)} className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}
