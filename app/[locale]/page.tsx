import { getCurrentKing, getStats, getRecentKings } from '@/lib/supabase/queries'
import { ThroneHeroWrapper } from '@/components/ThroneHeroWrapper'
import { StatsGrid } from '@/components/StatsGrid'
import { RecentKings } from '@/components/RecentKings'
import { LanguageToggle } from '@/components/LanguageToggle'

export const revalidate = 0   // always fresh

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams

  const [kingData, stats, recentKings] = await Promise.all([
    getCurrentKing(),
    getStats(),
    getRecentKings(),
  ])

  return (
    <main className="min-h-screen bg-bg-base max-w-lg mx-auto">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-bg-card">
        <span className="text-text-dim font-mono text-[10px] uppercase tracking-widest">sovereign</span>
        <LanguageToggle />
      </nav>

      {/* Success banner */}
      {success === 'true' && (
        <div className="bg-gold/10 border-b border-gold/20 px-4 py-3 text-center">
          <p className="text-gold text-xs tracking-wide">
            Payment received — you&apos;ll be crowned shortly.
          </p>
        </div>
      )}

      {/* Hero with realtime */}
      <ThroneHeroWrapper
        initialKing={kingData.current_king}
        initialPrice={kingData.current_price}
      />

      {/* Stats */}
      <StatsGrid stats={stats} totalKings={kingData.total_kings} />

      {/* Recent Kings */}
      <RecentKings kings={recentKings} />

      {/* Footer */}
      <footer className="py-8 text-center border-t border-bg-card">
        <p className="text-text-dim font-mono text-[9px] tracking-widest uppercase">sovereign · pay to reign</p>
      </footer>
    </main>
  )
}
