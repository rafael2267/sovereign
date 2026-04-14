/**
 * @jest-environment node
 */
import { POST } from '@/app/api/checkout/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase/queries', () => ({
  getCurrentKing: jest.fn().mockResolvedValue({ current_price: 4700 }),
}))
jest.mock('@/lib/paypal/orders', () => ({
  createPayPalOrder: jest.fn().mockResolvedValue({
    approvalUrl: 'https://paypal.com/approve/123',
    orderId: 'ORDER-123',
  }),
}))

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/checkout', () => {
  it('returns PayPal approval URL for valid input', async () => {
    const req = makeRequest({ handle: 'elonmusk', network: 'instagram' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.url).toBe('https://paypal.com/approve/123')
  })

  it('rejects invalid handle (special chars)', async () => {
    const req = makeRequest({ handle: 'elon!musk', network: 'instagram' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects handle longer than 50 chars', async () => {
    const req = makeRequest({ handle: 'a'.repeat(51), network: 'instagram' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('rejects unknown network', async () => {
    const req = makeRequest({ handle: 'elonmusk', network: 'myspace' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
