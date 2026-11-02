import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { journey } from '../../lib/journey.ts'
import { MANDAPAM } from './layout.ts'
import { SUN_DIRECTION } from './Sky.tsx'
import type { TempleMaterials } from './materials.ts'

/**
 * Golden-hour sun behind the temple, warm sky fill, and three lamp lights:
 * two "lamp-bearer" lights glide with the guest (lighting the pillars nearest them),
 * and one burns in the hanging lamp above the rings.
 */
export function Lighting({ shadows, envResolution, mats }: { shadows: boolean; envResolution: number; mats: TempleMaterials }) {
  const { gl } = useThree()
  const sun = useRef<THREE.DirectionalLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const fill = useRef<THREE.DirectionalLight>(null)
  const lampA = useRef<THREE.PointLight>(null)
  const lampB = useRef<THREE.PointLight>(null)
  const hanging = useRef<THREE.SpotLight>(null)
  const lampTarget = useMemo(() => new THREE.Object3D(), [])
  const sunTarget = useMemo(() => new THREE.Object3D(), [])
  const lastDoors = useRef(-1)
  const frames = useRef(0)

  useLayoutEffect(() => {
    if (!shadows) return
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
  }, [gl, shadows])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const dusk = journey.dusk
    const cam = state.camera.position
    const still = journey.reducedMotion

    if (sun.current) sun.current.intensity = 3.6 * (1 - dusk * 0.88)
    if (hemi.current) hemi.current.intensity = 0.56 - dusk * 0.44
    const env = 0.42 * (1 - dusk * 0.78)
    for (const m of mats.matte) m.envMapIntensity = env
    if (fill.current) fill.current.intensity = 0.32 - dusk * 0.2

    const flick = (s: number) => (still ? 1 : 0.86 + Math.sin(t * 7.1 + s) * 0.07 + Math.sin(t * 13.3 + s * 2) * 0.05)

    // before entering: the lights sit in the great lamp stands; inside: they travel with the guest
    const inside = cam.z < 0.6 ? 1 : 0
    const z = THREE.MathUtils.clamp(cam.z - 2.2, -27.2, -1.6)
    const targets = [
      inside ? new THREE.Vector3(-2.3, 0.8, z) : new THREE.Vector3(-3.3, 2.0, 1.7),
      inside ? new THREE.Vector3(2.3, 0.8, z) : new THREE.Vector3(3.3, 2.0, 1.7),
    ]
    ;[lampA.current, lampB.current].forEach((light, i) => {
      if (!light) return
      if (frames.current < 2) light.position.copy(targets[i])
      else light.position.lerp(targets[i], inside ? 0.08 : 0.2)
      light.intensity = (inside ? 7 + dusk * 5 : 11) * flick(i * 3)
    })
    if (hanging.current) hanging.current.intensity = (9 + dusk * 9) * flick(9)

    // shadows only need re-rendering while the doors move (or on the first frames)
    if (shadows) {
      if (frames.current < 3 || Math.abs(journey.doors - lastDoors.current) > 0.0005) gl.shadowMap.needsUpdate = true
      lastDoors.current = journey.doors
    }
    frames.current++
  })

  const sunPos = useMemo(() => SUN_DIRECTION.clone().multiplyScalar(60).add(new THREE.Vector3(0, 0, -20)), [])
  sunPos.y = Math.max(sunPos.y, 14)

  return (
    <>
      <hemisphereLight ref={hemi} args={['#ffc493', '#2a1210', 0.62]} />
      <primitive object={sunTarget} position={[0, 0, -18]} />
      <directionalLight
        ref={sun}
        color="#ffb46a"
        position={sunPos.toArray()}
        intensity={2.6}
        target={sunTarget}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-near={10}
        shadow-camera-far={140}
      />
      {/* soft warm bounce from the guest's side so the gate face is never lost to silhouette */}
      <directionalLight ref={fill} color="#ffd2a1" position={[4, 6, 20]} intensity={0.5} />
      <pointLight ref={lampA} color="#ff9d45" intensity={10} distance={9} decay={1.6} />
      <pointLight ref={lampB} color="#ff9d45" intensity={10} distance={9} decay={1.6} />
      {/* the hanging lamp pours its light downward over the rings, never up through the canopy */}
      <primitive object={lampTarget} position={[0, 0, MANDAPAM.z]} />
      <spotLight
        ref={hanging}
        color="#ffae5c"
        position={[0, 3.9, MANDAPAM.z]}
        target={lampTarget}
        angle={1.18}
        penumbra={0.85}
        intensity={6}
        distance={9}
        decay={1.5}
      />

      {/* the room the gold reflects: warm softboxes, a sunset strip and dark earth */}
      <Environment resolution={envResolution} frames={1} background={false}>
        <color attach="background" args={['#3a2119']} />
        <Lightformer form="rect" intensity={0.9} color="#ffcf98" position={[0, -2, 0]} rotation-x={-Math.PI / 2} scale={[14, 14, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ffd8a8" position={[0, 2, 8]} rotation-y={Math.PI} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#ffe2b8" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={4} color="#ff9a4a" position={[0, 1.2, -9]} scale={[24, 2.2, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffe9cc" position={[7, 2, 4]} rotation-y={-Math.PI / 2.5} scale={[5, 7, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#ff7d3e" position={[-7, 1.5, 3]} rotation-y={Math.PI / 2.5} scale={[4, 6, 1]} />
        <Lightformer form="circle" intensity={6} color="#fff1d6" position={[2.5, 4, 6]} scale={1.4} />
      </Environment>
    </>
  )
}
