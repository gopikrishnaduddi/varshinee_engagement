import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { leafGeometry, line, swag } from './geometry.ts'
import { CORRIDOR, GATE, MANDAPAM, mandapamPillars } from './layout.ts'
import type { TempleMaterials } from './materials.ts'
import { rng } from './textures.ts'

type Strand = {
  curve: THREE.Curve<THREE.Vector3>
  spacing: number
  pattern: string
  thick?: boolean
  size?: number
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/**
 * m: orange marigold, y: yellow marigold, r: red rose, k: kanakambaram, j: jasmine bud
 */
const PALETTE: Record<string, string[]> = {
  m: ['#ec8a1e', '#f29a2a', '#e47a17', '#f4a83a'],
  y: ['#f4c22c', '#f7cf3e', '#eeb51f'],
  r: ['#8e1f2f', '#a02838', '#7d1a28'],
  k: ['#f0875a', '#f39a6c'],
}
const JASMINE = ['#fffaf0', '#fbf3e2', '#fff6e8']

function strands(): Strand[] {
  const s: Strand[] = []
  const g = GATE
  const top = g.sill + g.doorH
  // grand swag between the gate pillars, thick rope of marigold edged with jasmine
  s.push({ curve: swag(V(-g.pillarX, 6.42, 1.5), V(g.pillarX, 6.42, 1.5), 0.95), spacing: 0.07, pattern: 'mmymmrmmymmj', thick: true })
  s.push({ curve: swag(V(-g.pillarX, 6.36, 1.62), V(g.pillarX, 6.36, 1.62), 0.98), spacing: 0.06, pattern: 'j' })
  // smaller festoons across the carved lintel
  for (let i = 0; i < 3; i++) {
    const x0 = -1.8 + i * 1.2
    s.push({ curve: swag(V(x0, top + 0.3, 0.92), V(x0 + 1.2, top + 0.3, 0.92), 0.26), spacing: 0.065, pattern: 'mmjmmr' })
  }
  // long strands hanging down the face of each monumental pillar
  for (const sx of [-1, 1]) {
    for (const dx of [-0.36, 0.36]) {
      const x = sx * g.pillarX + dx
      s.push({ curve: line(V(x, 6.2, 1.62), V(x, 1.15, 1.62)), spacing: 0.075, pattern: 'mmmjmmmy' })
    }
    // strands framing the doorway
    s.push({ curve: line(V(sx * (g.doorW / 2 + 0.12), top + 0.1, 0.88), V(sx * (g.doorW / 2 + 0.12), 1.4, 0.88)), spacing: 0.07, pattern: 'jjjr' })
  }
  // the string that carries the mango-leaf thoranam
  s.push({ curve: swag(V(-g.doorW / 2, top - 0.06, 0.82), V(g.doorW / 2, top - 0.06, 0.82), 0.08), spacing: 0.09, pattern: 'my' })

  // corridor: festoons crossing overhead and along each colonnade
  CORRIDOR.zs.forEach((z, i) => {
    s.push({ curve: swag(V(-CORRIDOR.x + 0.3, 3.95, z), V(CORRIDOR.x - 0.3, 3.95, z), 0.92), spacing: 0.085, pattern: i % 2 ? 'mmjmmy' : 'yymjyyr' })
    if (i < CORRIDOR.zs.length - 1) {
      const z2 = CORRIDOR.zs[i + 1]
      for (const sx of [-1, 1]) {
        s.push({ curve: swag(V(sx * (CORRIDOR.x - 0.4), 3.92, z - 0.35), V(sx * (CORRIDOR.x - 0.4), 3.92, z2 + 0.35), 0.5), spacing: 0.085, pattern: 'mjmy' })
      }
    }
  })

  // mandapam: swags round the canopy and strands on the front pillars
  const mz = MANDAPAM.z
  const h = MANDAPAM.half
  const o = MANDAPAM.offsets
  const yb = MANDAPAM.beamY - 0.12
  for (let i = 0; i < o.length - 1; i++) {
    const a = o[i]
    const b = o[i + 1]
    s.push({ curve: swag(V(a, yb, mz + h + 0.36), V(b, yb, mz + h + 0.36), 0.55), spacing: 0.07, pattern: 'mmymmj', thick: true })
    s.push({ curve: swag(V(a, yb, mz - h - 0.36), V(b, yb, mz - h - 0.36), 0.55), spacing: 0.08, pattern: 'mmyj' })
    s.push({ curve: swag(V(h + 0.36, yb, mz + a), V(h + 0.36, yb, mz + b), 0.55), spacing: 0.08, pattern: 'mmyj' })
    s.push({ curve: swag(V(-h - 0.36, yb, mz + a), V(-h - 0.36, yb, mz + b), 0.55), spacing: 0.08, pattern: 'mmyj' })
  }
  for (const [x, z] of mandapamPillars()) {
    if (Math.abs(z - (mz + h)) > 0.01) continue
    s.push({ curve: line(V(x - 0.22, 4.55, z + 0.38), V(x - 0.22, 1.5, z + 0.38)), spacing: 0.075, pattern: 'jjjm' })
    s.push({ curve: line(V(x + 0.22, 4.55, z + 0.38), V(x + 0.22, 1.5, z + 0.38)), spacing: 0.075, pattern: 'mmmr' })
  }
  return s
}

function build(spacingMul: number) {
  const r = rng(99)
  const flowers: { m: THREE.Matrix4; c: THREE.Color }[] = []
  const jasmine: { m: THREE.Matrix4; c: THREE.Color }[] = []
  const q = new THREE.Quaternion()
  const up = new THREE.Vector3(0, 1, 0)
  for (const st of strands()) {
    const len = st.curve.getLength()
    const n = Math.max(2, Math.floor(len / (st.spacing * 0.85 * spacingMul)))
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const p = st.curve.getPointAt(t)
      const tan = st.curve.getTangentAt(t).normalize()
      const kind = st.pattern[i % st.pattern.length]
      const ring = st.thick ? 3 : 1
      for (let k = 0; k < ring; k++) {
        const pos = p.clone()
        if (st.thick) {
          // three beads around the strand make a full, rope-like garland
          const side = new THREE.Vector3().crossVectors(tan, up).normalize()
          const normal = new THREE.Vector3().crossVectors(side, tan).normalize()
          const a = i * 0.9 + (k * Math.PI * 2) / 3
          pos.addScaledVector(side, Math.cos(a) * 0.045).addScaledVector(normal, Math.sin(a) * 0.045)
        }
        const scale = (st.size ?? 1) * (0.85 + r() * 0.3)
        if (kind === 'j') {
          q.setFromUnitVectors(up, tan.clone().add(new THREE.Vector3((r() - 0.5) * 0.8, 0, (r() - 0.5) * 0.8)).normalize())
          jasmine.push({
            m: new THREE.Matrix4().compose(pos, q.clone(), new THREE.Vector3(0.75 * scale, 1.25 * scale, 0.75 * scale)),
            c: new THREE.Color(JASMINE[Math.floor(r() * JASMINE.length)]),
          })
        } else {
          q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6))
          const pal = PALETTE[kind] ?? PALETTE.m
          flowers.push({
            m: new THREE.Matrix4().compose(pos, q.clone(), new THREE.Vector3(scale, scale * 0.82, scale)),
            c: new THREE.Color(pal[Math.floor(r() * pal.length)]),
          })
        }
      }
    }
  }
  // mango leaves hanging from the thoranam string
  const leaves: THREE.Matrix4[] = []
  const g = GATE
  const top = g.sill + g.doorH
  const count = 15
  for (let i = 0; i < count; i++) {
    const x = -g.doorW / 2 + 0.11 + (i / (count - 1)) * (g.doorW - 0.22)
    const sagY = 0.08 * 4 * ((x + g.doorW / 2) / g.doorW) * (1 - (x + g.doorW / 2) / g.doorW)
    leaves.push(
      new THREE.Matrix4().compose(
        V(x, top - 0.08 - sagY, 0.84),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.15, (r() - 0.5) * 0.4, (r() - 0.5) * 0.25)),
        new THREE.Vector3(1.1, 1.1, 1.1),
      ),
    )
  }
  return { flowers, jasmine, leaves }
}

