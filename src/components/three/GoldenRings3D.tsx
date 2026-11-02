import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { journey } from '../../lib/journey.ts'
import { RINGS_POS } from './layout.ts'
import type { TempleMaterials } from './materials.ts'
import { rng } from './textures.ts'

/** Comfort-fit band cross-section revolved around Y (counter-clockwise loop → outward normals) */
function bandGeometry(ri: number, ro: number, hw: number, c: number, segments: number) {
  const pts: THREE.Vector2[] = []
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 5; i++) {
      const a = a0 + (i / 5) * (Math.PI / 2)
      pts.push(new THREE.Vector2(cx + Math.cos(a) * c, cy + Math.sin(a) * c))
    }
  }
  corner(ro - c, -hw + c, -Math.PI / 2)
  corner(ro - c, hw - c, 0)
  corner(ri + c, hw - c, Math.PI / 2)
  corner(ri + c, -hw + c, Math.PI)
  pts.push(pts[0].clone())
  return new THREE.LatheGeometry(pts, segments)
}

function gemGeometry() {
  const crown = new THREE.CylinderGeometry(0.034, 0.058, 0.024, 8, 1)
  crown.translate(0, 0.012, 0)
  const pavilion = new THREE.ConeGeometry(0.058, 0.062, 8, 1)
  pavilion.rotateX(Math.PI)
  pavilion.translate(0, -0.031, 0)
  const parts = [crown.toNonIndexed(), pavilion.toNonIndexed()]
  const pos = parts.flatMap((p) => Array.from(p.attributes.position.array as Float32Array))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  parts.forEach((p) => p.dispose())
  crown.dispose()
  pavilion.dispose()
  return g
}

