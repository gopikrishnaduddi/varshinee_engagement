import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { journey } from '../../lib/journey.ts'
import { petalGeometry } from './geometry.ts'
import { GATE } from './layout.ts'
import { rng } from './textures.ts'

const COLORS = ['#fbf5e8', '#f6eedf', '#fffaf2', '#d7a5a0', '#c98a86', '#9e2a3a', '#e8962e', '#f2b34a']
const BOX = new THREE.Vector3(13, 9, 18)

/**
 * Jasmine, rose and marigold petals drifting through the air.
 * They live in a box that travels with the camera, and burst from the doorway when the gates open.
 */
export function FloatingPetals({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(petalGeometry, [])
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.6,
        side: THREE.DoubleSide,
        emissive: '#3b2418',
      }),
    [],
  )
  const state = useMemo(() => {
    const r = rng(2024)
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    const rot = new Float32Array(count * 3)
    const spin = new Float32Array(count * 3)
    const fall = new Float32Array(count)
    const phase = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * BOX.x
      pos[i * 3 + 1] = r() * BOX.y
      pos[i * 3 + 2] = 4 + (r() - 0.5) * BOX.z
      rot[i * 3] = r() * 6
      rot[i * 3 + 1] = r() * 6
      rot[i * 3 + 2] = r() * 6
      spin[i * 3] = (r() - 0.5) * 2.2
      spin[i * 3 + 1] = (r() - 0.5) * 2.2
      spin[i * 3 + 2] = (r() - 0.5) * 1.6
      fall[i] = 0.22 + r() * 0.3
      phase[i] = r() * Math.PI * 2
      vel[i * 3 + 1] = -fall[i]
    }
    return { pos, vel, rot, spin, fall, phase, rand: r, lastBurst: 0 }
  }, [count])

  useLayoutEffect(() => {
    const m = mesh.current!
    const r = rng(8)
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      c.set(COLORS[Math.floor(r() * COLORS.length)])
      m.setColorAt(i, c)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [count])

  useLayoutEffect(
    () => () => {
      geo.dispose()
      mat.dispose()
    },
    [geo, mat],
  )

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const fwd = useMemo(() => new THREE.Vector3(), [])
  const center = useMemo(() => new THREE.Vector3(), [])

  useFrame((frame, rawDt) => {
    const m = mesh.current
    if (!m) return
    const dt = journey.reducedMotion ? 0 : Math.min(rawDt, 1 / 20)
    const t = frame.clock.elapsedTime
    const { pos, vel, rot, spin, fall, phase, rand } = state
    const cam = frame.camera
    cam.getWorldDirection(fwd)
    center.copy(cam.position).addScaledVector(fwd, 6)

    // the doors part: release a drift of petals from the doorway toward the guest
    if (journey.burstAt && journey.burstAt !== state.lastBurst) {
      state.lastBurst = journey.burstAt
      const n = Math.floor(count * 0.7)
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (rand() - 0.5) * GATE.doorW * 0.8
        pos[i * 3 + 1] = GATE.sill + 0.6 + rand() * (GATE.doorH - 1)
        pos[i * 3 + 2] = -0.6 - rand() * 1.5
        vel[i * 3] = (rand() - 0.5) * 2.6
        vel[i * 3 + 1] = 0.3 + rand() * 1.2
        vel[i * 3 + 2] = 2.6 + rand() * 4.2
      }
    }

    for (let i = 0; i < count; i++) {
      const ix = i * 3
      // drag back toward a gentle, swaying fall
      const k = 1 - Math.exp(-dt * 0.7)
      vel[ix] += (Math.sin(t * 0.7 + phase[i]) * 0.28 - vel[ix]) * k
      vel[ix + 1] += (-fall[i] - vel[ix + 1]) * k
      vel[ix + 2] += (Math.cos(t * 0.5 + phase[i]) * 0.12 - vel[ix + 2]) * k
      pos[ix] += vel[ix] * dt
      pos[ix + 1] += vel[ix + 1] * dt
      pos[ix + 2] += vel[ix + 2] * dt
      rot[ix] += spin[ix] * dt
      rot[ix + 1] += spin[ix + 1] * dt
      rot[ix + 2] += spin[ix + 2] * dt

      // wrap within the travelling box
      if (pos[ix + 1] < 0.05) {
        pos[ix + 1] = Math.max(cam.position.y + 2.5, 3) + rand() * 3
        pos[ix] = center.x + (rand() - 0.5) * BOX.x
        pos[ix + 2] = center.z + (rand() - 0.5) * BOX.z
      }
      for (let a = 0; a < 3; a += 2) {
        const c = a === 0 ? center.x : center.z
        const half = (a === 0 ? BOX.x : BOX.z) / 2
        if (pos[ix + a] - c > half) pos[ix + a] -= half * 2
        else if (c - pos[ix + a] > half) pos[ix + a] += half * 2
      }
      if (pos[ix + 1] > cam.position.y + BOX.y) pos[ix + 1] = cam.position.y + BOX.y * 0.5

      dummy.position.set(pos[ix], pos[ix + 1], pos[ix + 2])
      dummy.rotation.set(rot[ix], rot[ix + 1], rot[ix + 2])
      dummy.scale.setScalar(0.8 + (i % 5) * 0.12)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geo, mat, count]} frustumCulled={false} />
}
