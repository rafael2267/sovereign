import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object
  const handle = session.metadata?.handle
  const network = session.metadata?.network
  const amountTotal = session.amount_total
  const paymentIntent = session.payment_intent as string

  if (!handle || !network || !amountTotal || !paymentIntent) {
    return NextResponse.json({ error: 'Missing session data' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('crown_new_king', {
    p_handle: handle,
    p_network: network,
    p_price_paid: amountTotal,
    p_paypal_order_id: paymentIntent,   // reutiliza coluna como idempotency key
  })

  if (error) {
    console.error('crown_new_king RPC error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, king_id: data })
}
