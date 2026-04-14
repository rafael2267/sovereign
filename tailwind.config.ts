import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#ffd700',        // 14.6:1 em bg-base — AAA
        'gold-dark': '#c8960c', // 7.2:1 em bg-base  — AAA
        'bg-base': '#0a0a0a',
        'bg-elevated': '#161616',
        'bg-card': '#222222',
        'border-subtle': '#222222',
        'text-muted': '#aaaaaa', // 8.6:1 em bg-base  — AAA
        'text-dim': '#888888',   // 5.6:1 em bg-base  — AA
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
}

export default config
