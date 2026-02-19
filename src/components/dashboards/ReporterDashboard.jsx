import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import ImageUpload from '../ImageUpload';
import { getImageUrl, uploadFile } from '../../lib/supabase';
import { PenTool, FileText, Clock, Trash2 } from 'lucide-react';

// -----------------------------------------------------------------------------
// COMPONENT: REPORTER DASHBOARD
// -----------------------------------------------------------------------------
// This is the "Press Office" for Sports Reporters.
// They can: Write new articles, upload event photos, and manage their history.

export default function ReporterDashboard() {
    // 1. HOOKS & CONTEXT
    const { user } = useAuth(); // Current reporter
    const { addReport, reports, deleteReport } = useData(); // Report handling actions

    // UI Local State for the New Article Form
    const [newReport, setNewReport] = useState({ title: '', content: '', category: 'Boxing', images: [] });
    const [isPublishing, setIsPublishing] = useState(false);

    // Filter available reports to show only ones BELONGING to this reporter.
    const myReports = reports.filter(r => r.reporter === user.id);

    // 2. EVENT HANDLERS

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this report?")) {
            deleteReport(id);
        }
    };

    // Main Publishing Logic
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Safety check: ensure user is available
        if (!user?.id) {
            alert('Your session has expired or is invalid. Please refresh the page and log in again.');
            return;
        }

        if (isPublishing) return; // Prevent double submission
        setIsPublishing(true);

        try {
            // Handle Image Uploads to Supabase Storage
            const uploadedImagePaths = [];
            if (newReport.images && newReport.images.length > 0) {
                for (const img of newReport.images) {
                    if (img instanceof File) {
                        try {
                            const imagePath = await uploadFile('report-images', img, user.id);
                            uploadedImagePaths.push(imagePath);
                        } catch (uploadError) {
                            console.error('Image upload failed:', uploadError);
                            alert(`Failed to upload image: ${uploadError.message}\n\nPlease check:\n1. Storage bucket 'report-images' exists\n2. Bucket is public\n3. Storage policies are set`);
                            setIsPublishing(false);
                            return; // Stop submission if upload fails
                        }
                    } else if (typeof img === 'string') {
                        uploadedImagePaths.push(img);
                    }
                }
            }

            // Prepare report data
            const reportData = {
                title: newReport.title,
                content: newReport.content,
                category: newReport.category,
                reporter: user.id,
                images: uploadedImagePaths
            };

            await addReport(reportData); // Send to backend
            setNewReport({ title: '', content: '', category: 'Boxing', images: [] }); // Reset form
            alert('Report published successfully!');
        } catch (error) {
            console.error('Publish error:', error);
            alert(`Failed to publish report: ${error.message}`);
        } finally {
            setIsPublishing(false);
        }
    };

    // 3. RENDER
    return (
        <div className="dashboard-container">
            {/* --- TOP HEADER --- */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Editorial Desk</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Draft and publish your sports coverage.</p>
            </div>

            <div className="dashboard-grid">

                {/* --- LEFT COLUMN: THE WRITING FORM --- */}
                <div className="main-column">
                    <div className="card glass-panel">
                        <div style={{ padding: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <PenTool size={20} className="text-primary" />
                            <h3 style={{ fontSize: '1.25rem' }}>Draft New Article</h3>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                            {/* Headline Input */}
                            <div className="form-group">
                                <label className="form-label">Headline</label>
                                <input required placeholder="Enter headline..." className="form-input" style={{ fontSize: '1.1rem' }} value={newReport.title} onChange={e => setNewReport({ ...newReport, title: e.target.value })} />
                            </div>

                            {/* Category Selection */}
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-select" value={newReport.category} onChange={e => setNewReport({ ...newReport, category: e.target.value })}>
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

                            {/* Long Textarea for the Article */}
                            <div className="form-group">
                                <label className="form-label">Full Content</label>
                                <textarea required style={{ minHeight: '300px' }} placeholder="Tell the story..." className="form-textarea" value={newReport.content} onChange={e => setNewReport({ ...newReport, content: e.target.value })} />
                            </div>

                            {/* Photo Attachments Component */}
                            <div className="form-group">
                                <label className="form-label">Attached Photos (Optional)</label>
                                <ImageUpload
                                    value={newReport.images}
                                    onChange={(val) => setNewReport(prev => ({ ...prev, images: val }))}
                                    placeholder="Add Photos"
                                    allowMultiple={true}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={isPublishing}>
                                {isPublishing ? (
                                    <>
                                        <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <FileText size={18} /> Publish to Feed
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: RECENT HISTORY --- */}
                <div className="side-column">
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem' }}>Your Published Work</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {myReports.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>No articles published yet.</p>
                        ) : (
                            myReports.map(report => (
                                <div key={report.id} className="card glass-panel" style={{ padding: '1rem', position: 'relative' }}>
                                    <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{report.category}</span>
                                    <h4 style={{ fontSize: '1rem', marginTop: '0.5rem' }}>{report.title}</h4>

                                    {/* Small image previews if they exist */}
                                    {report.images && report.images.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            {report.images.slice(0, 3).map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={getImageUrl('report-images', img)}
                                                    alt="Snippet"
                                                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Action Button: Delete */}
                                    <button
                                        onClick={() => handleDelete(report.id)}
                                        className="btn-icon"
                                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', color: '#ef4444' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Responsive Layout Logic */}
            <style>{`.dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; } @media (min-width: 1024px) { .dashboard-grid { grid-template-columns: 2fr 1fr; } }`}</style>
        </div>
    );
}
