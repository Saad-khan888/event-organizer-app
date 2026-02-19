// =====================================================
// EDGE FUNCTION: Verify Payment & Issue Tickets
// File: supabase/functions/verify-payment/index.ts
// =====================================================
// This function allows organizers to approve/reject payments
// and automatically generates tickets with QR codes upon approval

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for admin operations
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Get user
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        // Get request body
        const { orderId, action, rejectionReason } = await req.json()
        // action: 'approve' or 'reject'

        if (!['approve', 'reject'].includes(action)) {
            throw new Error('Invalid action')
        }

        // Get order details
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select(`
        *,
        event:events(id, organizer, organizerId),
        ticket_type:ticket_types(*)
      `)
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            throw new Error('Order not found')
        }

        // Verify user is the event organizer
        const isOrganizer =
            order.event.organizer === user.id ||
            order.event.organizerId === user.id

        if (!isOrganizer) {
            throw new Error('Unauthorized: Only event organizer can verify payments')
        }

        // Check order status
        if (order.status !== 'pending_verification') {
            throw new Error('Order is not pending verification')
        }

        if (action === 'reject') {
            // Reject the order
            const { error: rejectError } = await supabaseClient
                .from('orders')
                .update({
                    status: 'rejected',
                    verified_by: user.id,
                    verified_at: new Date().toISOString(),
                    rejection_reason: rejectionReason || 'Payment verification failed',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', orderId)

            if (rejectError) throw rejectError

            // Restore ticket availability
            await supabaseClient.rpc('restore_ticket_availability', {
                p_ticket_type_id: order.ticket_type_id,
                p_quantity: order.quantity
            })

            return new Response(
                JSON.stringify({ success: true, message: 'Payment rejected' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // APPROVE PAYMENT
        // Generate ticket code
        const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

        // Generate QR code data (signed payload)
        const qrCodeData = generateQRCodeData(orderId, order.event_id, order.user_id)

        // Update order status to confirmed
        const { error: confirmError } = await supabaseClient
            .from('orders')
            .update({
                status: 'confirmed',
                verified_by: user.id,
                verified_at: new Date().toISOString(),
                ticket_code: ticketCode,
                qr_code_data: qrCodeData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)

        if (confirmError) throw confirmError

        // Generate individual tickets
        const ticketsToCreate = []
        for (let i = 1; i <= order.quantity; i++) {
            const ticketNumber = `${ticketCode}-${i}`
            const ticketQR = generateQRCodeData(orderId, order.event_id, order.user_id, i)

            ticketsToCreate.push({
                order_id: orderId,
                event_id: order.event_id,
                user_id: order.user_id,
                ticket_type_id: order.ticket_type_id,
                ticket_number: ticketNumber,
                qr_code_data: ticketQR,
                holder_name: order.payment_details?.holder_name || null,
                holder_email: order.payment_details?.holder_email || null,
                holder_phone: order.payment_details?.holder_phone || null,
                status: 'active',
            })
        }

        // Insert tickets
        const { error: ticketsError } = await supabaseClient
            .from('tickets')
            .insert(ticketsToCreate)

        if (ticketsError) throw ticketsError

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Payment approved and tickets issued',
                ticketCode,
                ticketsGenerated: order.quantity
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

// Helper function to generate QR code data
function generateQRCodeData(orderId: string, eventId: string, userId: string, sequence: number = 0): string {
    const timestamp = Date.now()
    const secret = Deno.env.get('QR_SECRET') || 'default-secret-key-change-in-production'

    // Create payload
    const payload = `${orderId}|${eventId}|${userId}|${sequence}|${timestamp}`

    // Simple hash (in production, use proper HMAC-SHA256)
    const hash = btoa(payload + secret).substr(0, 16)

    // Final QR data
    return `${payload}|${hash}`
}
