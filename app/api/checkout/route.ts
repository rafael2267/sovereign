import { NextRequest, NextResponse } from 'next/server'
import { getCurrentKing } from '@/lib/supabase/queries'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { VALID_NETWORK_IDS } from '@/lib/networks'

const HANDLE_REGEX = /^[\w.]{1,50}$/   // word chars + dots, 1–50 chars

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { handle, network } = body

  if (!handle || !HANDLE_REGEX.test(handle)) {
    return NextResponse.json({ error: 'Invalid handle' }, { status: 400 })
  }
  if (!network || !VALID_NETWORK_IDS.includes(network)) {
    return NextResponse.json({ error: 'Invalid network' }, { status: 400 })
  }

  try {
    const state = await getCurrentKing()
    const { url } = await createCheckoutSession(handle, network, state.current_price)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
