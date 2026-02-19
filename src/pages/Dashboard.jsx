import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import OrganizerDashboard from '../components/dashboards/OrganizerDashboard';
import AthleteDashboard from '../components/dashboards/AthleteDashboard';
import ReporterDashboard from '../components/dashboards/ReporterDashboard';
import ViewerDashboard from '../components/dashboards/ViewerDashboard';

// -----------------------------------------------------------------------------
// PAGE: DASHBOARD (Main Hub)
// -----------------------------------------------------------------------------
// This is a "Switcher" component.
// It doesn't have much logic of its own. It simply checks the user's role
// and renders the correct Dashboard for that specific type of user.

export default function Dashboard() {
    const { user } = useAuth();

    // SECURITY CHECK
    // If no user is logged in, kick them back to the Home page.
    if (!user) {
        return <Navigate to="/" />;
    }

    // ROLE SWITCHING
    // Render the specific dashboard component based on the user's role string.
    return (
        <div style={{ paddingBottom: '2rem' }}>
            {user.role === 'organizer' && <OrganizerDashboard />}
            {user.role === 'athlete' && <AthleteDashboard />}
            {user.role === 'reporter' && <ReporterDashboard />}
            {user.role === 'viewer' && <ViewerDashboard />}
        </div>
    );
}
