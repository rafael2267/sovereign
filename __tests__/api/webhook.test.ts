/**
 * @jest-environment node
 */
import { POST } from '@/app/api/paypal/webhook/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/paypal/webhooks', () => ({
  verifyWebhookSignature: jest.fn(),
}))
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: jest.fn(() => ({
    rpc: jest.fn(),
  })),
}))

import { verifyWebhookSignature } from '@/lib/paypal/webhooks'
import { createServiceRoleClient } from '@/lib/supabase/server'

const captureEvent = (customId: string, amount = '47.00') => ({
  event_type: 'PAYMENT.CAPTURE.COMPLETED',
  resource: {
    id: 'CAPTURE-123',
    custom_id: customId,
    amount: { value: amount },
  },
})

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/paypal/webhook', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/paypal/webhook', () => {
  beforeEach(() => jest.clearAllMocks())

  it('rejects requests with invalid signature', async () => {
    ;(verifyWebhookSignature as jest.Mock).mockResolvedValue(false)
    const res = await POST(makeRequest(captureEvent('elonmusk|instagram')))
    expect(res.status).toBe(400)
  })

  it('crowns new king on valid PAYMENT.CAPTURE.COMPLETED', async () => {
    ;(verifyWebhookSignature as jest.Mock).mockResolvedValue(true)
    const mockRpc = jest.fn().mockResolvedValue({ data: 'uuid-new-king', error: null })
    ;(createServiceRoleClient as jest.Mock).mockReturnValue({ rpc: mockRpc })

    const res = await POST(makeRequest(captureEvent('elonmusk|instagram')))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('crown_new_king', {
      p_handle: 'elonmusk',
      p_network: 'instagram',
      p_price_paid: 4700,
      p_paypal_order_id: 'CAPTURE-123',
    })
  })

  it('ignores non-capture events', async () => {
    ;(verifyWebhookSignature as jest.Mock).mockResolvedValue(true)
    const res = await POST(makeRequest({ event_type: 'PAYMENT.SALE.COMPLETED' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.received).toBe(true)
  })

  it('returns 400 on malformed custom_id', async () => {
    ;(verifyWebhookSignature as jest.Mock).mockResolvedValue(true)
    const res = await POST(makeRequest(captureEvent('no-pipe-here')))
    expect(res.status).toBe(400)
  })
})
