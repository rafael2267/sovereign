import { createServerClient } from './server'
import type { KingWithState, Stats, RecentKing } from './types'

export async function getCurrentKing(): Promise<KingWithState> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('state')
    .select(`
      current_price,
      total_kings,
      current_king:kings!state_current_king_id_fkey (
        id, handle, network, reigned_at
      )
    `)
    .eq('id', 1)
    .single()

  if (error) throw new Error(`Failed to fetch current king: ${error.message}`)
  return data as unknown as KingWithState
}

export async function getStats(): Promise<Stats> {
  const supabase = createServerClient()
  const { data, error } = await supabase.rpc('get_stats')
  if (error) throw new Error(`Failed to fetch stats: ${error.message}`)
  return data as Stats
}

export async function getRecentKings(): Promise<RecentKing[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('kings')
    .select('id, handle, network, price_paid, reigned_at')
    .order('reigned_at', { ascending: false })
    .limit(10)
  if (error) throw new Error(`Failed to fetch recent kings: ${error.message}`)
  return data as RecentKing[]
}
