import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { journey } from '../../lib/journey.ts'
import { diyaProfile, flameGeometry, kalasamProfile, lampStandProfile, leafGeometry } from './geometry.ts'
import { CORRIDOR, GATE, GOPURAM, MANDAPAM, WALL, diyaPositions } from './layout.ts'
import type { TempleMaterials } from './materials.ts'
import { rng } from './textures.ts'

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const latheGeo = (pts: [number, number][], seg: number, scale = 1) =>
  new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r * scale), y * scale)),
    seg,
  )

/** Where every visible flame and festival light sits — shared by the flame meshes and the glow shader */
export function useLightPoints() {
  return useMemo(() => {
    const flames: { p: THREE.Vector3; size: number }[] = []
    const lamps: { p: THREE.Vector3; size: number; group: number }[] = []
    // floor diyas
    for (const d of diyaPositions()) flames.push({ p: d.clone().add(V(0, 0.1, 0)), size: 0.55 })
    // kuthuvilakku lamp stands either side of the gate: five wicks each
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + 0.3
        flames.push({ p: V(sx * 3.3 + Math.cos(a) * 0.22, GATE.sill + 1.44, 1.25 + Math.sin(a) * 0.22), size: 0.7 })
      }
    }
    // hanging lamp in the mandapam
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2
      flames.push({ p: V(Math.cos(a) * 0.2, 4.08, MANDAPAM.z + Math.sin(a) * 0.2), size: 0.6 })
    }
    // floating diyas in the brass urli
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.6
      flames.push({ p: V(Math.cos(a) * 0.32, MANDAPAM.top + 0.26, -29.6 + Math.sin(a) * 0.32), size: 0.45 })
    }
    // lamps along the top of the courtyard walls (kindled as dusk falls)
    for (let z = -2; z >= WALL.back + 1; z -= 2.2) {
      lamps.push({ p: V(-WALL.x, WALL.height + 0.32, z), size: 0.9, group: 1 })
      lamps.push({ p: V(WALL.x, WALL.height + 0.32, z), size: 0.9, group: 1 })
    }
    for (let x = 4; x <= WALL.x - 1; x += 2.2) {
      lamps.push({ p: V(-x, WALL.height + 0.32, 0), size: 0.9, group: 1 })
      lamps.push({ p: V(x, WALL.height + 0.32, 0), size: 0.9, group: 1 })
      if (x > 7) {
        lamps.push({ p: V(-x, WALL.height + 0.32, WALL.back), size: 0.9, group: 1 })
        lamps.push({ p: V(x, WALL.height + 0.32, WALL.back), size: 0.9, group: 1 })
      }
    }
    // lamps lining the corridor roofs, kindled at dusk
    for (let z = -3.4; z >= -24.4; z -= 1.12) {
      lamps.push({ p: V(-(CORRIDOR.x - 0.62), 4.78, z), size: 0.5, group: 1 })
      lamps.push({ p: V(CORRIDOR.x - 0.62, 4.78, z), size: 0.5, group: 1 })
    }
    // a ring of lamps along the foot of the courtyard walls
    for (let z = -2.5; z >= WALL.back + 1.5; z -= 1.5) {
      lamps.push({ p: V(-WALL.x + 0.9, 0.12, z), size: 0.6, group: 1 })
      lamps.push({ p: V(WALL.x - 0.9, 0.12, z), size: 0.6, group: 1 })
    }
    for (let x = -WALL.x + 2; x <= WALL.x - 2; x += 1.5) {
      if (Math.abs(x) > 6.5) lamps.push({ p: V(x, 0.12, WALL.back + 0.9), size: 0.6, group: 1 })
      if (Math.abs(x) > 3.6) lamps.push({ p: V(x, 0.12, -0.9), size: 0.6, group: 1 })
    }
    // festival lights tracing the rajagopuram tiers
    let y = 6
    for (let i = 0; i < 7; i++) {
      const w = 11.4 - i * 1.08 + 0.5
      const d = 5.6 - i * 0.48 + 0.5
      const n = Math.round(w / 0.55)
      for (let k = 0; k <= n; k++) lamps.push({ p: V(-w / 2 + (k / n) * w, y + 0.22, GOPURAM.z + d / 2), size: 0.75, group: 2 })
      y += 2.12
    }
    // the mandapam canopy edge
    const h = MANDAPAM.half + 0.95
    for (let k = 0; k <= 16; k++) {
      const a = -h + (k / 16) * h * 2
      lamps.push({ p: V(a, MANDAPAM.beamY + 0.7, MANDAPAM.z + h), size: 0.55, group: 2 })
      lamps.push({ p: V(-h, MANDAPAM.beamY + 0.7, MANDAPAM.z + a), size: 0.55, group: 2 })
      lamps.push({ p: V(h, MANDAPAM.beamY + 0.7, MANDAPAM.z + a), size: 0.55, group: 2 })
    }
    return { flames, lamps }
  }, [])
}

const glowVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  attribute float aGroup;
  uniform float uTime;
  uniform float uScale;
  uniform float uDusk;
  uniform float uBoost;
  varying float vAlpha;
  varying float vHot;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float flick = 0.84 + 0.1 * sin(uTime * (6.0 + aSeed * 5.0) + aSeed * 40.0) + 0.06 * sin(uTime * (15.0 + aSeed * 4.0) + aSeed * 13.0);
    float on = aGroup < 0.5 ? (0.85 + uDusk * 0.4) : (aGroup < 1.5 ? smoothstep(0.05, 0.6, uDusk) : smoothstep(0.35, 0.85, uDusk));
    gl_PointSize = clamp(aSize * uScale * flick / max(0.1, -mv.z), 0.0, 320.0);
    vAlpha = on * flick * uBoost;
    vHot = aGroup < 0.5 ? 1.0 : 0.65;
    gl_Position = projectionMatrix * mv;
  }
`
const glowFragment = /* glsl */ `
  varying float vAlpha;
  varying float vHot;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    if (d > 1.0) discard;
    float core = exp(-d * d * 26.0);
    float halo = exp(-d * d * 4.0) * 0.32;
    vec3 col = mix(vec3(1.0, 0.5, 0.16), vec3(1.0, 0.9, 0.7), core);
    float a = (core * vHot + halo) * vAlpha;
    gl_FragColor = vec4(col * a, a);
  }
