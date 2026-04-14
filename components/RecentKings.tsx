import { NetworkIcon } from './NetworkIcon'
import type { RecentKing } from '@/lib/supabase/types'

type Props = { kings: RecentKing[] }

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

export function RecentKings({ kings }: Props) {
  if (kings.length === 0) return null

  return (
    <div className="px-4 py-5">
      <p className="text-gold-dark text-[8px] uppercase tracking-[4px] mb-3">Recent Kings</p>
      <div className="flex flex-col gap-1.5">
        {kings.map((king, i) => (
          <div
            key={king.id}
            className={`flex items-center justify-between px-3 py-2 ${
              i === 0 ? 'bg-bg-elevated border-l-2 border-gold' : 'bg-bg-base border-l-2 border-bg-card'
            }`}
          >
            <div className="flex items-center gap-2">
              <NetworkIcon networkId={king.network} size={12} />
              <span className={`font-serif text-sm font-bold ${i === 0 ? 'text-gold' : 'text-text-muted'}`}>
                @{king.handle}
              </span>
            </div>
            <span className="text-text-dim font-mono text-[10px]">
              ${(king.price_paid / 100).toFixed(0)} · {timeAgo(king.reigned_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