export function Garlands({ mats, detail, spacing }: { mats: TempleMaterials; detail: 0 | 1; spacing: number }) {
  const data = useMemo(() => build(spacing), [spacing])
  const flowerGeo = useMemo(() => new THREE.IcosahedronGeometry(0.05, detail), [detail])
  const jasmineGeo = useMemo(() => new THREE.IcosahedronGeometry(0.026, 0), [])
  const leafGeo = useMemo(leafGeometry, [])
  const f = useRef<THREE.InstancedMesh>(null)
  const j = useRef<THREE.InstancedMesh>(null)
  const l = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    data.flowers.forEach((d, i) => {
      f.current!.setMatrixAt(i, d.m)
      f.current!.setColorAt(i, d.c)
    })
    data.jasmine.forEach((d, i) => {
      j.current!.setMatrixAt(i, d.m)
      j.current!.setColorAt(i, d.c)
    })
    data.leaves.forEach((m, i) => l.current!.setMatrixAt(i, m))
    for (const mesh of [f.current!, j.current!, l.current!]) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }, [data])

  useLayoutEffect(
    () => () => {
      flowerGeo.dispose()
      jasmineGeo.dispose()
      leafGeo.dispose()
    },
    [flowerGeo, jasmineGeo, leafGeo],
  )

  return (
    <group>
      <instancedMesh ref={f} args={[flowerGeo, mats.marigold, data.flowers.length]} frustumCulled={false} />
      <instancedMesh ref={j} args={[jasmineGeo, mats.jasmine, data.jasmine.length]} frustumCulled={false} />
      <instancedMesh ref={l} args={[leafGeo, mats.leaf, data.leaves.length]} />
    </group>
  )
}
