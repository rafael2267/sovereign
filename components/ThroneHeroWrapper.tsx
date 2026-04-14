'use client'
import { useState } from 'react'
import { ThroneHero } from './ThroneHero'
import { PaymentModal } from './PaymentModal'

type King = {
  id: string
  handle: string
  network: string
  reigned_at: string
} | null

type Props = {
  initialKing: King
  initialPrice: number
}

export function ThroneHeroWrapper({ initialKing, initialPrice }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <ThroneHero
        initialKing={initialKing}
        initialPrice={initialPrice}
        onClaim={() => setModalOpen(true)}
      />
      {modalOpen && (
        <PaymentModal
          price={initialPrice}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
