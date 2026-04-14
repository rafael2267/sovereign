'use client'
import { useState } from 'react'
import { NETWORKS } from '@/lib/networks'
import { NetworkIcon } from './NetworkIcon'
import type { NetworkId } from '@/lib/networks'

type Props = {
  selected: NetworkId | null
  onSelect: (id: NetworkId) => void
}

export function NetworkSelector({ selected, onSelect }: Props) {
  const [showMore, setShowMore] = useState(false)

  const mainNetworks = NETWORKS.filter((n) => n.main)
  const moreNetworks = NETWORKS.filter((n) => !n.main)

  function NetworkButton({ network }: { network: (typeof NETWORKS)[0] }) {
    const isSelected = selected === network.id
    return (
      <button
        data-network={network.id}
        onClick={() => onSelect(network.id as NetworkId)}
        className={`
          flex flex-col items-center gap-1.5 p-2.5 rounded-md border text-center
          transition-colors cursor-pointer
          ${isSelected
            ? 'border-gold bg-bg-elevated'
            : 'border-bg-card bg-bg-elevated hover:border-bg-card/80'
          }
        `}
      >
        <NetworkIcon networkId={network.id} size={22} />
        <span className={`text-[9px] font-bold tracking-wide ${isSelected ? 'text-gold' : 'text-text-muted'}`}>
          {network.label}
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {mainNetworks.map((n) => <NetworkButton key={n.id} network={n} />)}
        <button
          onClick={() => setShowMore((v) => !v)}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-md border border-bg-card bg-bg-elevated hover:border-text-dim transition-colors"
        >
          <span className="text-text-muted text-lg leading-none">···</span>
          <span className="text-[9px] font-bold text-text-muted tracking-wide">
            {showMore ? 'Less' : 'More'}
          </span>
        </button>
      </div>

      {showMore && (
        <div className="border border-bg-card rounded-md p-2.5 space-y-2">
          <p className="text-[8px] uppercase tracking-widest text-text-dim">Other Networks</p>
          <div className="grid grid-cols-3 gap-2">
            {moreNetworks.map((n) => <NetworkButton key={n.id} network={n} />)}
          </div>
        </div>
      )}
    </div>
  )
}
