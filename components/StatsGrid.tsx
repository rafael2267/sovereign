import { NetworkIcon } from './NetworkIcon'
import type { Stats } from '@/lib/supabase/types'

type Props = { stats: Stats; totalKings: number }

function StatCard({
  icon,
  label,
  handle,
  network,
  sub,
}: {
  icon: string
  label: string
  handle?: string | null
  network?: string | null
  sub?: string | null
}) {
  return (
    <div className="bg-bg-base p-4 text-center flex flex-col items-center gap-1">
      <div className="text-gold-dark text-[8px] uppercase tracking-[3px] mb-1">
        {icon} {label}
      </div>
      {handle ? (
        <>
          <div className="flex items-center gap-1.5">
            {network && <NetworkIcon networkId={network} size={12} />}
            <span className="text-gold text-sm font-black font-serif">@{handle}</span>
          </div>
          {sub && <span className="text-text-dim font-mono text-[10px]">{sub}</span>}
        </>
      ) : (
        <span className="text-text-dim text-xs">No data yet</span>
      )}
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

export function StatsGrid({ stats, totalKings }: Props) {
  const { longest_reign, biggest_spender, fastest_dethroned, most_attempts } = stats

  return (
    <div className="grid grid-cols-2 gap-px bg-bg-card">
      <StatCard
        icon="👑"
        label="Longest Reign"
        handle={longest_reign?.handle}
        network={longest_reign?.network}
        sub={longest_reign?.duration_seconds != null ? formatDuration(longest_reign.duration_seconds) : null}
      />
      <StatCard
        icon="💸"
        label="Biggest Spender"
        handle={biggest_spender?.handle}
        network={biggest_spender?.network}
        sub={biggest_spender?.total_cents != null ? `$${(biggest_spender.total_cents / 100).toFixed(0)} total` : null}
      />
      <StatCard
        icon="⚡"
        label="Fastest Dethroned"
        handle={fastest_dethroned?.handle}
        network={fastest_dethroned?.network}
        sub={fastest_dethroned?.duration_seconds != null ? formatDuration(fastest_dethroned.duration_seconds) : null}
      />
      <StatCard
        icon="🔁"
        label="Most Attempts"
        handle={most_attempts?.handle}
        network={most_attempts?.network}
        sub={most_attempts?.count != null ? `${most_attempts.count} purchases` : null}
      />
      <div className="col-span-2 bg-bg-base p-4 text-center">
        <div className="text-gold-dark text-[8px] uppercase tracking-[3px] mb-1">🏰 Total Kings</div>
        <div className="text-gold text-3xl font-black font-serif">{totalKings}</div>
        <div className="text-text-dim font-mono text-[10px]">unique rulers</div>
      </div>
    </div>
  )
}
