/**
 * A tiny mutable store shared between GSAP (writers) and the WebGL render loop (reader).
 * Values live outside React state so per-frame animation never triggers re-renders.
 */
export type CameraStop = { key: CamKey; t: number }

export type CamKey =
  | 'invite'
  | 'corridorA'
  | 'corridorB'
  | 'corridorC'
  | 'canopy'
  | 'ringsA'
  | 'ringsB'
  | 'venue'
  | 'finale'

export const journey = {
  /** 0 → 1 camera travel from the gate through the doorway */
  enter: 0,
  /** 0 → 1 door swing */
  doors: 0,
  /** 0 → 1 the light pouring through the opening doors */
  light: 0,
  /** performance.now() of the petal burst (0 = none yet) */
  burstAt: 0,
  /** 0 → 1 page scroll progress once inside */
  scroll: 0,
  /** where along the scroll each camera pose sits */
  stops: [] as CameraStop[],
  /** -1 → 1 pointer position for parallax */
  pointer: { x: 0, y: 0 },
  /** 0 (golden hour) → 1 (lamp-lit twilight), derived from the camera's place in the story */
  dusk: 0,
  entered: false,
  reducedMotion: false,
}

type Listener = () => void
const listeners = new Set<Listener>()

export function onJourneyChange(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function notifyJourney() {
  listeners.forEach((fn) => fn())
}
