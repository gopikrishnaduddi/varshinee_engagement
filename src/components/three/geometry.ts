import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Procedural building blocks for the temple. Everything is generated from
 * profiles and primitives — there are no external model files to go missing.
 */

type G = THREE.BufferGeometry

/** Convert to non-indexed so primitives of every kind can be merged together */
function flatten(g: G, recomputeNormals = false): G {
  const out = g.index ? g.toNonIndexed() : g
  if (recomputeNormals) out.computeVertexNormals()
  // keep only the attributes every primitive shares
  for (const name of Object.keys(out.attributes)) {
    if (!['position', 'normal', 'uv'].includes(name)) out.deleteAttribute(name)
  }
  out.clearGroups()
  return out
}

export function box(w: number, h: number, d: number, x: number, y0: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d)
  g.translate(x, y0 + h / 2, z)
  return flatten(g)
}

/** Faceted prism (stone pillars are carved with flat faces) */
export function prism(r: number, h: number, y0: number, sides: number, x = 0, z = 0) {
  const g = new THREE.CylinderGeometry(r, r, h, sides, 1)
  g.rotateY(Math.PI / sides)
  g.translate(x, y0 + h / 2, z)
  return flatten(g, true)
}

export function lathe(points: [number, number][], segments: number, x = 0, y = 0, z = 0) {
  const g = new THREE.LatheGeometry(
    points.map(([r, py]) => new THREE.Vector2(Math.max(r, 0.0001), py)),
    segments,
  )
  g.translate(x, y, z)
  return flatten(g)
}

/** World-space planar UVs so texel density is consistent across merged geometry */
export function worldUV(g: G, scale: number) {
  const pos = g.attributes.position as THREE.BufferAttribute
  const nor = g.attributes.normal as THREE.BufferAttribute
  const uv = g.attributes.uv as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i))
    const ay = Math.abs(nor.getY(i))
    const az = Math.abs(nor.getZ(i))
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    if (ay >= ax && ay >= az) uv.setXY(i, x * scale, z * scale)
    else if (ax >= az) uv.setXY(i, z * scale, y * scale)
    else uv.setXY(i, x * scale, y * scale)
  }
  uv.needsUpdate = true
  return g
}

export function merge(parts: G[]) {
  const merged = mergeGeometries(parts, false)
  if (!merged) throw new Error('Could not merge temple geometry')
  merged.computeBoundingSphere()
  return merged
}

/** A curved corbel bracket (potika), extruded */
function bracket(length: number, alongZ: boolean, y0: number) {
  const half = length / 2
  const s = new THREE.Shape()
  s.moveTo(-half, 0.2)
  s.lineTo(half, 0.2)
  s.lineTo(half, 0.07)
  s.quadraticCurveTo(half - 0.04, -0.07, half - 0.2, -0.01)
  s.lineTo(half - 0.24, 0)
  s.lineTo(-half + 0.24, 0)
  s.lineTo(-half + 0.2, -0.01)
  s.quadraticCurveTo(-half + 0.04, -0.07, -half, 0.07)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.34, bevelEnabled: false, curveSegments: 6 })
  g.translate(0, y0, -0.17)
  if (alongZ) g.rotateY(Math.PI / 2)
  return flatten(g, true)
}

/**
 * A Dravidian-style pillar, 4 units tall: plinth, square sadurai blocks,
 * octagonal shafts, the kalasa pot, lotus capital (padma), abacus and corbels.
 */
