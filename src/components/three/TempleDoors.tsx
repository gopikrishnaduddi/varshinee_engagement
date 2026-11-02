import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { journey } from '../../lib/journey.ts'
import { GATE } from './layout.ts'
import type { TempleMaterials } from './materials.ts'

const LEAF_W = GATE.doorW / 2
const LEAF_D = 0.12
const OPEN_ANGLE = 1.86 // ≈ 107°

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Brass studs at the panel intersections, on the outward face of each leaf */
function studMatrices(side: 1 | -1) {
  const out: THREE.Matrix4[] = []
  const cols = [0.06, 0.5, 0.94]
  const rows = 7
  for (const c of cols) {
    for (let r = 0; r < rows; r++) {
      const v = 0.035 + (r / (rows - 1)) * 0.93
      // leaf local space: hinge at x=0, leaf extends toward the centre
      const x = side * c * LEAF_W
      out.push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, v * GATE.doorH, LEAF_D / 2 + 0.005),
          new THREE.Quaternion(),
          new THREE.Vector3(1, 1, 0.6),
        ),
      )
    }
  }
  return out
}

function Leaf({ side, mats }: { side: 1 | -1; mats: TempleMaterials }) {
  // side = 1 → left leaf (hinge on the left, swings into the courtyard)
  const studs = useMemo(() => studMatrices(side), [side])
  const studRef = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = studRef.current!
    studs.forEach((m, i) => mesh.setMatrixAt(i, m))
    mesh.instanceMatrix.needsUpdate = true
  }, [studs])

  return (
    <group>
      <mesh position={[(side * LEAF_W) / 2, GATE.doorH / 2, 0]} material={mats.doorGold} castShadow>
        <boxGeometry args={[LEAF_W - 0.012, GATE.doorH, LEAF_D]} />
      </mesh>
      <instancedMesh ref={studRef} args={[undefined, mats.brass, studs.length]}>
        <sphereGeometry args={[0.042, 12, 8]} />
      </instancedMesh>
      {/* ring knocker near the meeting edge */}
      <mesh position={[side * (LEAF_W - 0.26), 2.55, LEAF_D / 2 + 0.03]} material={mats.brass}>
        <torusGeometry args={[0.11, 0.017, 10, 32]} />
      </mesh>
      <mesh position={[side * (LEAF_W - 0.26), 2.67, LEAF_D / 2 + 0.03]} material={mats.darkBrass}>
        <sphereGeometry args={[0.045, 12, 10]} />
      </mesh>
    </group>
  )
}

export function TempleDoors({ mats }: { mats: TempleMaterials }) {
  const left = useRef<THREE.Group>(null)
  const right = useRef<THREE.Group>(null)
  const lightPlane = useRef<THREE.Mesh>(null)
  const seam = useRef<THREE.Sprite>(null)
  const shafts = useRef<THREE.Group>(null)

  const lightMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(2.4, 1.3, 0.5), // HDR amber that tone-maps to molten gold, not white
        transparent: true,
      }),
    [],
  )
  const seamMat = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: mats.glow,
        color: new THREE.Color(1.6, 1.05, 0.55),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [mats.glow],
  )
  const shaftMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: mats.glow,
        color: new THREE.Color(1.2, 0.8, 0.42),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [mats.glow],
  )
  useLayoutEffect(
    () => () => {
      lightMat.dispose()
      seamMat.dispose()
      shaftMat.dispose()
    },
    [lightMat, seamMat, shaftMat],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const open = easeInOut(Math.min(1, Math.max(0, journey.doors)))
    // anticipation: a breath of a push before the swing (journey.doors goes slightly negative)
    const push = journey.doors < 0 ? journey.doors * 0.06 : 0
    const angle = open * OPEN_ANGLE + push
    if (left.current) left.current.rotation.y = angle
    if (right.current) right.current.rotation.y = -angle

    const light = journey.light
    // the light behind the doors: a sliver at the seam, a flood as they part, then it gives way to the courtyard
    if (lightPlane.current) {
      lightMat.opacity = journey.doors >= 0.98 ? 0 : 1 - Math.max(0, (open - 0.45) / 0.5)
      lightPlane.current.visible = lightMat.opacity > 0.01
    }
    if (seam.current) {
      const flicker = 0.92 + Math.sin(t * 2.3) * 0.05 + Math.sin(t * 5.7) * 0.03
      const s = (1 - open) * 0.9 + light * 2.4
      seam.current.scale.set(1.3 + s * 0.6, GATE.doorH * (0.95 + light * 0.4), 1)
      seamMat.opacity = Math.min(1, ((1 - open) * 0.55 + light * 0.9) * flicker) * (1 - open * 0.65)
      seam.current.visible = seamMat.opacity > 0.01
    }
    if (shafts.current) {
      shaftMat.opacity = Math.sin(Math.min(1, light) * Math.PI) * 0.55
      shafts.current.visible = shaftMat.opacity > 0.01
    }
  })

  const half = GATE.doorW / 2
  return (
    <group position={[0, GATE.sill, 0]}>
      <group ref={left} position={[-half, 0, 0]}>
        <Leaf side={1} mats={mats} />
      </group>
      <group ref={right} position={[half, 0, 0]}>
        <Leaf side={-1} mats={mats} />
      </group>
      {/* the golden light waiting behind the doors */}
      <mesh ref={lightPlane} position={[0, GATE.doorH / 2, -0.32]} material={lightMat}>
        <planeGeometry args={[GATE.doorW + 0.1, GATE.doorH]} />
      </mesh>
      <sprite ref={seam} position={[0, GATE.doorH / 2, 0.2]} material={seamMat} />
      {/* soft shafts of light that spill toward the guest as the doors part */}
      <group ref={shafts} position={[0, GATE.doorH / 2, 1.6]}>
        {[-0.9, 0, 0.9].map((x, i) => (
          <mesh key={i} position={[x * 0.7, 0, 0]} rotation={[0, x * 0.25, 0]} material={shaftMat}>
            <planeGeometry args={[2.4, 6.4]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
