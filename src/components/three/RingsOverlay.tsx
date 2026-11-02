import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { GoldenRings3D } from './GoldenRings3D.tsx'
import { RINGS_POS } from './layout.ts'
import type { TempleMaterials } from './materials.ts'
import { glowTexture } from './textures.ts'

/** Frame the rings so they (and their flower wreath) fit any screen shape */
function FitCamera() {
  const { camera, size } = useThree()
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / Math.max(1, size.height)
    const halfV = THREE.MathUtils.degToRad(cam.fov / 2)
    const halfH = Math.atan(Math.tan(halfV) * aspect)
    const halfWidthNeeded = aspect < 0.9 ? 1.2 : 1.45
    const dist = Math.max(5.9, halfWidthNeeded / Math.tan(halfH))
    cam.position.set(RINGS_POS.x, RINGS_POS.y + 0.4, RINGS_POS.z + dist)
    cam.lookAt(RINGS_POS.x, RINGS_POS.y - 0.28, RINGS_POS.z)
    cam.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function RingsScene() {
  // only the two things the rings need from the temple: a soft glow and the jasmine for the wreath
  const mats = useMemo(
    () =>
      ({
        glow: glowTexture(),
        jasmine: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, emissive: '#3a3226', flatShading: true }),
      }) as unknown as TempleMaterials,
    [],
  )
  useEffect(
    () => () => {
      mats.glow.dispose()
      mats.jasmine.dispose()
    },
    [mats],
  )
  const above = new THREE.Vector3(RINGS_POS.x, RINGS_POS.y + 1.4, RINGS_POS.z)
  return (
    <>
      <FitCamera />
      <ambientLight intensity={0.3} color="#ffd9a8" />
      <directionalLight position={[RINGS_POS.x + 3, RINGS_POS.y + 4, RINGS_POS.z + 3]} intensity={2.2} color="#ffe2b0" />
      <pointLight position={above.toArray()} intensity={7} distance={6} decay={1.5} color="#ffb35c" />
      <Environment resolution={128} frames={1} background={false}>
        <color attach="background" args={['#3a2119']} />
        <Lightformer form="rect" intensity={2.2} color="#ffe2b8" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={4} color="#ff9a4a" position={[0, 1.2, -9]} scale={[24, 2.2, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffe9cc" position={[7, 2, 4]} rotation-y={-Math.PI / 2.5} scale={[5, 7, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#ffd8a8" position={[0, 2, 8]} rotation-y={Math.PI} scale={[12, 4, 1]} />
        <Lightformer form="circle" intensity={6} color="#fff1d6" position={[2.5, 4, 6]} scale={1.4} />
      </Environment>
      <GoldenRings3D mats={mats} segments={28} />
    </>
  )
}

/**
 * When the background is a video, the 3D temple is switched off — so the golden rings
 * float over the video on their own, appearing only during the "Two Hearts" scene.
 */
export default function RingsOverlay() {
  const wrap = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    // only run the 3D rings while their scene is on (or about to be on) the screen
    const mount = ScrollTrigger.create({
      trigger: '#rings',
      start: 'top 180%',
      end: 'bottom -80%',
      onToggle: (self) => setNear(self.isActive),
    })
    // fade and gently grow in with the scene, fade out as it ends
    const fade = ScrollTrigger.create({
      trigger: '#rings',
      start: 'top 70%',
      end: 'bottom 30%',
      onUpdate: (self) => {
        const p = self.progress
        const o = Math.min(1, p / 0.15, (1 - p) / 0.15)
        if (wrap.current) {
          wrap.current.style.opacity = String(Math.max(0, o))
          wrap.current.style.transform = `scale(${0.9 + 0.1 * Math.max(0, o)})`
        }
      },
      onToggle: (self) => {
        if (!self.isActive && wrap.current) wrap.current.style.opacity = '0'
      },
    })
    return () => {
      mount.kill()
      fade.kill()
    }
  }, [])

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 3, opacity: 0, height: '100lvh', willChange: 'opacity, transform' }}
    >
      {near && (
        <Canvas
          dpr={[1, 1.75]}
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 35, near: 0.1, far: 100 }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.15
            gl.outputColorSpace = THREE.SRGBColorSpace
          }}
        >
          <RingsScene />
        </Canvas>
      )}
    </div>
  )
}