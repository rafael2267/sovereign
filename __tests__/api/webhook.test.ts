/**
 * @jest-environment node
 */
import { POST } from '@/app/api/stripe/webhook/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/stripe/client', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}))
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    rpc: jest.fn(),
  })),
}))

import { stripe } from '@/lib/stripe/client'
import { createServiceRoleClient } from '@/lib/supabase/server'

const makeSession = (handle: string, network: string, amountTotal = 4700) => ({
  type: 'checkout.session.completed',
  data: {
    object: {
      metadata: { handle, network },
      amount_total: amountTotal,
      payment_intent: 'pi_test_123',
    },
  },
})

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'stripe-signature': 'sig_test' },
  })
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => jest.clearAllMocks())

  it('rejects requests with invalid signature', async () => {
    ;(stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid signature')
    })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('crowns new king on valid checkout.session.completed', async () => {
    const session = makeSession('elonmusk', 'instagram')
    ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(session)
    const mockRpc = jest.fn().mockResolvedValue({ data: 'uuid-new-king', error: null })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue({ rpc: mockRpc })

    const res = await POST(makeRequest(session))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('crown_new_king', {
      p_handle: 'elonmusk',
      p_network: 'instagram',
      p_price_paid: 4700,
      p_paypal_order_id: 'pi_test_123',
    })
  })

  it('ignores non-checkout events', async () => {
    ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'payment_intent.created',
      data: { object: {} },
    })
    const res = await POST(makeRequest({}))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.received).toBe(true)
  })

  it('returns 400 when metadata is missing', async () => {
    ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: {},
          amount_total: 4700,
          payment_intent: 'pi_test_123',
        },
      },
    })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })
})
