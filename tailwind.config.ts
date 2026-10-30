import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#07080a',
        panel: '#111318',
        metal: '#1b1e25',
        acid: '#e1062c',
        ember: '#ff354f',
        violet: '#ff6578',
        cream: '#f2eee6',
        steel: '#b9c0ca',
        muted: '#858b95'
      },
      fontFamily: {
        sans: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        lift: '0 24px 70px rgba(0, 0, 0, 0.55)',
        rune: '0 0 0 1px rgba(225, 6, 44, 0.25), 0 0 32px rgba(225, 6, 44, 0.12)'
      }
    }
  }
}