export function pillarGeometry(segments: number) {
  const s = segments
  const parts: G[] = [
    box(0.76, 0.16, 0.76, 0, 0, 0),
    box(0.66, 0.08, 0.66, 0, 0.16, 0),
    box(0.58, 0.55, 0.58, 0, 0.24, 0),
    box(0.63, 0.05, 0.63, 0, 0.79, 0),
    prism(0.3, 0.34, 0.84, 8),
    box(0.6, 0.05, 0.6, 0, 1.18, 0),
    box(0.56, 0.42, 0.56, 0, 1.23, 0),
    box(0.6, 0.05, 0.6, 0, 1.65, 0),
    prism(0.27, 0.95, 1.7, 8),
    prism(0.29, 0.08, 2.65, 16),
    lathe(
      [
        [0, 2.73],
        [0.2, 2.73],
        [0.27, 2.79],
        [0.31, 2.88],
        [0.31, 2.97],
        [0.26, 3.06],
        [0.17, 3.12],
        [0.15, 3.17],
        [0.15, 3.24],
        [0.21, 3.27],
        [0.29, 3.32],
        [0.36, 3.38],
        [0.39, 3.42],
        [0, 3.42],
      ],
      s,
    ),
    box(0.84, 0.07, 0.84, 0, 3.42, 0),
    box(0.44, 0.12, 0.44, 0, 3.49, 0),
    bracket(1.38, false, 3.61),
    bracket(1.38, true, 3.61),
    box(0.62, 0.19, 0.62, 0, 3.81, 0),
  ]
  // pendant lotus buds under each bracket end
  for (const [x, z] of [
    [0.56, 0],
    [-0.56, 0],
    [0, 0.56],
    [0, -0.56],
  ]) {
    parts.push(
      lathe(
        [
          [0, 3.44],
          [0.04, 3.47],
          [0.065, 3.53],
          [0.055, 3.58],
          [0.03, 3.62],
          [0, 3.62],
        ],
        Math.max(8, Math.round(s / 2)),
        x,
        0,
        z,
      ),
    )
  }
  return worldUV(merge(parts), 0.9)
}

/** Brass finial crowning towers and canopies */
export function kalasamProfile(scale = 1): [number, number][] {
  const p: [number, number][] = [
    [0, 0],
    [0.13, 0],
    [0.17, 0.05],
    [0.19, 0.13],
    [0.16, 0.21],
    [0.08, 0.26],
    [0.1, 0.3],
    [0.06, 0.35],
    [0.075, 0.41],
    [0.035, 0.5],
    [0.012, 0.58],
    [0, 0.6],
  ]
  return p.map(([r, y]) => [r * scale, y * scale])
}

/** Kuthuvilakku — the tall brass oil lamp stand */
export function lampStandProfile(): [number, number][] {
  return [
    [0, 0],
    [0.3, 0],
    [0.32, 0.04],
    [0.27, 0.1],
    [0.13, 0.19],
    [0.07, 0.27],
    [0.055, 0.32],
    [0.09, 0.36],
    [0.055, 0.4],
    [0.045, 1.08],
    [0.085, 1.12],
    [0.05, 1.16],
    [0.05, 1.3],
    [0.23, 1.34],
    [0.27, 1.39],
    [0.25, 1.42],
    [0.06, 1.42],
    [0.05, 1.48],
    [0.075, 1.53],
    [0.03, 1.62],
    [0.05, 1.67],
    [0, 1.76],
  ]
}

export function diyaProfile(): [number, number][] {
  return [
    [0, 0],
    [0.055, 0],
    [0.095, 0.025],
    [0.11, 0.055],
    [0.1, 0.065],
    [0.07, 0.045],
    [0, 0.045],
  ]
}

export function flameGeometry() {
  return new THREE.LatheGeometry(
    [
      [0.0001, 0],
      [0.016, 0.012],
      [0.021, 0.032],
      [0.014, 0.058],
      [0.006, 0.075],
      [0.0001, 0.09],
    ].map(([r, y]) => new THREE.Vector2(r, y)),
    10,
  )
}

/** Teardrop flower petal, gently cupped */
export function petalGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(0.05, 0.02, 0.06, 0.09, 0, 0.13)
  s.bezierCurveTo(-0.06, 0.09, -0.05, 0.02, 0, 0)
  const g = new THREE.ShapeGeometry(s, 6)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    pos.setZ(i, x * x * 6) // cup
  }
  g.translate(0, -0.065, 0)
  g.computeVertexNormals()
  return g
}

/** Mango leaf for the thoranam over the doorway */
export function leafGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(0.06, -0.06, 0.05, -0.22, 0, -0.32)
  s.bezierCurveTo(-0.05, -0.22, -0.06, -0.06, 0, 0)
  const g = new THREE.ShapeGeometry(s, 5)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    pos.setZ(i, y * y * 0.6)
  }
  g.computeVertexNormals()
  return g
}

/** Parabolic swag between two points (a garland's natural droop) */
export function swag(a: THREE.Vector3, b: THREE.Vector3, sag: number) {
  return new THREE.CatmullRomCurve3(
    Array.from({ length: 9 }, (_, i) => {
      const t = i / 8
      const p = a.clone().lerp(b, t)
      p.y -= sag * 4 * t * (1 - t)
      return p
    }),
  )
}

export function line(a: THREE.Vector3, b: THREE.Vector3) {
  return new THREE.LineCurve3(a, b)
}
