export type King = {
  id: string
  handle: string
  network: string
  price_paid: number       // cents
  paypal_order_id: string
  reigned_at: string       // ISO timestamp
  dethroned_at: string | null
}

export type State = {
  id: number
  current_king_id: string | null
  current_price: number    // cents
  total_kings: number
}

export type KingWithState = {
  current_king: Pick<King, 'id' | 'handle' | 'network' | 'reigned_at'> | null
  current_price: number
  total_kings: number
}

export type StatEntry = {
  handle: string
  network: string
  duration_seconds?: number
  total_cents?: number
  count?: number
} | null

export type Stats = {
  longest_reign: StatEntry
  biggest_spender: StatEntry
  fastest_dethroned: StatEntry
  most_attempts: StatEntry
}

export type RecentKing = Pick<King, 'id' | 'handle' | 'network' | 'price_paid' | 'reigned_at'>
