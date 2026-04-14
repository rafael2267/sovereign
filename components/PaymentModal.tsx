'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { NetworkSelector } from './NetworkSelector'
import type { NetworkId } from '@/lib/networks'

type Props = {
  price: number     // in cents
  onClose: () => void
}

const HANDLE_REGEX = /^[\w.]{1,50}$/

export function PaymentModal({ price, onClose }: Props) {
  const t = useTranslations('modal')
  const [handle, setHandle] = useState('')
  const [network, setNetwork] = useState<NetworkId | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const priceDisplay = `$${(price / 100).toFixed(0)}`
  const isValid = HANDLE_REGEX.test(handle) && network !== null

  async function handlePay() {
    if (!isValid) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, network }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }

      window.location.assign(data.url)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-elevated border border-bg-card rounded-xl p-6 w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-gold font-serif text-sm uppercase tracking-widest">{t('title')}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Handle input */}
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase tracking-widest text-text-muted block">{t('handleLabel')}</label>
          <div className="flex items-center bg-bg-base border border-bg-card rounded px-3">
            <span className="text-text-muted font-mono text-sm mr-1">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 50))}
              placeholder={t('handlePlaceholder')}
              className="bg-transparent text-gold font-mono text-sm py-2.5 outline-none w-full placeholder:text-text-dim"
            />
          </div>
        </div>

        {/* Network selector */}
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase tracking-widest text-text-muted block">{t('networkLabel')}</label>
          <NetworkSelector selected={network} onSelect={setNetwork} />
        </div>

        {/* Error */}
        {error && <p className="text-red-400 text-xs">{error}</p>}

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={!isValid || loading}
          className="w-full bg-gold text-bg-base font-black text-sm uppercase tracking-widest py-3 rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
        >
          {loading ? t('paying') : t('pay', { price: priceDisplay })}
        </button>

        <p className="text-text-dim text-[10px] text-center">
          {t('redirectNote')}
        </p>
      </div>
    </div>
  )
}