`

/** One draw call for every flame halo and festival light in the courtyard */
function GlowPoints({ points }: { points: { p: THREE.Vector3; size: number; group: number }[] }) {
  const { size, camera } = useThree()
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const r = rng(5)
    g.setAttribute('position', new THREE.Float32BufferAttribute(points.flatMap((d) => [d.p.x, d.p.y, d.p.z]), 3))
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(points.map((d) => d.size), 1))
    g.setAttribute('aGroup', new THREE.Float32BufferAttribute(points.map((d) => d.group), 1))
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(points.map(() => r()), 1))
    g.computeBoundingSphere()
    return g
  }, [points])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        uniforms: { uTime: { value: 0 }, uScale: { value: 400 }, uDusk: { value: 0 }, uBoost: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useLayoutEffect(
    () => () => {
      geo.dispose()
      mat.dispose()
    },
    [geo, mat],
  )
  useFrame((state) => {
    const cam = camera as THREE.PerspectiveCamera
    mat.uniforms.uTime.value = journey.reducedMotion ? 0 : state.clock.elapsedTime
    mat.uniforms.uScale.value = (size.height * state.viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2))
    mat.uniforms.uDusk.value = journey.dusk
  })
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />
}

function InstancedAt({
  geometry,
  material,
  matrices,
  castShadow = false,
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  matrices: THREE.Matrix4[]
  castShadow?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    matrices.forEach((m, i) => ref.current!.setMatrixAt(i, m))
    ref.current!.instanceMatrix.needsUpdate = true
    ref.current!.computeBoundingSphere()
  }, [matrices])
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} castShadow={castShadow} frustumCulled={false} />
}

const at = (p: THREE.Vector3, s = 1, rotY = 0) =>
  new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), rotY), V(s, s, s))

/** Purna kumbha: brass pot crowned with mango leaves and a coconut, flanking the steps */
function PurnaKumbha({ position, mats, seg }: { position: [number, number, number]; mats: TempleMaterials; seg: number }) {
  const pot = useMemo(
    () =>
      latheGeo(
        [
          [0, 0],
          [0.14, 0],
          [0.22, 0.07],
          [0.27, 0.19],
          [0.26, 0.31],
          [0.17, 0.41],
          [0.11, 0.45],
          [0.15, 0.49],
          [0.15, 0.52],
          [0, 0.52],
        ],
        seg,
        1.05,
      ),
    [seg],
  )
  const leaf = useMemo(leafGeometry, [])
  const leaves = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-2.25, a, 0, 'YXZ'))
        return new THREE.Matrix4().compose(V(Math.sin(a) * 0.1, 0.56, Math.cos(a) * 0.1), q, V(1.25, 1.35, 1.25))
      }),
    [],
  )
  useLayoutEffect(
    () => () => {
      pot.dispose()
      leaf.dispose()
    },
    [pot, leaf],
  )
  return (
    <group position={position}>
      <mesh geometry={pot} material={mats.brass} />
      <InstancedAt geometry={leaf} material={mats.leaf} matrices={leaves} />
      <mesh position={[0, 0.66, 0]} scale={[1, 1.25, 1]}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial color="#6b4527" roughness={0.9} />
      </mesh>
    </group>
  )
}

export function Lamps({ mats, seg }: { mats: TempleMaterials; seg: number }) {
  const { flames, lamps } = useLightPoints()
  const flameGeo = useMemo(flameGeometry, [])
  const diyaGeo = useMemo(() => latheGeo(diyaProfile(), Math.max(10, seg / 2)), [seg])
  const standGeo = useMemo(() => latheGeo(lampStandProfile(), seg), [seg])
  const hangGeo = useMemo(
    () =>
      latheGeo(
        [
          [0, -0.06],
          [0.12, -0.05],
          [0.24, 0.0],
          [0.26, 0.04],
          [0.2, 0.05],
          [0.06, 0.06],
          [0.05, 0.12],
          [0.1, 0.2],
          [0.06, 0.3],
          [0.02, 0.36],
          [0, 0.38],
        ],
        seg,
      ),
    [seg],
  )
  const urliGeo = useMemo(
    () =>
      latheGeo(
        [
          [0, 0],
          [0.26, 0],
          [0.48, 0.06],
          [0.6, 0.15],
          [0.65, 0.2],
          [0.59, 0.2],
          [0.5, 0.14],
          [0.0, 0.11],
        ],
        seg * 2,
      ),
    [seg],
  )
  const finialGeo = useMemo(() => latheGeo(kalasamProfile(0.5), seg), [seg])

  const diyaMatrices = useMemo(() => diyaPositions().map((p) => at(p, 1, p.x * 3)), [])
  const flameMatrices = useMemo(() => flames.map((f) => at(f.p.clone().add(V(0, -0.045, 0)), f.size * 1.3)), [flames])
  const urliFlowers = useMemo(() => {
    const r = rng(4)
    return Array.from({ length: 34 }, () => {
      const a = r() * Math.PI * 2
      const d = 0.12 + r() * 0.4
      return new THREE.Matrix4().compose(
        V(Math.cos(a) * d, MANDAPAM.top + 0.2, -29.6 + Math.sin(a) * d),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, 0)),
        V(1, 0.6, 1),
      )
    })
  }, [])
  const floatDiyas = useMemo(
    () =>
      Array.from({ length: 5 }, (_, k) => {
        const a = (k / 5) * Math.PI * 2 + 0.6
        return at(V(Math.cos(a) * 0.32, MANDAPAM.top + 0.17, -29.6 + Math.sin(a) * 0.32), 0.8)
      }),
    [],
  )
  const flowerGeo = useMemo(() => new THREE.IcosahedronGeometry(0.06, 0), [])
  const flowerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ef8d22', roughness: 0.8, flatShading: true }), [])

  useLayoutEffect(
    () => () => {
      ;[flameGeo, diyaGeo, standGeo, hangGeo, urliGeo, finialGeo, flowerGeo].forEach((g) => g.dispose())
      flowerMat.dispose()
    },
    [flameGeo, diyaGeo, standGeo, hangGeo, urliGeo, finialGeo, flowerGeo, flowerMat],
  )

  const glowPoints = useMemo(() => [...flames.map((f) => ({ ...f, group: 0 })), ...lamps], [flames, lamps])

  return (
    <group>
      <InstancedAt geometry={diyaGeo} material={mats.brass} matrices={[...diyaMatrices, ...floatDiyas]} />
      <InstancedAt geometry={flameGeo} material={mats.flame} matrices={flameMatrices} />
      {/* kuthuvilakku lamp stands */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 3.3, GATE.sill, 1.25]}>
          <mesh geometry={standGeo} material={mats.brass} castShadow />
        </group>
      ))}
      {/* the hanging lamp above the heart of the mandapam */}
      <group position={[0, 4.02, MANDAPAM.z]}>
        <mesh geometry={hangGeo} material={mats.brass} />
        <mesh position={[0, 0.78, 0]} material={mats.darkBrass}>
          <cylinderGeometry args={[0.012, 0.012, 1.0, 6]} />
        </mesh>
        <mesh geometry={finialGeo} material={mats.brass} position={[0, -0.36, 0]} rotation={[Math.PI, 0, 0]} />
      </group>
      {/* brass urli with floating flowers and diyas */}
      <group>
        <mesh geometry={urliGeo} material={mats.brass} position={[0, MANDAPAM.top, -29.6]} />
        <mesh position={[0, MANDAPAM.top + 0.155, -29.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.57, 40]} />
          <meshStandardMaterial color="#1a0f0b" roughness={0.08} metalness={0.3} />
        </mesh>
        <InstancedAt geometry={flowerGeo} material={flowerMat} matrices={urliFlowers} />
      </group>
      <PurnaKumbha position={[-1.85, 0, -26.25]} mats={mats} seg={seg} />
      <PurnaKumbha position={[1.85, 0, -26.25]} mats={mats} seg={seg} />
      <GlowPoints points={glowPoints} />
    </group>
  )
}
