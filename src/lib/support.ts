/** Feature detection helpers, plus debug switches handy while testing (?nowebgl, ?og). */
export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(window.location.search).has('nowebgl')) return false
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return false
    // free the probe context immediately on browsers that support it
    ;(gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export function isOgCapture() {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('og')
}

export type Tier = 'high' | 'low'

/** A conservative, one-time guess at device capability. */
export function detectTier(): Tier {
  if (typeof window === 'undefined') return 'low'
  const nav = navigator as Navigator & { deviceMemory?: number }
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const small = Math.max(window.innerWidth, window.innerHeight) < 1100
  const weakCpu = (nav.hardwareConcurrency ?? 8) <= 4
  const weakMemory = (nav.deviceMemory ?? 8) <= 4
  const params = new URLSearchParams(window.location.search)
  if (params.get('tier') === 'high') return 'high'
  if (params.get('tier') === 'low') return 'low'
  return (coarse && small) || weakCpu || weakMemory ? 'low' : 'high'
}

export function siteUrl() {
  const configured = typeof __SITE_URL__ === 'string' ? __SITE_URL__ : ''
  if (configured) return `${configured}/`
  return `${window.location.origin}${window.location.pathname}`
}
