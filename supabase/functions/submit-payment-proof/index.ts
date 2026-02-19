// =====================================================
// EDGE FUNCTION: Submit Payment Proof
// File: supabase/functions/submit-payment-proof/index.ts
// =====================================================
// This function handles payment proof submission securely
// and updates order status to pending_verification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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
        const { orderId, paymentDetails, paymentProofUrl } = await req.json()

        // Validate order belongs to user
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', user.id)
            .single()

        if (orderError || !order) {
            throw new Error('Order not found or unauthorized')
        }

        // Check order status
        if (order.status !== 'pending_payment') {
            throw new Error('Order is not in pending_payment status')
        }

        // Update order with payment details
        const { error: updateError } = await supabaseClient
            .from('orders')
            .update({
                payment_details: paymentDetails,
                payment_proof_url: paymentProofUrl,
                status: 'pending_verification',
                updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)

        if (updateError) {
            throw updateError
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Payment proof submitted successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
