/**
 * @jest-environment node
 */
import { GET } from '@/app/api/king/route'

jest.mock('@/lib/supabase/queries', () => ({
  getCurrentKing: jest.fn(),
}))

import { getCurrentKing } from '@/lib/supabase/queries'

describe('GET /api/king', () => {
  it('returns current king data as JSON', async () => {
    const mockData = {
      current_king: { id: 'uuid-1', handle: 'elonmusk', network: 'instagram', reigned_at: '2026-01-01T00:00:00Z' },
      current_price: 4700,
      total_kings: 46,
    }
    ;(getCurrentKing as jest.Mock).mockResolvedValue(mockData)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual(mockData)
  })

  it('returns 500 when query fails', async () => {
    ;(getCurrentKing as jest.Mock).mockRejectedValue(new Error('DB error'))

    const res = await GET()
    expect(res.status).toBe(500)
  })
})
