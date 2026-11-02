import { useMemo, useSyncExternalStore } from 'react'
import { detectTier, type Tier } from '../lib/support.ts'

export type Quality = {
  tier: Tier
  portrait: boolean
  dpr: [number, number]
  shadows: boolean
  petals: number
  dust: number
  beadDetail: 0 | 1
  beadSpacing: number
  lathe: number
  envResolution: number
}

const tier = typeof window !== 'undefined' ? detectTier() : 'low'

function subscribe(cb: () => void) {
  window.addEventListener('resize', cb)
  window.addEventListener('orientationchange', cb)
  return () => {
    window.removeEventListener('resize', cb)
    window.removeEventListener('orientationchange', cb)
  }
}

const isPortrait = () => window.innerWidth / Math.max(1, window.innerHeight) < 0.9

/** Quality settings for the 3D world, tuned separately for phones and desktops. */
export function useResponsive3D(): Quality {
  const portrait = useSyncExternalStore(subscribe, isPortrait, () => true)
  return useMemo<Quality>(() => {
    if (tier === 'high') {
      return {
        tier,
        portrait,
        dpr: [1, 1.75],
        shadows: true,
        petals: 150,
        dust: 520,
        beadDetail: 1,
        beadSpacing: 1,
        lathe: 28,
        envResolution: 128,
      }
    }
    return {
      tier,
      portrait,
      dpr: [1, 1.5],
      shadows: false,
      petals: 64,
      dust: 200,
      beadDetail: 1,
      beadSpacing: 1.2,
      lathe: 16,
      envResolution: 64,
    }
  }, [portrait])
}

export const qualityTier = tier