/** Two interlocking engagement rings floating at the heart of the mandapam */
export function GoldenRings3D({ mats, segments }: { mats: TempleMaterials; segments: number }) {
  const group = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Group>(null)
  const milgrain = useRef<THREE.InstancedMesh>(null)
  const wreath = useRef<THREE.InstancedMesh>(null)
  const seg = Math.max(64, segments * 4)

  const A = { ri: 0.4, ro: 0.468, hw: 0.078 }
  const B = { ri: 0.36, ro: 0.408, hw: 0.046 }
  const d = 0.43

  const geo = useMemo(
    () => ({
      a: bandGeometry(A.ri, A.ro, A.hw, 0.022, seg),
      b: bandGeometry(B.ri, B.ro, B.hw, 0.016, seg),
      gem: gemGeometry(),
      bead: new THREE.SphereGeometry(0.0095, 8, 6),
      groove: new THREE.TorusGeometry(A.ro + 0.0005, 0.0045, 6, seg),
      prong: new THREE.CylinderGeometry(0.006, 0.008, 0.07, 6),
      seat: new THREE.CylinderGeometry(0.05, 0.03, 0.035, 16),
      bud: new THREE.IcosahedronGeometry(0.03, 0),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seg],
  )

  const metal = useMemo(
    () => ({
      yellow: new THREE.MeshPhysicalMaterial({
        color: '#f0c26e',
        metalness: 1,
        roughness: 0.14,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.8,
        side: THREE.DoubleSide,
      }),
      champagne: new THREE.MeshPhysicalMaterial({
        color: '#f6dba6',
        metalness: 1,
        roughness: 0.12,
        clearcoat: 0.6,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.9,
        side: THREE.DoubleSide,
      }),
      engraving: new THREE.MeshStandardMaterial({ color: '#7a5320', metalness: 1, roughness: 0.5 }),
      gem: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0,
        ior: 2.4,
        reflectivity: 1,
        iridescence: 0.6,
        iridescenceIOR: 1.8,
        envMapIntensity: 4,
        flatShading: true,
      }),
      glow: new THREE.SpriteMaterial({
        map: mats.glow,
        color: new THREE.Color(0.9, 0.62, 0.3),
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    }),
    [mats.glow],
  )

  useLayoutEffect(() => {
    // milgrain beading along both edges of the wider band
    const m = milgrain.current!
    const n = 110
    const dummy = new THREE.Object3D()
    let i = 0
    for (const y of [-A.hw + 0.012, A.hw - 0.012]) {
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2
        dummy.position.set(Math.cos(a) * (A.ro - 0.002), y, Math.sin(a) * (A.ro - 0.002))
        dummy.updateMatrix()
        m.setMatrixAt(i++, dummy.matrix)
      }
    }
    m.instanceMatrix.needsUpdate = true

    // a floating wreath of jasmine and rose buds
    const w = wreath.current!
    const r = rng(12)
    const col = new THREE.Color()
    const count = w.count
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2
      const rad = 1.12 + (r() - 0.5) * 0.06
      dummy.position.set(Math.cos(a) * rad, (r() - 0.5) * 0.05, Math.sin(a) * rad)
      dummy.rotation.set(r() * 3, r() * 3, r() * 3)
      const rose = k % 5 === 0
      dummy.scale.set(rose ? 1.7 : 0.8, rose ? 1.4 : 1.4, rose ? 1.7 : 0.8)
      dummy.updateMatrix()
      w.setMatrixAt(k, dummy.matrix)
      w.setColorAt(k, col.set(rose ? '#9e2a3a' : k % 5 === 2 ? '#f2b34a' : '#fff8ec'))
    }
    w.instanceMatrix.needsUpdate = true
    if (w.instanceColor) w.instanceColor.needsUpdate = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose())
      Object.values(metal).forEach((m) => m.dispose())
    },
    [geo, metal],
  )

  useFrame((state) => {
    const t = journey.reducedMotion ? 0 : state.clock.elapsedTime
    if (group.current) {
      group.current.rotation.y = t * 0.16 + 0.5
      group.current.position.y = RINGS_POS.y + Math.sin(t * 0.55) * 0.035
    }
    if (halo.current) {
      halo.current.rotation.y = -t * 0.07
      halo.current.position.y = RINGS_POS.y - 0.62 + Math.sin(t * 0.4 + 1) * 0.02
    }
  })

  return (
    <group>
      <sprite position={[RINGS_POS.x, RINGS_POS.y, RINGS_POS.z - 0.6]} scale={[2.6, 2.6, 1]} material={metal.glow} />
      <group ref={group} position={RINGS_POS.toArray()}>
        <group rotation={[0.42, 0, 0.18]} scale={1.08}>
          {/* ring one: wide yellow-gold band with milgrain edges and an engraved line */}
          <group position={[-d / 2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh geometry={geo.a} material={metal.yellow} />
            <instancedMesh ref={milgrain} args={[geo.bead, metal.yellow, 220]} />
            <mesh geometry={geo.groove} material={metal.engraving} rotation={[Math.PI / 2, 0, 0]} />
          </group>
          {/* ring two: slender champagne band carrying a single brilliant stone */}
          <group position={[d / 2, 0, 0]}>
            <mesh geometry={geo.b} material={metal.champagne} />
            <group position={[0, 0, B.ro + 0.018]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh geometry={geo.seat} material={metal.champagne} position={[0, 0, 0]} />
              {[0, 1, 2, 3].map((k) => {
                const a = (k / 4) * Math.PI * 2 + Math.PI / 4
                return (
                  <mesh
                    key={k}
                    geometry={geo.prong}
                    material={metal.champagne}
                    position={[Math.cos(a) * 0.056, 0.05, Math.sin(a) * 0.056]}
                    rotation={[Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22]}
                  />
                )
              })}
              <mesh geometry={geo.gem} material={metal.gem} position={[0, 0.072, 0]} />
            </group>
          </group>
        </group>
      </group>
      <group ref={halo} position={[RINGS_POS.x, RINGS_POS.y - 0.62, RINGS_POS.z]} rotation={[0.08, 0, 0]}>
        <instancedMesh ref={wreath} args={[geo.bud, mats.jasmine, 64]} />
      </group>
    </group>
  )
}
