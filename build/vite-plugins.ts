import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { eventDetails } from '../src/data/eventDetails.ts'
import { buildIcs, ICS_FILENAME } from '../src/lib/ics.ts'

/**
 * Serves (dev) and emits (build) the calendar file from the same event data the UI uses,
 * so the downloadable .ics can never drift from what guests read on the page.
 */
export function calendarFilePlugin(): Plugin {
  return {
    name: 'engagement-calendar-file',
    configureServer(server) {
      server.middlewares.use(`/${ICS_FILENAME}`, (_req, res) => {
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
        res.end(buildIcs())
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(`/${ICS_FILENAME}`, (_req, res) => {
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
        res.end(buildIcs())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: ICS_FILENAME, source: buildIcs() })
    },
  }
}

/** Resolve the public site URL from explicit config or the host's build environment. */
export function resolveSiteUrl(env: Record<string, string | undefined>) {
  const raw =
    env.VITE_SITE_URL ||
    process.env.VITE_SITE_URL ||
    process.env.URL || // Netlify
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  return raw ? raw.replace(/\/+$/, '') : ''
}

/** Fills title, description and social tags from eventDetails, with absolute URLs when known. */
export function pageMetaPlugin(siteUrl: string): Plugin {
  const { meta } = eventDetails
  const abs = (p: string) => (siteUrl ? `${siteUrl}${p}` : p)
  const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  return {
    name: 'engagement-page-meta',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const out = html
          .replaceAll('__TITLE__', escapeAttr(meta.title))
          .replaceAll('__DESCRIPTION__', escapeAttr(meta.description))
          .replaceAll('__THEME__', meta.themeColor)
          .replaceAll('__OG_IMAGE__', abs('/og-image.jpg'))
        const tags = siteUrl
          ? [
              { tag: 'meta', attrs: { property: 'og:url', content: `${siteUrl}/` }, injectTo: 'head' as const },
              { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' as const },
            ]
          : []
        return { html: out, tags }
      },
    },
  }
}

/** Loudly reminds the builder if the original venue QR image has not been placed yet. */
export function venueQrCheckPlugin(root: string): Plugin {
  const file = path.join(root, 'public', eventDetails.venue.qrImage.replace(/^\//, ''))
  return {
    name: 'engagement-venue-qr-check',
    buildStart() {
      if (!fs.existsSync(file)) {
        this.warn(
          `\n\n  ⚠  Venue QR image not found at public${eventDetails.venue.qrImage}\n` +
            '     Save the ORIGINAL QR code image supplied by the family at that exact path.\n' +
            '     Until then the venue card shows the “Open in Google Maps” button only.\n',
        )
      }
    },
  }
}
