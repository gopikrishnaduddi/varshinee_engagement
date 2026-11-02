import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { journey, type CamKey } from '../../lib/journey.ts'
import { GATE } from './layout.ts'

type Pose = { p: [number, number, number]; t: [number, number, number]; fov: number; dusk: number }
type Framed = { land: Pose; port: Pose }

/** Hand-composed camera poses: one for landscape screens, one for phones held upright */
export const POSES: Record<CamKey | 'gate' | 'still', Framed> = {
  gate: {
    land: { p: [0, 2.7, 15.6], t: [0, 4.55, 0], fov: 43, dusk: 0 },
    port: { p: [0, 2.3, 16.4], t: [0, 4.55, 0], fov: 60, dusk: 0 },
  },
  invite: {
    land: { p: [0, 1.95, -3.2], t: [0, 2.35, -30], fov: 50, dusk: 0.08 },
    port: { p: [0, 1.8, -2.6], t: [0, 2.45, -30], fov: 64, dusk: 0.08 },
  },
  corridorA: {
    land: { p: [0, 1.65, -6.5], t: [0, 2.25, -32], fov: 48, dusk: 0.16 },
    port: { p: [0, 1.6, -6], t: [0, 2.4, -32], fov: 64, dusk: 0.16 },
  },
  corridorB: {
    land: { p: [-1.5, 2.35, -13.5], t: [0.7, 2.7, -32], fov: 46, dusk: 0.26 },
    port: { p: [-1.1, 2.2, -13], t: [0.4, 2.8, -32], fov: 62, dusk: 0.26 },
  },
  corridorC: {
    land: { p: [1.15, 1.8, -20.5], t: [0, 2.6, -32], fov: 46, dusk: 0.36 },
    port: { p: [0.8, 1.75, -19.8], t: [0, 2.7, -32], fov: 62, dusk: 0.36 },
  },
  canopy: {
    land: { p: [2.6, 1.35, -25.4], t: [-0.6, 4.55, -31.2], fov: 54, dusk: 0.46 },
    port: { p: [2.1, 1.3, -25.2], t: [-0.4, 4.6, -31.2], fov: 66, dusk: 0.46 },
  },
  ringsA: {
    land: { p: [0, 2.95, -27.4], t: [0, 2.72, -32], fov: 38, dusk: 0.58 },
    port: { p: [0, 2.95, -26.5], t: [0, 2.74, -32], fov: 46, dusk: 0.58 },
  },
  ringsB: {
    land: { p: [1.2, 3.1, -27.6], t: [0, 2.7, -32], fov: 36, dusk: 0.66 },
    port: { p: [0.8, 3.1, -26.7], t: [0, 2.72, -32], fov: 45, dusk: 0.66 },
  },
  venue: {
    land: { p: [8.2, 4.4, -22.8], t: [0, 2.6, -32], fov: 44, dusk: 0.78 },
    port: { p: [6.6, 4.2, -21.6], t: [0, 3.0, -32], fov: 62, dusk: 0.78 },
  },
  finale: {
    land: { p: [0, 8.6, -11.5], t: [0, 3.5, -36], fov: 46, dusk: 1 },
    port: { p: [0, 8.2, -13.5], t: [0, 3.9, -36], fov: 60, dusk: 1 },
  },
  /** reduced-motion: one calm, lamp-lit view of the mandapam */
  still: {
    land: { p: [0, 3.2, -16], t: [0, 2.8, -32], fov: 46, dusk: 0.62 },
    port: { p: [0, 3.0, -14], t: [0, 3.0, -32], fov: 64, dusk: 0.62 },
  },
}

const v = (a: [number, number, number]) => new THREE.Vector3(...a)
const ease = (u: number) => u * u * (3 - 2 * u)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/**
 * Moves the camera: idle breathing at the gate, the dolly through the doorway,
 * then a scroll-driven journey along hand-placed stops. Also keeps the HTML seal
 * pinned to the doors by projecting the emblem point to the screen.
 */
