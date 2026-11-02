import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { box, kalasamProfile, lathe, merge, pillarGeometry, worldUV } from './geometry.ts'
import { CORRIDOR, GATE, GOPURAM, MANDAPAM, WALL, mandapamPillars } from './layout.ts'
import type { TempleMaterials } from './materials.ts'

type G = THREE.BufferGeometry

/** Box whose front/side faces repeat the niche texture along their width */
function tierBox(w: number, h: number, d: number, x: number, y0: number, z: number, unit = 1.6) {
  const g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < uv.count; i++) {
    if (i < 8) uv.setX(i, uv.getX(i) * Math.max(1, Math.round(d / unit)))
    else if (i >= 16) uv.setX(i, uv.getX(i) * Math.max(1, Math.round(w / unit)))
  }
  g.translate(x, y0 + h / 2, z)
  const out = g.toNonIndexed()
  out.clearGroups()
  return out
}

function cylinderAlongX(r: number, length: number, x: number, y: number, z: number) {
  const g = new THREE.CylinderGeometry(r, r, length, 18, 1)
  g.rotateZ(Math.PI / 2)
  g.translate(x, y, z)
  const out = g.toNonIndexed()
  out.clearGroups()
  return out
}

function buildArchitecture(lathSeg: number) {
  const stone: G[] = []
  const walls: G[] = []
  const tiers: G[] = []
  const dark: G[] = []
  const brass: G[] = []

  /* ---------------- The gate (gopuram entrance) ---------------- */
  const sill = GATE.sill
  const halfDoor = GATE.doorW / 2
  stone.push(box(7.6, sill, 3.0, 0, 0, 0.1)) // platform
  stone.push(box(7.6, 0.18, 0.7, 0, 0, 1.95)) // front step
  // tower body around the doorway
  stone.push(box(1.45, 6.9 - sill, 1.4, -(halfDoor + 0.725), sill, 0))
  stone.push(box(1.45, 6.9 - sill, 1.4, halfDoor + 0.725, sill, 0))
  stone.push(box(GATE.doorW, 6.9 - sill - GATE.doorH, 1.4, 0, sill + GATE.doorH, 0))
  // the dark reveal inside the door frame
  dark.push(box(0.06, GATE.doorH, 1.3, -(halfDoor + 0.03), sill, -0.05))
  dark.push(box(0.06, GATE.doorH, 1.3, halfDoor + 0.03, sill, -0.05))
  // carved door-frame mouldings
  stone.push(box(0.2, GATE.doorH + 0.2, 0.14, -(halfDoor + 0.1), sill, 0.76))
  stone.push(box(0.2, GATE.doorH + 0.2, 0.14, halfDoor + 0.1, sill, 0.76))
  stone.push(box(GATE.doorW + 0.6, 0.24, 0.18, 0, sill + GATE.doorH, 0.78))
  stone.push(box(GATE.doorW + 0.9, 0.12, 0.26, 0, sill + GATE.doorH + 0.32, 0.8))
  // projecting cornice carried on the monumental pillars
  stone.push(box(7.2, 0.22, 2.7, 0, 6.56, 0.35))
  stone.push(box(7.5, 0.12, 2.9, 0, 6.78, 0.35))
  // crown tiers
  tiers.push(tierBox(6.4, 0.86, 1.7, 0, 6.9, 0))
  stone.push(box(6.9, 0.16, 2.0, 0, 7.76, 0))
  tiers.push(tierBox(5.1, 0.76, 1.5, 0, 7.92, 0))
  stone.push(box(5.6, 0.14, 1.8, 0, 8.68, 0))
  tiers.push(tierBox(3.9, 0.62, 1.3, 0, 8.82, 0))
  stone.push(box(4.3, 0.12, 1.55, 0, 9.44, 0))
  stone.push(cylinderAlongX(0.62, 3.5, 0, 9.56, 0)) // barrel-vault shala
  for (const x of [-1.2, -0.6, 0, 0.6, 1.2]) brass.push(lathe(kalasamProfile(0.9), lathSeg, x, 10.12, 0))

  /* ---------------- Courtyard enclosure ---------------- */
  const finial = (x: number, z: number) => stone.push(lathe(kalasamProfile(0.62), 8, x, WALL.height + 0.24, z))
  const wallSeg = (x0: number, x1: number, z: number) => {
    const w = Math.abs(x1 - x0)
    const cx = (x0 + x1) / 2
    walls.push(box(w, WALL.height, 1.1, cx, 0, z))
    stone.push(box(w, 0.4, 1.36, cx, 0, z))
    stone.push(box(w, 0.12, 1.22, cx, 3.2, z))
    stone.push(box(w + 0.1, 0.24, 1.44, cx, WALL.height, z))
    // pilasters break the long wall faces into bays
    const lo = Math.min(x0, x1)
    for (let x = lo + 1.5; x < lo + w - 0.8; x += 3) {
      stone.push(box(0.46, WALL.height - 0.4, 1.36, x, 0.4, z))
      stone.push(box(0.62, 0.22, 1.46, x, WALL.height - 0.62, z))
    }
    for (let x = lo + 1.1 + 2.2; x < lo + w - 0.6; x += 2.2) finial(x, z)
  }
  const wallSegZ = (z0: number, z1: number, x: number) => {
    const d = Math.abs(z1 - z0)
    const cz = (z0 + z1) / 2
    walls.push(box(1.1, WALL.height, d, x, 0, cz))
    stone.push(box(1.36, 0.4, d, x, 0, cz))
    stone.push(box(1.22, 0.12, d, x, 3.2, cz))
    stone.push(box(1.44, 0.24, d + 0.1, x, WALL.height, cz))
    const lo = Math.min(z0, z1)
    for (let z = lo + 1.5; z < lo + d - 0.8; z += 3) {
      stone.push(box(1.36, WALL.height - 0.4, 0.46, x, 0.4, z))
      stone.push(box(1.46, 0.22, 0.62, x, WALL.height - 0.62, z))
    }
    for (let z = lo + 1.1; z < lo + d - 0.6; z += 2.2) finial(x, z)
  }
  wallSeg(-WALL.x, -3.05, 0)
  wallSeg(3.05, WALL.x, 0)
  wallSegZ(0, WALL.back, -WALL.x)
  wallSegZ(0, WALL.back, WALL.x)
  wallSeg(-WALL.x, -6.2, WALL.back)
  wallSeg(6.2, WALL.x, WALL.back)

  /* ---------------- The aisle and the corridor colonnade ---------------- */
  stone.push(box(3.0, 0.035, 24.6, 0, 0, -13.1))
  for (const sx of [-1, 1]) {
    const x = sx * CORRIDOR.x
    stone.push(box(0.64, 0.4, 21.4, x, 4.0, -14))
    stone.push(box(1.5, 0.16, 21.8, x, 4.4, -14))
    stone.push(box(0.9, 0.12, 21.6, x + sx * 0.12, 4.56, -14))
    for (let z = -3.9; z >= -24.2; z -= 2.25) stone.push(lathe(kalasamProfile(0.55), 8, x + sx * 0.42, 4.68, z))
  }

  /* ---------------- The mandapam ---------------- */
  const mz = MANDAPAM.z
  stone.push(box(10, 0.3, 10, 0, 0, mz))
  stone.push(box(9, 0.3, 9, 0, 0.3, mz))
  stone.push(box(8, 0.3, 8, 0, 0.6, mz))
  stone.push(box(2.6, 0.3, 0.6, 0, 0, mz + 5.3))
  stone.push(box(2.6, 0.3, 0.5, 0, 0.3, mz + 4.75))
  stone.push(box(2.6, 0.3, 0.5, 0, 0.6, mz + 4.25))
  const h = MANDAPAM.half
  const by = MANDAPAM.beamY
  stone.push(box(7.9, 0.4, 0.62, 0, by, mz + h))
  stone.push(box(7.9, 0.4, 0.62, 0, by, mz - h))
  stone.push(box(0.62, 0.4, 7.9, h, by, mz))
  stone.push(box(0.62, 0.4, 7.9, -h, by, mz))
  stone.push(box(9.0, 0.22, 9.0, 0, by + 0.4, mz))
  stone.push(box(9.7, 0.14, 9.7, 0, by + 0.62, mz))
  tiers.push(tierBox(7.4, 0.56, 7.4, 0, by + 0.76, mz))
  stone.push(box(7.9, 0.15, 7.9, 0, by + 1.32, mz))
  tiers.push(tierBox(5.8, 0.5, 5.8, 0, by + 1.47, mz))
  stone.push(box(6.2, 0.14, 6.2, 0, by + 1.97, mz))
  stone.push(box(3.4, 0.5, 3.4, 0, by + 2.11, mz))
  // the square sikhara dome
  const domeBase = by + 2.61
  const dome = new THREE.LatheGeometry(
    [
      [0.001, domeBase],
      [2.35, domeBase],
      [2.45, domeBase + 0.22],
      [2.25, domeBase + 0.8],
      [1.65, domeBase + 1.32],
      [0.85, domeBase + 1.62],
      [0.001, domeBase + 1.72],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    4,
  )
  dome.rotateY(Math.PI / 4)
  dome.translate(0, 0, mz)
  const domeFlat = dome.toNonIndexed()
  domeFlat.computeVertexNormals()
  stone.push(domeFlat)
  brass.push(lathe(kalasamProfile(1.7), lathSeg, 0, domeBase + 1.66, mz))

  /* ---------------- The distant rajagopuram ---------------- */
  const gz = GOPURAM.z
  walls.push(box(12.4, 6, 6, 0, 0, gz))
  stone.push(box(13, 0.5, 6.6, 0, 0, gz))
  dark.push(box(2.6, 4.4, 0.1, 0, 0.5, gz + 3.02))
  let y = 6
  for (let i = 0; i < 7; i++) {
    const w = 11.4 - i * 1.08
    const d = 5.6 - i * 0.48
    stone.push(box(w + 0.5, 0.26, d + 0.5, 0, y, gz))
    tiers.push(tierBox(w, 1.86, d, 0, y + 0.26, gz, 1.5))
    y += 2.12
  }
  stone.push(box(4.3, 0.24, 2.4, 0, y, gz))
  stone.push(cylinderAlongX(1.05, 4.2, 0, y + 0.3, gz))
  for (let i = -4; i <= 4; i++) brass.push(lathe(kalasamProfile(1.5), Math.max(8, lathSeg / 2), i * 0.46, y + 1.2, gz))

  return {
    stone: worldUV(merge(stone), 0.55),
    walls: worldUV(merge(walls), 1 / 6),
    tiers: merge(tiers),
    dark: merge(dark),
    brass: merge(brass),
  }
}

/** The pillar instances: monumental gate pair, corridor colonnade, mandapam ring */
function pillarMatrices() {
  const list: THREE.Matrix4[] = []
  const m = (x: number, y: number, z: number, s: readonly [number, number, number]) =>
    new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(...s))
  list.push(m(-GATE.pillarX, GATE.sill, GATE.pillarZ, GATE.pillarScale))
  list.push(m(GATE.pillarX, GATE.sill, GATE.pillarZ, GATE.pillarScale))
  for (const z of CORRIDOR.zs) {
    list.push(m(-CORRIDOR.x, 0, z, [1, 1, 1]))
    list.push(m(CORRIDOR.x, 0, z, [1, 1, 1]))
  }
  for (const [x, z] of mandapamPillars()) list.push(m(x, MANDAPAM.top, z, [0.92, 1, 0.92]))
  return list
}

