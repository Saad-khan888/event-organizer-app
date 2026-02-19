// =====================================================
// EDGE FUNCTION: Validate Ticket QR Code
// File: supabase/functions/validate-ticket/index.ts
// =====================================================
// This function validates QR codes at event entry
// and marks tickets as used

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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Get user (organizer scanning the QR)
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        // Get request body
        const { qrCodeData, eventId } = await req.json()

        if (!qrCodeData || !eventId) {
            throw new Error('Missing required fields')
        }

        // Verify user is the event organizer
        const { data: event } = await supabaseClient
            .from('events')
            .select('id, organizer, organizerId')
            .eq('id', eventId)
            .single()

        if (!event) {
            throw new Error('Event not found')
        }

        const isOrganizer = event.organizer === user.id || event.organizerId === user.id
        if (!isOrganizer) {
            throw new Error('Unauthorized: Only event organizer can validate tickets')
        }

        // Validate QR code signature
        const isValidSignature = validateQRSignature(qrCodeData)
        if (!isValidSignature) {
            // Log failed validation
            await logValidation(supabaseClient, null, eventId, user.id, 'invalid', 'Invalid QR signature')

            return new Response(
                JSON.stringify({
                    valid: false,
                    message: 'Invalid QR code',
                    result: 'invalid'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Parse QR code data
        const parts = qrCodeData.split('|')
        const orderId = parts[0]
        const qrEventId = parts[1]
        const qrUserId = parts[2]

        // Verify event ID matches
        if (qrEventId !== eventId) {
            await logValidation(supabaseClient, null, eventId, user.id, 'invalid', 'Wrong event')

            return new Response(
                JSON.stringify({
                    valid: false,
                    message: 'This ticket is for a different event',
                    result: 'invalid'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Find the ticket
        const { data: ticket, error: ticketError } = await supabaseClient
            .from('tickets')
            .select(`
        *,
        ticket_type:ticket_types(name),
        user:users(firstName, lastName, email)
      `)
            .eq('qr_code_data', qrCodeData)
            .eq('event_id', eventId)
            .single()

        if (ticketError || !ticket) {
            await logValidation(supabaseClient, null, eventId, user.id, 'invalid', 'Ticket not found')

            return new Response(
                JSON.stringify({
                    valid: false,
                    message: 'Ticket not found',
                    result: 'invalid'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Check if already used
        if (ticket.is_used) {
            await logValidation(supabaseClient, ticket.id, eventId, user.id, 'already_used', 'Ticket already used')

            return new Response(
                JSON.stringify({
                    valid: false,
                    message: 'This ticket has already been used',
                    result: 'already_used',
                    usedAt: ticket.used_at,
                    ticket: {
                        number: ticket.ticket_number,
                        holder: ticket.holder_name,
                        type: ticket.ticket_type.name
                    }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Check if cancelled
        if (ticket.status === 'cancelled') {
            await logValidation(supabaseClient, ticket.id, eventId, user.id, 'invalid', 'Ticket cancelled')

            return new Response(
                JSON.stringify({
                    valid: false,
                    message: 'This ticket has been cancelled',
                    result: 'invalid'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // VALID TICKET - Mark as used
        const { error: updateError } = await supabaseClient
            .from('tickets')
            .update({
                is_used: true,
                used_at: new Date().toISOString(),
                validated_by: user.id,
                status: 'used'
            })
            .eq('id', ticket.id)

        if (updateError) throw updateError

        // Log successful validation
        await logValidation(supabaseClient, ticket.id, eventId, user.id, 'success', 'Ticket validated successfully')

        return new Response(
            JSON.stringify({
                valid: true,
                message: 'Ticket validated successfully! Entry granted.',
                result: 'success',
                ticket: {
                    number: ticket.ticket_number,
                    holder: ticket.holder_name || `${ticket.user.firstName} ${ticket.user.lastName}`,
                    email: ticket.holder_email || ticket.user.email,
                    type: ticket.ticket_type.name,
                    validatedAt: new Date().toISOString()
                }
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

// Helper function to validate QR signature
function validateQRSignature(qrCodeData: string): boolean {
    try {
        const parts = qrCodeData.split('|')
        if (parts.length < 5) return false

        const payload = parts.slice(0, 4).join('|')
        const providedHash = parts[4]

        const secret = Deno.env.get('QR_SECRET') || 'default-secret-key-change-in-production'
        const expectedHash = btoa(payload + secret).substr(0, 16)

        return providedHash === expectedHash
    } catch {
        return false
    }
}

// Helper function to log validation attempts
async function logValidation(
    supabase: any,
    ticketId: string | null,
    eventId: string,
    validatedBy: string,
    result: string,
    notes: string
) {
    try {
        await supabase.from('ticket_validations').insert({
            ticket_id: ticketId,
            event_id: eventId,
            validated_by: validatedBy,
            validation_result: result,
            validation_method: 'qr_scan',
            notes: notes
        })
    } catch (error) {
        console.error('Failed to log validation:', error)
    }
}
