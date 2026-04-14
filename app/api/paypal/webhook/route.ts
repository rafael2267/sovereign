import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/paypal/webhooks'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  const isValid = await verifyWebhookSignature(req.headers, rawBody)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)

  if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return NextResponse.json({ received: true })
  }

  const capture = event.resource
  const customId: string = capture.custom_id ?? ''
  const parts = customId.split('|')

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return NextResponse.json({ error: 'Invalid custom_id format' }, { status: 400 })
  }

  const [handle, network] = parts
  const pricePaid = Math.round(parseFloat(capture.amount.value) * 100)
  const paypalOrderId: string = capture.id

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('crown_new_king', {
    p_handle: handle,
    p_network: network,
    p_price_paid: pricePaid,
    p_paypal_order_id: paypalOrderId,
  })

  if (error) {
    console.error('crown_new_king RPC error:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, king_id: data })
}