export function CameraRig() {
  const { camera, size } = useThree()
  const cam = camera as THREE.PerspectiveCamera
  const pos = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3())
  const fov = useRef(0)
  const started = useRef(false)
  const lastSeal = useRef('')
  const portrait = size.width / Math.max(1, size.height) < 0.9
  const frame = portrait ? 'port' : 'land'

  // the path through the doorway
  const enterCurves = useMemo(() => {
    const g = POSES.gate[frame]
    const i = POSES.invite[frame]
    return {
      p: new THREE.CatmullRomCurve3([v(g.p), new THREE.Vector3(0, 2.55, 4.2), new THREE.Vector3(0, 2.4, 0.4), new THREE.Vector3(0, 2.15, -1.6), v(i.p)], false, 'centripetal'),
      t: new THREE.CatmullRomCurve3([v(g.t), new THREE.Vector3(0, 3.2, -2), new THREE.Vector3(0, 2.7, -14), v(i.t)], false, 'centripetal'),
    }
  }, [frame])

  const tmp = useMemo(
    () => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), seal: new THREE.Vector3(), edge: new THREE.Vector3() }),
    [],
  )

  // scroll curves are rebuilt only when the stop layout changes
  const scrollCache = useRef<{ sig: string; p?: THREE.CatmullRomCurve3; t?: THREE.CatmullRomCurve3 }>({ sig: '' })

  function scrollPose(scroll: number, outP: THREE.Vector3, outT: THREE.Vector3) {
    const stops = journey.stops.length ? journey.stops : [{ key: 'invite' as CamKey, t: 0 }]
    const sig = frame + stops.map((s) => s.key + s.t.toFixed(4)).join('|')
    if (scrollCache.current.sig !== sig) {
      const ps = stops.map((s) => v(POSES[s.key][frame].p))
      const ts = stops.map((s) => v(POSES[s.key][frame].t))
      if (ps.length === 1) {
        ps.push(ps[0].clone().add(new THREE.Vector3(0, 0, -0.01)))
        ts.push(ts[0].clone())
      }
      scrollCache.current = {
        sig,
        p: new THREE.CatmullRomCurve3(ps, false, 'centripetal'),
        t: new THREE.CatmullRomCurve3(ts, false, 'centripetal'),
      }
    }
    const { p, t } = scrollCache.current
    // find the segment, then ease within it so the camera settles at each scene
    let i = 0
    while (i < stops.length - 2 && scroll > stops[i + 1].t) i++
    const a = stops[i]
    const b = stops[Math.min(i + 1, stops.length - 1)]
    const span = Math.max(1e-4, b.t - a.t)
    const raw = THREE.MathUtils.clamp((scroll - a.t) / span, 0, 1)
    const u = THREE.MathUtils.lerp(raw, ease(raw), 0.65)
    const n = Math.max(1, stops.length - 1)
    const s = THREE.MathUtils.clamp((i + u) / n, 0, 1)
    p!.getPoint(s, outP)
    t!.getPoint(s, outT)
    const pa = POSES[a.key][frame]
    const pb = POSES[b.key][frame]
    return {
      fov: THREE.MathUtils.lerp(pa.fov, pb.fov, u),
      dusk: THREE.MathUtils.lerp(pa.dusk, pb.dusk, u),
    }
  }

  useFrame((state, dt) => {
    const time = state.clock.elapsedTime
    const reduced = journey.reducedMotion
    let targetFov: number
    let dusk: number

    if (reduced && journey.entered) {
      const sp = POSES.still[frame]
      tmp.p.set(...sp.p)
      tmp.t.set(...sp.t)
      targetFov = sp.fov
      dusk = sp.dusk
    } else if (journey.enter < 1) {
      const e = easeInOutCubic(THREE.MathUtils.clamp(journey.enter, 0, 1))
      enterCurves.p.getPoint(e, tmp.p)
      enterCurves.t.getPoint(e, tmp.t)
      const g = POSES.gate[frame]
      const i = POSES.invite[frame]
      // a gentle widening of the lens as we pass through the doorway
      targetFov = THREE.MathUtils.lerp(g.fov, i.fov, e) + Math.sin(e * Math.PI) * 6
      dusk = THREE.MathUtils.lerp(g.dusk, i.dusk, e)
      if (!reduced && journey.enter === 0) {
        // the camera breathes while the guest lingers at the gate
        tmp.p.x += Math.sin(time * 0.21) * 0.18
        tmp.p.y += Math.sin(time * 0.33) * 0.06
      }
    } else {
      const r = scrollPose(journey.scroll, tmp.p, tmp.t)
      targetFov = r.fov
      dusk = r.dusk
    }

    // pointer parallax — subtle, and it never moves text
    if (!reduced) {
      const k = journey.entered ? 0.18 : 0.4
      tmp.p.x += journey.pointer.x * k
      tmp.p.y += journey.pointer.y * k * 0.45
    }

    const snap = !started.current || reduced
    const lambda = journey.enter > 0 && journey.enter < 1 ? 14 : 4.2
    const k = snap ? 1 : 1 - Math.exp(-dt * lambda)
    if (snap) {
      pos.current.copy(tmp.p)
      look.current.copy(tmp.t)
      fov.current = targetFov
      started.current = true
    } else {
      pos.current.lerp(tmp.p, k)
      look.current.lerp(tmp.t, k)
      fov.current += (targetFov - fov.current) * k
    }
    journey.dusk += (dusk - journey.dusk) * (snap ? 1 : k)

    cam.position.copy(pos.current)
    cam.lookAt(look.current)
    if (Math.abs(cam.fov - fov.current) > 0.01) {
      cam.fov = fov.current
      cam.updateProjectionMatrix()
    }

    // exposure swells with the light pouring from the doors
    state.gl.toneMappingExposure = 1.0 + journey.light * 0.55 - journey.dusk * 0.18

    // keep the HTML seal sitting exactly on the door emblem until we enter
    if (!journey.entered) {
      tmp.seal.copy(GATE.sealPoint).project(cam)
      tmp.edge.set(GATE.doorW / 2, GATE.sealPoint.y, GATE.sealPoint.z).project(cam)
      const x = ((tmp.seal.x + 1) / 2) * size.width
      const y = ((1 - tmp.seal.y) / 2) * size.height
      const doorPx = Math.abs(tmp.edge.x - tmp.seal.x) * size.width
      const key = `${x.toFixed(1)}|${y.toFixed(1)}|${doorPx.toFixed(1)}`
      if (key !== lastSeal.current) {
        lastSeal.current = key
        const root = document.documentElement.style
        root.setProperty('--seal-x', `${x}px`)
        root.setProperty('--seal-y', `${y}px`)
        root.setProperty('--door-half', `${doorPx}px`)
      }
    }
  })

  return null
}
