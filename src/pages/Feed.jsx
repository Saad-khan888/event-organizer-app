import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { getImageUrl } from '../lib/supabase';
import { Clock, User } from 'lucide-react';

// -----------------------------------------------------------------------------
// PAGE: FEED (News Feed)
// -----------------------------------------------------------------------------
// This page acts like a mini "Sports Blog" or "News Portal".
// It displays a list of all Published Reports created by Reporters.

export default function Feed() {
    const navigate = useNavigate();
    const { reports, users } = useData(); // Fetch global data

    // SORTING LOGIC
    // Show the newest reports at the top of the feed.
    const sortedReports = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ color: "var(--text-primary)",  textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem' }}>Sports News Feed</h1>

            {sortedReports.length === 0 ? (
                // EMPTY STATE: If no one has written any news yet.
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No reports published yet.</p>
            ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* Loop through every report and render a card for it */}
                    {sortedReports.map(report => (
                        <div
                            key={report.id}
                            className="card glass-panel"
                            style={{ padding: '2rem', cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.01)' } }}
                            // Clicking the card takes you to the full article reader
                            onClick={() => navigate(`/reports/${report.id}`)}
                        >
                            {/* Card Header: Category & Date */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: '500' }}>
                                    {report.category}
                                </span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={14} /> {new Date(report.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>

                            {/* Headline */}
                            <h2 style={{ marginBottom: '1rem', fontSize: '1.75rem', lineHeight: '1.3' }}>{report.title}</h2>

                            {/* Snippet / Content Preview */}
                            <div style={{ lineHeight: '1.8', color: 'var(--text-primary)', whiteSpace: 'pre-line', fontSize: '1.1rem' }}>
                                {report.content}
                            </div>

                            {/* ARTICLE IMAGES */}
                            {/* If the reporter uploaded photos, show them in a responsive grid */}
                            {report.images && report.images.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: report.images.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '1rem', marginTop: '1.5rem'
                                }}>
                                    {report.images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={getImageUrl('report-images', img)}
                                            alt={`Report content ${idx + 1}`}
                                            style={{
                                                width: '100%',
                                                height: report.images.length === 1 ? 'auto' : '200px',
                                                maxHeight: '500px',
                                                objectFit: 'cover',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--glass-border)'
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* AUTHOR FOOTER */}
                            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {(() => {
                                    // Match the reporter ID to a User object to show their name and photo
                                    const author = users.find(u => u.id === report.reporter);
                                    const authorName = author ? `${author.firstName} ${author.lastName}` : (report.authorName || 'Unknown Reporter');

                                    let avatarSrc = null;
                                    if (author) {
                                        if (author.avatar) avatarSrc = getImageUrl('avatars', author.avatar);
                                        else if (author.profilePicture) avatarSrc = getImageUrl('avatars', author.profilePicture);
                                    }

                                    return (
                                        <>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                {avatarSrc ? (
                                                    <img src={avatarSrc} alt="Author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : <User size={16} />}
                                            </div>
                                            <span>Reported by <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{authorName}</span></span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
