import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { calendarFilePlugin, pageMetaPlugin, resolveSiteUrl, venueQrCheckPlugin } from './build/vite-plugins.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = resolveSiteUrl(env)

  return {
    plugins: [react(), tailwindcss(), calendarFilePlugin(), pageMetaPlugin(siteUrl), venueQrCheckPlugin(process.cwd())],
    define: {
      __SITE_URL__: JSON.stringify(siteUrl),
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1400,
      assetsInlineLimit: 2048,
    },
    server: { host: true },
    preview: { host: true },
  }
})
