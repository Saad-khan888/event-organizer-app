import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { getImageUrl } from '../lib/supabase';
import { ArrowLeft, Clock, User, Tag } from 'lucide-react';

// -----------------------------------------------------------------------------
// PAGE: REPORT DETAILS (News Reader)
// -----------------------------------------------------------------------------
// This page acts like a full-screen news article page.
// It displays a detailed report, its main photo, and the author's information.

export default function ReportDetails() {
    // 1. HOOKS
    const { id } = useParams(); // ID of the article from the URL
    const navigate = useNavigate();
    const { reports, users } = useData();

    // Find the specific report object
    const report = reports.find(r => r.id === id);

    const author = report ? users.find(u => u.id === report.reporter) : null;

    // Error case: If user types a wrong URL
    if (!report) {
        return (
            <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1rem' }}>Report not found</h2>
                <button onClick={() => navigate('/feed')} className="btn btn-outline">Back to Feed</button>
            </div>
        );
    }

    // Format the date for reading (e.g. "Monday, January 1")
    const reportDate = new Date(report.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 3. RENDER
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Navigation back button */}
            <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: 0 }}>
                <ArrowLeft size={20} />
            </button>

            {/* --- ARTICLE CONTAINER --- */}
            <article className="card glass-panel" style={{ padding: '0', overflow: 'hidden' }}>

                {/* A. HERO IMAGE HEADER */}
                {/* If the article has photos, use the first one as a big "Hero" background */}
                {report.images && report.images.length > 0 && (
                    <div style={{ width: '100%', maxHeight: '400px', overflow: 'hidden', position: 'relative' }}>
                        <img
                            src={getImageUrl('report-images', report.images[0])}
                            alt={report.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {/* Dramatic Dark Overlay for text readability */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>

                        {/* Title Floating over image */}
                        <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem' }}>
                            <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>{report.category}</span>
                            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', lineHeight: '1.2', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{report.title}</h1>
                        </div>
                    </div>
                )}

                {/* B. CONTENT SECTION */}
                <div style={{ padding: '3rem 2rem' }}>

                    {/* fallback Title if NO image was uploaded */}
                    {(!report.images || report.images.length === 0) && (
                        <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>{report.category}</span>
                            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', lineHeight: '1.2', color: 'var(--text-primary)' }}>{report.title}</h1>
                        </div>
                    )}

                    {/* C. AUTHOR BYLINE (Who wrote this?) */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            {/* Author Photo */}
                            <div
                                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => author && navigate(`/profile/${author.id}`)}
                            >
                                {(() => {
                                    let src = null;
                                    if (author) {
                                        if (author.avatar) src = getImageUrl('avatars', author.avatar);
                                        else if (author.profilePicture) src = getImageUrl('avatars', author.profilePicture);
                                    }
                                    return src ? <img src={src} alt="Author" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} />;
                                })()}
                            </div>
                            {/* Author Name and Date Published */}
                            <div>
                                <span style={{ display: 'block', color: 'var(--text-primary)', fontWeight: '600' }}>
                                    {author ? (author.firstName + ' ' + author.lastName) : (report.authorName || 'Unknown Reporter')}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                    {author && author.mediaOrganization && <span>{author.mediaOrganization}</span>}
                                    {author && author.mediaOrganization && <span style={{ opacity: 0.6 }}>•</span>}
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={14} /> {reportDate}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* D. THE FULL TEXT BODY */}
                    <div style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                        {report.content}
                    </div>

                    {/* E. GALLERY (Additional Photos) */}
                    {/* If there are more images beyond the hero, show them here */}
                    {report.images && report.images.length > 1 && (
                        <div style={{ marginTop: '3rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>More Photos</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {report.images.slice(1).map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={getImageUrl('report-images', img)}
                                        alt={`Gallery ${idx + 1}`}
                                        style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                        // Click to open photo in a new tab
                                        onClick={() => window.open(getImageUrl('report-images', img), '_blank')}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
}
