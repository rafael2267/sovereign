import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#ffd700',
        'gold-dark': '#b8860b',
        'bg-base': '#0a0a0a',
        'bg-elevated': '#111111',
        'bg-card': '#1a1a1a',
        'border-subtle': '#1a1a1a',
        'text-muted': '#444444',
        'text-dim': '#333333',
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
}

export default config
