'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(next: string) {
    const segments = pathname.split('/')
    segments[1] = next
    router.push(segments.join('/'))
  }

  return (
    <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest">
      {['en', 'pt'].map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-1.5 py-0.5 transition-colors ${
            locale === l ? 'text-gold' : 'text-text-dim hover:text-text-muted'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
