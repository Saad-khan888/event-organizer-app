import React, { useMemo, useEffect } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

// -----------------------------------------------------------------------------
// COMPONENT: IMAGE UPLOAD
// -----------------------------------------------------------------------------
// A specialized input component for selecting and previewing images.
// It handles: Multi-image support, local preview (blobs), and removal.

export default function ImageUpload({ value, onChange, placeholder = "Upload Image", allowMultiple = false }) {
    const previews = useMemo(() => {
        const items = allowMultiple
            ? (Array.isArray(value) ? value : (value ? [value] : []))
            : (value ? [value] : []);

        return items.map(item => {
            if (typeof item === 'string') return item;
            if (item instanceof File) return URL.createObjectURL(item);
            return null;
        }).filter(Boolean);
    }, [value, allowMultiple]);

    useEffect(() => {
        return () => {
            previews.forEach(url => {
                if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
            });
        };
    }, [previews]);

    // 3. EVENT HANDLERS

    // Triggered when the user picks a file from their computer
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (allowMultiple) {
            // Add new files to the existing list
            const currentFiles = Array.isArray(value) ? value : (value ? [value] : []);
            onChange([...currentFiles, ...files]);
        } else {
            // Replace with the single selected file
            onChange(files[0]);
        }
    };

    // Remove an image from the selection
    const removeImage = (index) => {
        if (allowMultiple) {
            const currentFiles = Array.isArray(value) ? value : (value ? [value] : []);
            const updated = currentFiles.filter((_, i) => i !== index);
            onChange(updated);
        } else {
            onChange(null);
        }
    };

    // 4. RENDER
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* --- UPLOAD TRIGGER BUTTON --- */}
            <label
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)',
                    border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', transition: 'all 0.2s',
                }}
            >
                {/* Hidden real file input */}
                <input
                    type="file"
                    accept="image/*"
                    multiple={allowMultiple}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <Upload size={20} />
                <span>{placeholder}</span>
            </label>

            {/* --- GRID OF SELECTED IMAGES --- */}
            {previews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: allowMultiple ? 'repeat(auto-fill, minmax(120px, 1fr))' : '1fr', gap: '1rem' }}>
                    {previews.map((preview, index) => (
                        <div key={index} style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)' }}>
                            <img src={preview} alt="Upload selection" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                            {/* Remove button (X) appearing on top of the image */}
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                style={{
                                    position: 'absolute', top: '0.5rem', right: '0.5rem',
                                    background: 'rgba(0, 0, 0, 0.7)', border: 'none',
                                    borderRadius: '50%', width: '28px', height: '28px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'white'
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* --- EMPTY STATE (If nothing is selected) --- */}
            {previews.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.9rem' }}>No images selected</p>
                </div>
            )}
        </div>
    );
}
