import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// -----------------------------------------------------------------------------
// COMPONENT: PROTECTED ROUTE
// -----------------------------------------------------------------------------
// This is a "Safety Gate" for the application.
// Any page wrapped in this component can ONLY be seen by logged-in users.

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth(); // Check if there is a valid user session

    // If still loading auth state, show a loading spinner instead of redirecting
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50vh' 
            }}>
                <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: '3px solid rgba(59, 130, 246, 0.3)', 
                    borderRadius: '50%', 
                    borderTopColor: 'var(--primary)', 
                    animation: 'spin 1s linear infinite' 
                }}></div>
            </div>
        );
    }

    // If NO user is found (after loading completes), redirect them to the Login page.
    // The 'replace' flag ensures they can't click "Back" into the protected page.
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If a user IS found, allow the page (children) to render normally.
    return children;
};

export default ProtectedRoute;
