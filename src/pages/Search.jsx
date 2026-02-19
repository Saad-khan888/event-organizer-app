import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../lib/supabase';
import { Search as SearchIcon, Filter, Briefcase, Medal, Newspaper, User } from 'lucide-react';

// -----------------------------------------------------------------------------
// PAGE: SEARCH (User Directory)
// -----------------------------------------------------------------------------
// This page allows users to find other and discover Athletes, Organizers, or Reporters.
// It features real-time keyword search and category/role filtering.

export default function Search() {
    const navigate = useNavigate();
    const { users } = useData(); // Get all users from global state
    const { user: currentUser } = useAuth(); // Identify "YOU" in the results

    // 1. STATE (Search/Filter parameters)
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('');

    // 2. SEARCH LOGIC
    // We filter the 'users' array based on the state variables above.
    const filteredUsers = users.filter(u => {
        // A. Match Name (Company or Person)
        const name = (u.companyName || (u.firstName + ' ' + u.lastName) || '').toLowerCase();
        const matchSearch = name.includes(searchTerm.toLowerCase());

        // B. Match Role (e.g. only show Athletes)
        const matchRole = roleFilter === 'All' || u.role === roleFilter.toLowerCase();

        // C. Match Sport Category (e.g. only show Boxing)
        let matchCategory = true;
        if (categoryFilter) {
            if (u.category !== categoryFilter) matchCategory = false;
        }

        return matchSearch && matchRole && matchCategory;
    });

    // Extract a list of all unique categories available in the system for the dropdown.
    const uniqueCategories = [...new Set(users.filter(u => u.category).map(u => u.category))];

    // 3. RENDER
    return (
        <div>
            <h1 style={{ color: "var(--text-primary)",  textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>Directory Search</h1>

            {/* --- SEARCH TOOLBAR --- */}
            <div className="card glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Row 1: Search Box & Category Dropdown */}
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'row', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 300px', position: 'relative' }}>
                            <SearchIcon size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                className="form-input"
                                style={{ paddingLeft: '2.5rem', width: '100%' }}
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Dynamic Category Filter */}
                        {['All', 'Athlete', 'Reporter'].includes(roleFilter) && (
                            <select
                                className="form-select"
                                style={{ flex: '1 1 200px', width: '100%' }}
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Row 2: Role Switchers (Tabs) */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {['All', 'Organizer', 'Athlete', 'Reporter'].map(role => (
                            <button
                                key={role}
                                onClick={() => { setRoleFilter(role); setCategoryFilter(''); }}
                                className={`btn ${roleFilter === role ? 'btn-primary' : 'btn-outline'}`}
                                style={{ flex: '1 1 auto', minWidth: '80px', fontSize: '0.9rem' }}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- RESULTS GRID --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>

                {filteredUsers.map(u => (
                    <div key={u.id} className="card glass-panel" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* User Avatar Circle */}
                        <div style={{ alignSelf: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--glass-border)' }}>
                            {(() => {
                                let src = null;
                                if (u.avatar) src = getImageUrl('avatars', u.avatar);
                                else if (u.profilePicture) src = getImageUrl('avatars', u.profilePicture);

                                if (src) {
                                    return <img src={src} alt={u.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                                } else {
                                    // Default Icon based on role if no photo is uploaded
                                    return (
                                        <>
                                            {u.role === 'organizer' ? <Briefcase size={32} /> :
                                                u.role === 'athlete' ? <Medal size={32} /> :
                                                    u.role === 'reporter' ? <Newspaper size={32} /> :
                                                        <User size={32} />}
                                        </>
                                    );
                                }
                            })()}
                        </div>

                        {/* User Summary Info */}
                        <div>
                            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                {u.companyName || `${u.firstName} ${u.lastName}`}
                                {/* Identify the logged-in user in the list */}
                                {currentUser && currentUser.id === u.id && (
                                    <span style={{ fontSize: '0.6rem', background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>YOU</span>
                                )}
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>{u.role}</span>
                        </div>

                        {/* Bio/Details Snippet */}
                        <div style={{ textAlign: 'left', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {u.category && <p><strong>Category:</strong> {u.category}</p>}
                            {u.mediaOrganization && <p><strong>Media:</strong> {u.mediaOrganization}</p>}
                            <p>{u.bio ? u.bio.substring(0, 60) + '...' : 'No bio available.'}</p>
                        </div>

                        {/* View Profile Action */}
                        <button className="btn btn-search btn-outline" style={{ marginTop: 'auto', width: '100%' }} onClick={() => navigate(`/profile/${u.id}`)}>
                            View Profile
                        </button>
                    </div>
                ))}

                {/* --- NO RESULTS STATE --- */}
                {filteredUsers.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No users found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
