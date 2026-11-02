import * as THREE from 'three'

/** World layout in metres. The camera journeys from +z (outside the gate) toward -z. */
export const GATE = {
  doorW: 3.2,
  doorH: 5.0,
  sill: 0.36,
  pillarX: 2.3,
  pillarZ: 1.08,
  pillarScale: [1.4, 1.55, 1.4] as const,
  towerTop: 6.9,
  /** door emblem point used to align the HTML seal to the 3D doors */
  sealPoint: new THREE.Vector3(0, 3.55, 0.08),
}

export const CORRIDOR = { x: 4.2, zs: [-5, -9.5, -14, -18.5, -23] }

export const MANDAPAM = {
  z: -32,
  half: 3.5,
  top: 0.9,
  beamY: 4.9,
  offsets: [-3.5, -1.17, 1.17, 3.5],
}

export const RINGS_POS = new THREE.Vector3(0, 2.72, MANDAPAM.z)

export const WALL = { x: 16, back: -58, height: 4.8 }

export const GOPURAM = { z: -60.5 }

/** Mandapam pillar positions (perimeter of a 7×7 square) */
export function mandapamPillars() {
  const out: [number, number][] = []
  const o = MANDAPAM.offsets
  for (const x of o) {
    for (const z of o) {
      const onEdge = Math.abs(x) === MANDAPAM.half || Math.abs(z) === MANDAPAM.half
      if (onEdge) out.push([x, MANDAPAM.z + z])
    }
  }
  return out
}

/** Every floor diya: the aisle of light, the gate steps and the mandapam terrace */
export function diyaPositions(): THREE.Vector3[] {
  const out: THREE.Vector3[] = []
  for (let z = -2.4; z >= -22.8; z -= 1.6) {
    out.push(new THREE.Vector3(-2.2, 0.04, z), new THREE.Vector3(2.2, 0.04, z))
  }
  for (const x of [-3.3, -2.7, -2.1, -1.5, 1.5, 2.1, 2.7, 3.3]) out.push(new THREE.Vector3(x, 0.18, 2.0))
  const r = 4.72
  const step = r / 5
  const seen = new Set<string>()
  for (let i = 0; i <= 10; i++) {
    const a = -r + i * step
    for (const [x, z] of [
      [a, r],
      [a, -r],
      [r, a],
      [-r, a],
    ]) {
      if (z === r && Math.abs(x) < 1.6) continue // keep the steps clear
      const key = `${x.toFixed(2)}:${z.toFixed(2)}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(new THREE.Vector3(x, 0.3, MANDAPAM.z + z))
    }
  }
  return out
}