export function Architecture({ mats, shadows, lathe }: { mats: TempleMaterials; shadows: boolean; lathe: number }) {
  const geo = useMemo(() => buildArchitecture(lathe), [lathe])
  const pillar = useMemo(() => pillarGeometry(lathe), [lathe])
  const matrices = useMemo(pillarMatrices, [])
  const pillarsRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = pillarsRef.current
    if (!mesh) return
    matrices.forEach((mat, i) => mesh.setMatrixAt(i, mat))
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [matrices])

  useLayoutEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose())
      pillar.dispose()
    },
    [geo, pillar],
  )

  return (
    <group>
      <mesh geometry={geo.stone} material={mats.stone} castShadow={shadows} receiveShadow />
      <mesh geometry={geo.walls} material={mats.walls} castShadow={shadows} receiveShadow />
      <mesh geometry={geo.tiers} material={mats.tiers} castShadow={shadows} receiveShadow />
      <mesh geometry={geo.dark} material={mats.shadowStone} />
      <mesh geometry={geo.brass} material={mats.brass} />
      <instancedMesh
        ref={pillarsRef}
        args={[pillar, mats.stone, matrices.length]}
        castShadow={shadows}
        receiveShadow
        frustumCulled={false}
      />
      {/* the carved lotus ceiling under the mandapam canopy */}
      <mesh position={[0, MANDAPAM.beamY - 0.005, MANDAPAM.z]} rotation={[Math.PI / 2, 0, 0]} material={mats.ceiling}>
        <planeGeometry args={[7.4, 7.4]} />
      </mesh>
      {/* kolam laid before the mandapam steps */}
      <mesh position={[0, 0.045, -24.6]} rotation={[-Math.PI / 2, 0, 0]} material={mats.kolam} renderOrder={1}>
        <planeGeometry args={[3.7, 3.7]} />
      </mesh>
      {/* courtyard paving */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]} material={mats.ground} receiveShadow>
        <planeGeometry args={[300, 300]} />
      </mesh>
    </group>
  )
}
