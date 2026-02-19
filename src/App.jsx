import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute'; // Ensures users are logged in to see pages.
import Layout from './components/Layout'; // Wraps pages with Navigation and Footer.

// PAGE IMPORTS
// These are the main screens of our application.
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails'; // New detailed view
import ReportDetails from './pages/ReportDetails'; // New detailed view

// CONTEXT PROVIDERS
// These wrap the app to give global access to Authentication, Data, and Theme.
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { TicketingProvider } from './context/TicketingContext'; // Ticketing logic

// TICKETING COMPONENTS
import MyTickets from './components/ticketing/MyTickets';
import PaymentVerificationDashboard from './components/ticketing/PaymentVerificationDashboard';
import QRScanner from './components/ticketing/QRScanner';

// -----------------------------------------------------------------------------
// APP COMPONENT (The Root)
// -----------------------------------------------------------------------------
// This is the main entry point where we define the structure and navigation rules.
function App() {
    return (
        // 1. ThemeProvider: Handles Light/Dark mode switching globally.
        <ThemeProvider>

            {/* 2. AudioProvider: Handles User Login/Signup state globally. */}
            <AuthProvider>

                {/* 3. DataProvider: Handles Events/Reports/Users lists globally. */}
                <DataProvider>
                    {/* 4. TicketingProvider: Handles Ticket/Order/Payment logic globally. */}
                    <TicketingProvider>

                        {/* 5. BrowserRouter: Enables client-side navigation (No full page reloads). */}
                        <BrowserRouter>

                            {/* 6. Layout: Includes the Navbar and Footer on every page. */}
                            <Layout>

                                {/* 7. Routes: Defines which Component to show based on the URL path. */}
                                <Routes>
                                    {/* PUBLIC ROUTES: Accessible by anyone. */}
                                    <Route path="/" element={<Home />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/signup" element={<Signup />} />
                                    <Route path="/events" element={<Events />} />
                                    <Route path="/events/:id" element={<EventDetails />} />

                                    {/* PROTECTED ROUTES: Only accessible if logged in. */}
                                    {/* The <ProtectedRoute> wrapper checks AuthContext. If no user, redirects to Login. */}

                                    <Route path="/dashboard" element={
                                        <ProtectedRoute>
                                            <Dashboard />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/feed" element={
                                        <ProtectedRoute>
                                            <Feed />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/reports/:id" element={
                                        <ProtectedRoute>
                                            <ReportDetails />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/search" element={
                                        <ProtectedRoute>
                                            <Search />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/settings" element={
                                        <ProtectedRoute>
                                            <Settings />
                                        </ProtectedRoute>
                                    } />

                                    {/* TICKETING ROUTES */}
                                    <Route path="/my-tickets" element={
                                        <ProtectedRoute>
                                            <MyTickets />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/verify-payments" element={
                                        <ProtectedRoute>
                                            <PaymentVerificationDashboard />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="/scan-tickets/:eventId" element={
                                        <ProtectedRoute>
                                            <QRScanner />
                                        </ProtectedRoute>
                                    } />

                                    {/* DYNAMIC ROUTE: The ":id" part changes based on which user we view. */}
                                    <Route path="/profile/:id" element={
                                        <ProtectedRoute>
                                            <Profile />
                                        </ProtectedRoute>
                                    } />

                                    {/* FALLBACK ROUTE: Any unknown URL leads back to Home. */}
                                    <Route path="*" element={<Navigate to="/" replace />} />

                                </Routes>
                            </Layout>
                        </BrowserRouter>
                    </TicketingProvider>
                </DataProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
