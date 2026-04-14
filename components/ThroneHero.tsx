'use client'
import { useEffect, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@/lib/supabase/client'
import { NetworkIcon } from './NetworkIcon'
import { NETWORKS_MAP } from '@/lib/networks'
import { formatReignDuration } from '@/lib/utils/time'
import type { NetworkId } from '@/lib/networks'

type King = {
  id: string
  handle: string
  network: string
  reigned_at: string
}

type Props = {
  initialKing: King | null
  initialPrice: number
  onClaim: () => void
}

export function ThroneHero({ initialKing, initialPrice, onClaim }: Props) {
  const t = useTranslations('hero')
  const [king, setKing] = useState<King | null>(initialKing)
  const [price, setPrice] = useState(initialPrice)
  const [duration, setDuration] = useState('')
  const supabase = createBrowserClient()

  const refreshKing = useCallback(async () => {
    const res = await fetch('/api/king')
    if (!res.ok) return
    const data = await res.json()
    setKing(data.current_king)
    setPrice(data.current_price)
  }, [])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('state-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'state', filter: 'id=eq.1' },
        refreshKing
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, refreshKing])

  // Polling fallback (every 30s) in case WebSocket drops
  useEffect(() => {
    const interval = setInterval(refreshKing, 30_000)
    return () => clearInterval(interval)
  }, [refreshKing])

  // Live duration counter
  useEffect(() => {
    if (!king) return
    const tick = () => setDuration(formatReignDuration(king.reigned_at))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [king])

  const network = king ? NETWORKS_MAP[king.network as NetworkId] : null
  const profileUrl = king && network ? network.buildUrl(king.handle) : null

  return (
    <section className="flex flex-col items-center text-center py-16 px-6 border-b border-bg-card">
      {/* Title */}
      <div className="inline-block border-t-2 border-b-2 border-gold px-4 py-1 mb-5">
        <span className="text-gold text-[10px] font-bold uppercase tracking-[6px]">Sovereign</span>
      </div>

      {king ? (
        <>
          <p className="text-gold-dark text-[9px] uppercase tracking-[3px] mb-1">{t('currentlyReigning')}</p>
          <h1 className="text-gold font-serif text-5xl sm:text-6xl font-black leading-tight mb-3">
            @{king.handle}
          </h1>

          {/* Network badge */}
          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Visit @${king.handle} on ${network?.label}`}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-bg-card border border-bg-elevated hover:border-text-muted transition-colors mb-4"
            >
              <NetworkIcon networkId={king.network} size={20} />
            </a>
          )}

          <p className="text-text-muted font-mono text-xs mb-8">{duration}</p>
        </>
      ) : (
        <>
          <p className="text-gold-dark text-sm mb-6">{t('noKing')}</p>
        </>
      )}

      {/* CTA */}
      <button
        onClick={onClaim}
        className="bg-gold text-bg-base font-black text-sm uppercase tracking-[3px] px-10 py-3.5 hover:bg-yellow-300 transition-colors"
      >
        {t('claim', { price: `$${(price / 100).toFixed(0)}` })}
      </button>
      <p className="text-text-dim text-[10px] mt-3 tracking-wide">{t('priceNote')}</p>
    </section>
  )
}
