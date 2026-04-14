import { NextResponse } from 'next/server'
import { getCurrentKing } from '@/lib/supabase/queries'

export async function GET() {
  try {
    const data = await getCurrentKing()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch king' }, { status: 500 })
  }
}
