export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabasePublishableKey:
        process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_KEY ?? ''
    }
  },
  compatibilityDate: '2026-10-29',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  app: {
    head: {
      title: 'Jolt Journal',
      meta: [
        {
          name: 'description',
          content: 'A personal log for energy drink flavors, ratings, and repeat buys.'
        },
        { name: 'theme-color', content: '#07080a' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Jolt Journal' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', href: '/jolt-icon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/icons/jolt-180.png' }
      ]
    }
  },
  tailwindcss: {
    cssPath: './assets/css/tailwind.css',
    viewer: false
  },
  postcss: {
    plugins: {
      'tailwindcss/nesting': false
    }
  },
  typescript: {
    strict: true,
    typeCheck: true
  }
})
