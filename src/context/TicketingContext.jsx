import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from "../lib/supabase";
import { useAuth } from './AuthContext';

// =====================================================
// TICKETING CONTEXT
// =====================================================
// Manages all ticketing-related data and operations
// Handles: ticket types, payment methods, orders, tickets

const TicketingContext = createContext();

export const useTicketing = () => {
    const context = useContext(TicketingContext);
    if (!context) {
        throw new Error('useTicketing must be used within TicketingProvider');
    }
    return context;
};

export function TicketingProvider({ children }) {
    const { user } = useAuth();

    // State
    const [ticketTypes, setTicketTypes] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [orders, setOrders] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const getTicketPurchaseEligibility = (event) => {
        if (!user) return { allowed: false, reason: 'Please login to buy tickets.' };
        if (!event?.id) return { allowed: false, reason: 'Invalid event.' };

        // Organizers should not be able to join/buy tickets at all
        if (user.role === 'organizer') {
            return { allowed: false, reason: 'Organizers cannot purchase tickets.' };
        }

        // Prevent buying tickets for your own event (defense in depth)
        const isOwnEvent =
            String(event.organizer) === String(user.id) ||
            String(event.organizerId) === String(user.id);
        if (isOwnEvent) {
            return { allowed: false, reason: 'You cannot purchase tickets for your own event.' };
        }

        // Category/field restrictions
        const userCategory = user.category;
        const eventCategory = event.category;

        if (user.role === 'athlete' || user.role === 'reporter') {
            // Allow if user has no category set or explicitly 'All'
            if (userCategory && userCategory !== 'All') {
                if (!eventCategory || String(eventCategory) !== String(userCategory)) {
                    return { allowed: false, reason: `You can only purchase tickets for ${userCategory} events.` };
                }
            }
        }

        // viewer can buy any event category
        return { allowed: true, reason: null };
    };

    const getEventParticipationStatus = (eventId) => {
        if (!user || !eventId) return { status: 'not_joined' };
        if (user.role === 'organizer') return { status: 'not_joined' };

        const eventIdStr = String(eventId);

        const hasActiveTicket = tickets.some(t =>
            String(t.event_id) === eventIdStr &&
            t.user_id === user.id &&
            t.status === 'active'
        );
        if (hasActiveTicket) return { status: 'joined' };

        const pendingVerification = orders.some(o =>
            String(o.event_id) === eventIdStr &&
            o.user_id === user.id &&
            o.status === 'pending_verification'
        );
        if (pendingVerification) return { status: 'pending_verification' };

        const pendingPayment = orders.some(o =>
            String(o.event_id) === eventIdStr &&
            o.user_id === user.id &&
            o.status === 'pending_payment'
        );
        if (pendingPayment) return { status: 'pending_payment' };

        const paid = orders.some(o =>
            String(o.event_id) === eventIdStr &&
            o.user_id === user.id &&
            o.status === 'paid'
        );
        if (paid) return { status: 'joined' };

        return { status: 'not_joined' };
    };

    // =====================================================
    // FETCH DATA & REALTIME SUBSCRIPTIONS
    // =====================================================

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch ticket types
            const { data: ticketTypesData } = await supabase
                .from('ticket_types')
                .select('*, event:events(title, date, location)')
                .order('created_at', { ascending: false });

            // Fetch payment methods
            const { data: paymentMethodsData } = await supabase
                .from('payment_methods')
                .select('*')
                .order('display_order', { ascending: true });

            setPaymentMethods(paymentMethodsData || []);

            // Fetch orders (user's own or organizer's events)
            if (user.role === 'organizer') {
                // Organizers see orders for their events
                let organizerEventIds = [];
                try {
                    const { data, error } = await supabase
                        .from('events')
                        .select('id, organizer, organizerId');

                    if (error) throw error;

                    const organizerEvents = (data || []).filter(e =>
                        String(e.organizer) === String(user.id) ||
                        String(e.organizerId) === String(user.id)
                    );

                    organizerEventIds = organizerEvents.map(e => String(e.id));
                } catch (error) {
                    console.error('Error fetching organizer event IDs:', error);
                }
                console.log('Oragnizer Event IDs found:', organizerEventIds);

                if (organizerEventIds.length > 0) {
                    const { data: ordersData, error: ordersError } = await supabase
                        .from('orders')
                        .select(`
                            *,
                            event:events(title, date),
                            ticket_type:ticket_types(name, price),
                            user:users(firstName, lastName, email)
                        `)
                        .in('event_id', organizerEventIds)
                        .order('created_at', { ascending: false });

                    if (ordersError) console.error('Error fetching organizer orders:', ordersError);
                    console.log('Organizer Orders fetched:', ordersData?.length);
                    setOrders(ordersData || []);

                    // Process ticket types to add calculated fields.
                    // Without realtime, we also want the buyer to immediately see reduced availability.
                    // Some Supabase setups block sold_count updates via RLS inside RPC; orders still exist.
                    // We incorporate reserved quantities from orders as a fallback.
                    const reservedByType = new Map();
                    for (const o of (ordersData || [])) {
                        if (!o?.ticket_type_id) continue;
                        if (!['pending_payment', 'pending_verification', 'paid'].includes(o.status)) continue;
                        const key = String(o.ticket_type_id);
                        reservedByType.set(key, (reservedByType.get(key) || 0) + (o.quantity || 0));
                    }

                    const processedTicketTypes = (ticketTypesData || []).map(tt => {
                        const reserved = reservedByType.get(String(tt.id)) || 0;
                        const sold = Math.max((tt.sold_count || 0), reserved);
                        return {
                            ...tt,
                            sold_count: sold,
                            available_quantity: (tt.total_quantity || 0) - sold
                        };
                    });

                    setTicketTypes(processedTicketTypes);
                } else {
                    console.log('No events found for organizer, setting orders to empty.');
                    setOrders([]);

                    const processedTicketTypes = (ticketTypesData || []).map(tt => ({
                        ...tt,
                        available_quantity: (tt.total_quantity || 0) - (tt.sold_count || 0)
                    }));

                    setTicketTypes(processedTicketTypes);
                }
            } else {
                // Users see their own orders
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        event:events(title, date),
                        ticket_type:ticket_types(name, price)
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (ordersError) console.error('Error fetching user orders:', ordersError);
                console.log('User Orders fetched:', ordersData?.length);
                setOrders(ordersData || []);

                const reservedByType = new Map();
                for (const o of (ordersData || [])) {
                    if (!o?.ticket_type_id) continue;
                    if (!['pending_payment', 'pending_verification', 'paid'].includes(o.status)) continue;
                    const key = String(o.ticket_type_id);
                    reservedByType.set(key, (reservedByType.get(key) || 0) + (o.quantity || 0));
                }

                const processedTicketTypes = (ticketTypesData || []).map(tt => {
                    const reserved = reservedByType.get(String(tt.id)) || 0;
                    const sold = Math.max((tt.sold_count || 0), reserved);
                    return {
                        ...tt,
                        sold_count: sold,
                        available_quantity: (tt.total_quantity || 0) - sold
                    };
                });

                setTicketTypes(processedTicketTypes);
            }

            // Fetch tickets (user's own)
            const { data: ticketsData } = await supabase
                .from('tickets')
                .select(`
                    *,
                    event:events(title, date, location),
                    ticket_type:ticket_types(name)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            setTickets(ticketsData || []);

            // Log for debugging
            console.log('Fetch completed.');

        } catch (error) {
            console.error('Error fetching ticketing data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        let cleanup = null;

        if (user) {
            // Fetch initial data
            fetchAllData();

            // REALTIME DISABLED: Supabase Realtime has binding mismatch issues
            // Data will load on page refresh instead of real-time updates
            // To enable: Fix Supabase Realtime server configuration
            // setupRealtimeSubscriptions();
        }

        // Cleanup on unmount or when user changes
        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [user, fetchAllData]);

    // =====================================================
    // REALTIME SUBSCRIPTIONS (Removed - now handled in useEffect above)
    // =====================================================

    // =====================================================
    // TICKET TYPE OPERATIONS
    // =====================================================

    const createTicketType = async (ticketTypeData) => {
        try {
            const { data, error } = await supabase
                .from('ticket_types')
                .insert([ticketTypeData])
                .select()
                .single();

            if (error) throw error;
            await fetchAllData(); // Refresh Listing
            return { success: true, data };
        } catch (error) {
            console.error('Error creating ticket type:', error);
            return { success: false, error: error.message };
        }
    };

    const updateTicketType = async (id, updates) => {
        try {
            const { error } = await supabase
                .from('ticket_types')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            await fetchAllData(); // Refresh Listing
            return { success: true };
        } catch (error) {
            console.error('Error updating ticket type:', error);
            return { success: false, error: error.message };
        }
    };

    const deleteTicketType = async (id) => {
        try {
            const { error } = await supabase
                .from('ticket_types')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchAllData(); // Refresh Listing
            return { success: true };
        } catch (error) {
            console.error('Error deleting ticket type:', error);
            return { success: false, error: error.message };
        }
    };

    // =====================================================
    // PAYMENT METHOD OPERATIONS
    // =====================================================

    const createPaymentMethod = async (paymentMethodData) => {
        try {
            const { data, error } = await supabase
                .from('payment_methods')
                .insert([paymentMethodData])
                .select()
                .single();

            if (error) throw error;
            await fetchAllData(); // Refresh Listing
            return { success: true, data };
        } catch (error) {
            console.error('Error creating payment method:', error);
            return { success: false, error: error.message };
        }
    };

    const updatePaymentMethod = async (id, updates) => {
        try {
            const { error } = await supabase
                .from('payment_methods')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            await fetchAllData(); // Refresh Listing
            return { success: true };
        } catch (error) {
            console.error('Error updating payment method:', error);
            return { success: false, error: error.message };
        }
    };

    const deletePaymentMethod = async (id) => {
        try {
            const { error } = await supabase
                .from('payment_methods')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchAllData(); // Refresh Listing
            return { success: true };
        } catch (error) {
            console.error('Error deleting payment method:', error);
            return { success: false, error: error.message };
        }
    };

    // =====================================================
    // ORDER OPERATIONS
    // =====================================================

    const createOrder = async (orderData) => {
        try {
            if (!user) {
                return { success: false, error: 'Please login to buy tickets.' };
            }

            if (user.role === 'organizer') {
                return { success: false, error: 'Organizers cannot purchase tickets.' };
            }

            // Enforce eligibility based on authoritative event data (prevents UI bypass)
            const { data: eventRow, error: eventError } = await supabase
                .from('events')
                .select('id, category, organizer, organizerId')
                .eq('id', orderData.event_id)
                .single();

            if (eventError) throw eventError;

            const eligibility = getTicketPurchaseEligibility(eventRow);
            if (!eligibility.allowed) {
                return { success: false, error: eligibility.reason || 'You are not eligible to purchase tickets for this event.' };
            }

            // Use RPC function for atomic ticket reservation
            const { data, error } = await supabase.rpc('create_ticket_order', {
                p_event_id: orderData.event_id,
                p_ticket_type_id: orderData.ticket_type_id,
                p_user_id: user.id,
                p_quantity: orderData.quantity,
                p_payment_method_id: orderData.payment_method_id
            });

            if (error) throw error;

            // REFRESH DATA IMMEDIATELY
            await fetchAllData();

            return { success: true, orderId: data };
        } catch (error) {
            console.error('Error creating order:', error);
            return { success: false, error: error.message };
        }
    };

    const submitPaymentProof = async (orderId, paymentDetails, proofFile) => {
        try {
            // Upload payment proof to storage
            let proofUrl = null;
            if (proofFile) {
                const fileExt = proofFile.name.split('.').pop();
                const fileName = `${orderId}/${Date.now()}.${fileExt}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('payment-proofs')
                    .upload(fileName, proofFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('payment-proofs')
                    .getPublicUrl(uploadData.path);

                proofUrl = publicUrl;
            }

            // DIRECT UPDATE (No Edge Function needed)
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'pending_verification',
                    payment_details: paymentDetails,
                    payment_proof_url: proofUrl,
                    updated_at: new Date()
                })
                .eq('id', orderId);

            if (updateError) throw updateError;

            // REFRESH DATA IMMEDIATELY
            await fetchAllData();

            return { success: true };
        } catch (error) {
            console.error('Error submitting payment proof:', error);
            return { success: false, error: error.message };
        }
    };

    const verifyPayment = async (orderId, action, rejectionReason = null) => {
        try {
            // Call Database RPC (Stored Procedure)
            let error, data;

            if (action === 'approve') {
                ({ data, error } = await supabase.rpc('approve_payment', {
                    p_order_id: orderId
                }));
            } else {
                ({ data, error } = await supabase.rpc('reject_payment', {
                    p_order_id: orderId,
                    p_reason: rejectionReason || 'Payment rejected by organizer'
                }));
            }

            if (error) throw error;

            // REFRESH DATA IMMEDIATELY
            await fetchAllData();

            return { success: true, data };
        } catch (error) {
            console.error('Error verifying payment:', error);
            return { success: false, error: error.message };
        }
    };

    // =====================================================
    // TICKET VALIDATION
    // =====================================================

    const validateTicket = async (qrCodeData, eventId) => {
        try {
            // Call Database RPC (Stored Procedure)
            const { data, error } = await supabase.rpc('validate_scan_ticket', {
                p_qr_code: qrCodeData,
                p_event_id: eventId,
                p_scanned_by: user.id
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error validating ticket:', error);
            // Return validation result structure even on error if possible
            if (error.message.includes('not found')) {
                return { success: true, data: { valid: false, reason: 'not_found' } };
            }
            return { success: false, error: error.message };
        }
    };

    // =====================================================
    // HELPER FUNCTIONS
    // =====================================================

    const getEventTicketTypes = (eventId) => {
        // Treat null/undefined as true (active) to be safe
        return ticketTypes.filter(tt => tt.event_id === eventId && tt.is_active !== false);
    };

    const getEventPaymentMethods = (eventId) => {
        return paymentMethods.filter(pm => pm.event_id === eventId && pm.is_active !== false);
    };

    const getUserOrders = () => {
        return orders.filter(o => o.user_id === user?.id);
    };

    const getPendingOrders = () => {
        return orders.filter(o => o.status === 'pending_verification');
    };

    const getUserTickets = () => {
        return tickets.filter(t => t.user_id === user?.id && t.status === 'active');
    };

    const hasJoinedEvent = (eventId) => {
        if (!user || !eventId) return false;
        if (user.role === 'organizer') return false;

        const eventIdStr = String(eventId);

        // If user has any active ticket for this event, they are joined
        const hasActiveTicket = tickets.some(t =>
            String(t.event_id) === eventIdStr &&
            t.user_id === user.id &&
            t.status === 'active'
        );
        if (hasActiveTicket) return true;

        // If user has an order in progress/approved for this event, consider them joined
        // Only treat as joined AFTER organizer approval (paid) or after tickets are issued.
        const joinedOrderStatuses = new Set(['paid']);

        return orders.some(o =>
            String(o.event_id) === eventIdStr &&
            o.user_id === user.id &&
            joinedOrderStatuses.has(o.status)
        );
    };

    // =====================================================
    // CONTEXT VALUE
    // =====================================================

    const value = {
        // State
        ticketTypes,
        paymentMethods,
        orders,
        tickets,
        loading,

        // Ticket Type Operations
        createTicketType,
        updateTicketType,
        deleteTicketType,

        // Payment Method Operations
        createPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,

        // Order Operations
        createOrder,
        submitPaymentProof,
        verifyPayment,

        // Ticket Operations
        validateTicket,

        // Helpers
        getEventTicketTypes,
        getEventPaymentMethods,
        getUserOrders,
        getPendingOrders,
        getUserTickets,
        hasJoinedEvent,
        getEventParticipationStatus,
        getTicketPurchaseEligibility,
        fetchAllData
    };

    return (
        <TicketingContext.Provider value={value}>
            {children}
        </TicketingContext.Provider>
    );
}
