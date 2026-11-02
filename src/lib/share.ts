import { eventDetails, shareText } from '../data/eventDetails.ts'
import { siteUrl } from './support.ts'

export type ShareOutcome = 'shared' | 'cancelled' | 'unsupported'

/** Uses the native share sheet when the browser offers one. */
export async function nativeShare(): Promise<ShareOutcome> {
  const data = { title: eventDetails.meta.title, text: shareText(), url: siteUrl() }
  if (typeof navigator.share !== 'function' || (navigator.canShare && !navigator.canShare(data))) {
    return 'unsupported'
  }
  try {
    await navigator.share(data)
    return 'shared'
  } catch (err) {
    // AbortError = guest closed the sheet; anything else we treat as unsupported
    return err instanceof DOMException && err.name === 'AbortError' ? 'cancelled' : 'unsupported'
  }
}

export function whatsappUrl() {
  return `https://wa.me/?text=${encodeURIComponent(`${shareText()}\n${siteUrl()}`)}`
}

export async function copyLink(): Promise<boolean> {
  const url = siteUrl()
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement('textarea')
    area.value = url
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}
