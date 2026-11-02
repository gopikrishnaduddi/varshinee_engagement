import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import { journey, onJourneyChange } from '../../lib/journey.ts'
import { useResponsive3D } from '../../hooks/useResponsive3D.ts'
import { Architecture } from './Architecture.tsx'
import { CameraRig, POSES } from './CameraRig.tsx'
import { FloatingPetals } from './FloatingPetals.tsx'
import { Garlands } from './Garlands.tsx'
import { GoldDust } from './GoldDust.tsx'
import { GoldenRings3D } from './GoldenRings3D.tsx'
import { Lamps } from './Lamps.tsx'
import { Lighting } from './Lighting.tsx'
import { Sky } from './Sky.tsx'
import { TempleDoors } from './TempleDoors.tsx'
import { useTempleMaterials } from './materials.ts'

function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0)
  const done = useRef(false)
  const { invalidate } = useThree()
  // with an on-demand frame loop (reduced motion) nothing draws unless asked — ask for the first frames
  useEffect(() => {
    let n = 0
    let id = 0
    const tick = () => {
      if (done.current || n++ > 12) return
      invalidate()
      id = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(id)
  }, [invalidate])
  useFrame(() => {
    frames.current++
    if (!done.current && frames.current >= 3) {
      done.current = true
      onReady()
    }
  })
  return null
}

/** With reduced motion the canvas only redraws when something actually changes */
function DemandBridge() {
  const { invalidate } = useThree()
  useEffect(() => onJourneyChange(() => invalidate()), [invalidate])
  return null
}

function Temple({ onReady }: { onReady: () => void }) {
  const q = useResponsive3D()
  const mats = useTempleMaterials()
  const reduced = journey.reducedMotion
  return (
    <>
      <Sky />
      <Lighting shadows={q.shadows} envResolution={q.envResolution} mats={mats} />
      <Architecture mats={mats} shadows={q.shadows} lathe={q.lathe} />
      <TempleDoors mats={mats} />
      <Garlands mats={mats} detail={q.beadDetail} spacing={q.beadSpacing} />
      <Lamps mats={mats} seg={q.lathe} />
      <GoldenRings3D mats={mats} segments={q.lathe} />
      {!reduced && <FloatingPetals count={q.petals} />}
      {!reduced && <GoldDust count={q.dust} />}
      <CameraRig />
      <ReadySignal onReady={onReady} />
      {reduced && <DemandBridge />}
    </>
  )
}

export default function World({ onReady, onLost }: { onReady: () => void; onLost: () => void }) {
  const q = useResponsive3D()
  const [dpr, setDpr] = useState<number>(Math.min(window.devicePixelRatio || 1, q.dpr[1]))
  const reduced = journey.reducedMotion
  const gate = POSES.gate[q.portrait ? 'port' : 'land']

  return (
    <Canvas
      dpr={dpr}
      shadows={q.shadows ? 'soft' : false}
      frameloop={reduced ? 'demand' : 'always'}
      camera={{ position: gate.p, fov: gate.fov, near: 0.1, far: 320 }}
      gl={{
        antialias: q.tier === 'high',
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.02
        gl.outputColorSpace = THREE.SRGBColorSpace
        scene.background = new THREE.Color('#2a1714')
        if (new URLSearchParams(window.location.search).has('debug')) {
          ;(window as unknown as { __three: unknown }).__three = { gl, scene }
        }
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onLost()
        })
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => setDpr((d) => Math.max(0.85, d - 0.35))}
        onIncline={() => setDpr((d) => Math.min(q.dpr[1], d + 0.2))}
      />
      <Temple onReady={onReady} />
    </Canvas>
  )
}
