import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DateReveal } from './components/DateReveal.tsx'
import { FinalBlessings } from './components/FinalBlessings.tsx'
import { GoldenRings } from './components/GoldenRings.tsx'
import { InvitationReveal } from './components/InvitationReveal.tsx'
import { JourneyNav } from './components/JourneyNav.tsx'
import { MandapamScene } from './components/MandapamScene.tsx'
import { SceneErrorBoundary } from './components/SceneErrorBoundary.tsx'
import { SceneFallback } from './components/SceneFallback.tsx'
import { SoundControl } from './components/SoundControl.tsx'
import { TempleEntrance } from './components/TempleEntrance.tsx'
import { VenueSection } from './components/VenueSection.tsx'
import { useReducedMotion } from './hooks/useReducedMotion.ts'
import { finishBoot, markBoot, onBootFinished } from './lib/boot.ts'
import { journey, notifyJourney, type CamKey } from './lib/journey.ts'
import { isOgCapture } from './lib/support.ts'
import { webglAvailable, worldModule } from './lib/worldLoader.ts'
import { OgCard } from './components/OgCard.tsx'
import { VideoBackdrop } from './components/VideoBackdrop.tsx'
import { GateVideo, type GateStatus, type SealSpot } from './components/GateVideo.tsx'
import { FlowerShower } from './components/FlowerShower.tsx'
import { CouplePortraits } from './components/CouplePortraits.tsx'

gsap.registerPlugin(ScrollTrigger)
gsap.config({ nullTargetWarn: false })
ScrollTrigger.config({ ignoreMobileResize: true })

const World = lazy(() => worldModule ?? Promise.reject(new Error('WebGL unavailable')))
const RingsOverlay = lazy(() => import('./components/three/RingsOverlay.tsx'))

type Stage = 'gate' | 'entering' | 'inside'

/** The gate opens by itself this many milliseconds after it appears (a tap opens it sooner) */
const AUTO_ENTER_DELAY = 1000
/** Auto-scroll: starts this many milliseconds after the invitation has fully appeared */
const AUTO_SCROLL_DELAY = 2000
/** Auto-scroll speed, in screen-heights per second (0.1 = one full screen every 10 seconds) */
const AUTO_SCROLL_SPEED = 0.17

/** Measure where each camera pose sits along the page's scroll */
function computeStops() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const stops = Array.from(document.querySelectorAll<HTMLElement>('[data-cam]')).map((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY
    return { key: el.dataset.cam as CamKey, t: Math.min(1, Math.max(0, (top - window.innerHeight * 0.5) / max)) }
  })
  stops.sort((a, b) => a.t - b.t)
  if (stops.length) {
    stops[0].t = 0
    stops[stops.length - 1].t = 1
  }
  for (let i = 1; i < stops.length; i++) stops[i].t = Math.max(stops[i].t, stops[i - 1].t + 0.002)
  return stops
}

export default function App() {
  const reduced = useReducedMotion()
  journey.reducedMotion = reduced
  const og = isOgCapture()

  const [mode, setMode] = useState<'webgl' | 'fallback'>(webglAvailable ? 'webgl' : 'fallback')
  const [worldReady, setWorldReady] = useState(false)
  const [fallbackMounted, setFallbackMounted] = useState(true)
  const [bootDone, setBootDone] = useState(false)
  const [stage, setStage] = useState<Stage>('gate')
  const [revealing, setRevealing] = useState(false)
  const [inviteShown, setInviteShown] = useState(false)
  // background video: found & ready? switched on? 3D world retired once the video has taken over?
  const [videoReady, setVideoReady] = useState(false)
  const [videoOn, setVideoOn] = useState(false)
  const [retire3D, setRetire3D] = useState(false)
  // gate video: found? hidden once the light floods through? where its doors are on screen
  const [gateStatus, setGateStatus] = useState<GateStatus>(og ? 'missing' : 'pending')
  const [gateHidden, setGateHidden] = useState(false)
  const [sealSpot, setSealSpot] = useState<SealSpot | null>(null)
  const gateStatusRef = useRef(gateStatus)
  gateStatusRef.current = gateStatus
  const worldReadyRef = useRef(false)
  const stageRef = useRef<Stage>('gate')
  const lenisRef = useRef<Lenis | null>(null)

  /* ---------- boot: the loading seal lifts on real milestones ---------- */
  useEffect(() => {
    markBoot('app')
    const fonts = document.fonts?.ready ?? Promise.resolve()
    fonts.then(() => {
      markBoot('fonts')
      if (mode === 'fallback' && gateStatusRef.current !== 'pending') finishBoot()
    })
    // slow connection: show the illustrated temple rather than holding guests on the loader
    const slow = window.setTimeout(finishBoot, 4000)
    const off = onBootFinished(() => setBootDone(true))
    if ('debug' in Object.fromEntries(new URLSearchParams(window.location.search))) {
      Object.assign(window, { __journey: journey, __gsap: gsap, __ScrollTrigger: ScrollTrigger })
    }
    return () => {
      window.clearTimeout(slow)
      off()
    }
  }, [mode])

  const onWorldReady = useCallback(() => {
    markBoot('world')
    setWorldReady(true)
    worldReadyRef.current = true
    // if a gate video is still loading, wait for it so the gate doesn't change in front of the guest
    if (gateStatusRef.current !== 'pending') finishBoot()
  }, [])

  // the gate video's first frame is ready → lift the loader; no gate video → carry on with the 3D gate
  useEffect(() => {
    if (gateStatus === 'ready') {
      markBoot('world')
      finishBoot()
    } else if (gateStatus === 'missing' && (mode === 'fallback' || worldReadyRef.current)) {
      finishBoot()
    }
  }, [gateStatus, mode])

  // once the 3D world is drawing, let the illustrated stand-in fade away
  useEffect(() => {
    if (mode === 'webgl' && worldReady) {
      const t = window.setTimeout(() => setFallbackMounted(false), 1400)
      return () => window.clearTimeout(t)
    }
    if (mode === 'fallback') setFallbackMounted(true)
  }, [mode, worldReady])

  /* ---------- the gate holds the page until the guest enters ---------- */
  useLayoutEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    document.documentElement.classList.add('is-locked')
  }, [])

  // pointer parallax for the camera (fine pointers only)
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const move = (e: PointerEvent) => {
      journey.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      journey.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  // the seal and the words arrive once the stage is set
  useGSAP(
    () => {
      if (!bootDone) return
      if (reduced || og) {
        gsap.set('.seal, .gate-quote, .gate-rule, .gate-button, .gate-hint', { opacity: 1 })
        return
      }
      gsap
        .timeline({ delay: 0.25, defaults: { ease: 'power3.out' } })
        .fromTo('.seal', { opacity: 0, scale: 0.72, rotate: -14 }, { opacity: 1, scale: 1, rotate: 0, duration: 1.8, ease: 'expo.out' })
        .fromTo('.gate-quote', { opacity: 0, y: 16, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4 }, 0.6)
        .fromTo('.gate-rule', { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 1.2 }, 1.0)
        .fromTo('.gate-button', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.1 }, 1.15)
        .fromTo('.gate-hint', { opacity: 0 }, { opacity: 1, duration: 1.2 }, 1.7)
    },
    { dependencies: [bootDone, reduced, og] },
  )

  const finishEntry = useCallback(() => {
    journey.entered = true
    journey.enter = 1
    journey.doors = 1
    journey.light = 0
    stageRef.current = 'inside'
    setStage('inside')
    document.documentElement.classList.remove('is-locked')
    notifyJourney()
    requestAnimationFrame(() => {
      document.getElementById('couple-names')?.focus({ preventScroll: true })
    })
  }, [])

  const enter = useCallback(() => {
    if (stageRef.current !== 'gate') return
    stageRef.current = 'entering'
    setStage('entering')

    if (reduced) {
      gsap
        .timeline({ onComplete: finishEntry })
        .to('.gate', { autoAlpha: 0, duration: 0.5, ease: 'power1.out' })
        .call(() => {
          journey.doors = 1
          journey.enter = 1
          journey.entered = true
          notifyJourney()
          setVideoOn(true)
          setGateHidden(true)
          setRevealing(true)
        })
      return
    }

    gsap
      .timeline()
      .to('.gate-ui', { autoAlpha: 0, y: 24, duration: 0.8, ease: 'power2.in' }, 0)
      .to('.seal', { scale: 1.07, duration: 0.45, ease: 'power2.out' }, 0)
      .to('.seal-glow', { opacity: 1, duration: 0.45 }, 0)
      .to('.seal-left', { xPercent: -46, rotate: -9, autoAlpha: 0, duration: 1.3, ease: 'power3.in' }, 0.42)
      .to('.seal-right', { xPercent: 46, rotate: 9, autoAlpha: 0, duration: 1.3, ease: 'power3.in' }, 0.42)
      .to('.seal-glow', { opacity: 0, duration: 0.9 }, 0.95)
      // with a gate video: walk slowly toward the doors as the light grows
      .to('.gate-video', { scale: 1.22, duration: 2.6, ease: 'power2.in' }, 0.45)
      // a breath of anticipation, then the doors swing inward
      .to(journey, { doors: -0.7, duration: 0.42, ease: 'power2.out' }, 0.3)
      .to(journey, { doors: 1, duration: 2.9, ease: 'none' }, 0.72)
      .to('.fb-door-l', { rotationY: 96, duration: 2.6, ease: 'power2.inOut' }, 0.8)
      .to('.fb-door-r', { rotationY: -96, duration: 2.6, ease: 'power2.inOut' }, 0.8)
      .to(journey, { light: 1, duration: 1.5, ease: 'power2.in' }, 0.8)
      .call(() => {
        journey.burstAt = performance.now()
      }, undefined, 1.25)
      .to('.light-flood', { opacity: 0.92, duration: 1.05, ease: 'power2.in' }, 1.7)
      .to(journey, { enter: 1, duration: 3.1, ease: 'none' }, 1.05)
      .call(() => {
        setVideoOn(true)
        setGateHidden(true)
      }, undefined, 2.45)
      .to('.gate', { autoAlpha: 0, duration: 0.6 }, 2.6)
      .to(journey, { light: 0, duration: 1.6, ease: 'power2.out' }, 2.75)
      .to('.light-flood', { opacity: 0, duration: 1.6, ease: 'power2.out' }, 2.8)
      .call(() => setRevealing(true), undefined, 3.0)
      .call(finishEntry, undefined, 4.25)
  }, [reduced, finishEntry])

  /* ---------- auto-enter: "Enter the Celebration" presses itself a few seconds after the gate appears ---------- */
  useEffect(() => {
    if (!bootDone || og || stage !== 'gate') return
    let timer = 0
    const start = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (document.hidden || stageRef.current !== 'gate') return
        // a gentle press on the button, so guests see what happened, then the doors open
        gsap
          .timeline({ onComplete: enter })
          .to('.gate-button', { scale: 0.94, duration: 0.16, ease: 'power2.out' })
          .to('.gate-button', { scale: 1, duration: 0.22, ease: 'power2.out' })
      }, AUTO_ENTER_DELAY)
    }
    // if the link was opened in a background tab, wait until the guest is actually looking at the gate
    const onVisible = () => {
      if (!document.hidden) start()
    }
    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [bootDone, og, stage, enter])

  /* ---------- once inside: scroll drives the camera ---------- */
  useEffect(() => {
    if (stage !== 'inside') return
    const progress = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        journey.scroll = self.progress
        if (journey.reducedMotion) notifyJourney()
      },
    })
    const measure = () => {
      journey.stops = computeStops()
    }
    ScrollTrigger.addEventListener('refresh', measure)

    let lenis: Lenis | null = null
    let raf: ((t: number) => void) | null = null
    if (!reduced && window.matchMedia('(pointer: fine)').matches) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true })
      lenis.on('scroll', ScrollTrigger.update)
      raf = (t: number) => lenis!.raf(t * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
      lenisRef.current = lenis
    }
    // each scene asks for as much darkening of the 3D world as its text needs
    const dims = Array.from(document.querySelectorAll<HTMLElement>('[data-dim]')).map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 45%',
        onToggle: (self) => {
          if (self.isActive) gsap.to('.stage-dim', { opacity: Number(el.dataset.dim), duration: 1.2, ease: 'power2.out', overwrite: true })
        },
      }),
    )
    measure()
    ScrollTrigger.refresh()
    // fonts or late images can shift layout — re-measure shortly after
    const late = window.setTimeout(() => ScrollTrigger.refresh(), 900)
    return () => {
      window.clearTimeout(late)
      progress.kill()
      dims.forEach((d) => d.kill())
      ScrollTrigger.removeEventListener('refresh', measure)
      if (raf) gsap.ticker.remove(raf)
      lenis?.destroy()
      lenisRef.current = null
    }
  }, [stage, reduced])

  // if the video finishes downloading after the guest is already inside, fade it in then
  useEffect(() => {
    if (stage === 'inside' && videoReady) setVideoOn(true)
  }, [stage, videoReady])

  // once the video is showing, stop drawing the 3D world to save battery
  const showVideo = videoOn && videoReady
  useEffect(() => {
    if (!showVideo) return
    const t = window.setTimeout(() => setRetire3D(true), 1600)
    return () => window.clearTimeout(t)
  }, [showVideo])
  // both videos are here: the 3D temple is never seen, so stop drawing it to save battery
  useEffect(() => {
    if (gateStatus === 'ready' && videoReady) setRetire3D(true)
  }, [gateStatus, videoReady])

  // while the gate video shows, the seal and the light follow its doors
  const useGateSeal = gateStatus === 'ready' && sealSpot !== null && !og
  const sealVars = useGateSeal
    ? ({ '--seal-x': `${sealSpot.x}px`, '--seal-y': `${sealSpot.y}px`, '--door-half': `${sealSpot.half}px` } as React.CSSProperties)
    : undefined

  /* ---------- auto-scroll: glide slowly to the end; any touch, click, wheel or key hands control back ---------- */
  useEffect(() => {
    if (!inviteShown || stage !== 'inside' || reduced) return
    let raf = 0
    let stopped = false
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    const stop = () => {
      stopped = true
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
      events.forEach((ev) => window.removeEventListener(ev, stop, true))
    }
    events.forEach((ev) => window.addEventListener(ev, stop, { capture: true, passive: true }))
    const timer = window.setTimeout(() => {
      let y = window.scrollY
      const began = performance.now()
      let last = began
      const tick = (now: number) => {
        if (stopped) return
        const dt = Math.min(0.1, (now - last) / 1000)
        last = now
        const max = document.documentElement.scrollHeight - window.innerHeight
        const easeIn = Math.min(1, (now - began) / 2500) // gentle start
        const easeOut = Math.max(0.12, Math.min(1, (max - y) / (window.innerHeight * 0.8))) // soft arrival
        y = Math.min(max, y + AUTO_SCROLL_SPEED * window.innerHeight * dt * easeIn * easeIn * easeOut)
        if (lenisRef.current) lenisRef.current.scrollTo(y, { immediate: true, force: true })
        else window.scrollTo(0, y)
        if (y >= max - 0.5) stop()
        else raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, AUTO_SCROLL_DELAY)
    return stop
  }, [inviteShown, stage, reduced])

  const onInviteShown = useCallback(() => setInviteShown(true), [])

  const navigate = useCallback(
    (id: string) => {
      const el = document.getElementById(id)
      if (!el) return
      if (lenisRef.current) lenisRef.current.scrollTo(el, { duration: 2.2 })
      else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
    },
    [reduced],
  )

  const inside = stage !== 'gate'
  const showFallback = mode === 'fallback' || fallbackMounted

  return (
    <>
      <div className="stage" aria-hidden="true">
        {mode === 'webgl' && !retire3D && (
          <SceneErrorBoundary onError={() => setMode('fallback')}>
            <Suspense fallback={null}>
              <World onReady={onWorldReady} onLost={() => setMode('fallback')} />
            </Suspense>
          </SceneErrorBoundary>
        )}
        {showFallback && !retire3D && (
          <div
            className="absolute inset-0 transition-opacity duration-[1200ms]"
            style={{ opacity: mode === 'webgl' && worldReady ? 0 : 1 }}
          >
            <SceneFallback ownsSeal={(mode === 'fallback' || !worldReady) && gateStatus !== 'ready'} inside={inside} reduced={reduced} />
          </div>
        )}
        {!og && stage !== 'inside' && gateStatus !== 'missing' && (
          <GateVideo hidden={gateHidden} reduced={reduced} onStatus={setGateStatus} onSeal={setSealSpot} />
        )}
        {!og && <VideoBackdrop show={showVideo} reduced={reduced} onStatus={setVideoReady} />}
      </div>
      <div className="stage-dim" aria-hidden="true" />
      <div className="stage-vignette" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
      <div
        className="light-flood"
        aria-hidden="true"
        style={
          useGateSeal
            ? {
                background: `radial-gradient(40% 55% at ${sealSpot.x}px ${sealSpot.y}px, rgba(255,248,228,1) 0%, rgba(255,214,150,0.85) 30%, rgba(240,160,80,0.4) 60%, rgba(120,60,30,0) 100%)`,
              }
            : undefined
        }
      />
      {showVideo && webglAvailable && !og && (
        <Suspense fallback={null}>
          <RingsOverlay />
        </Suspense>
      )}

      {og ? (
        <OgCard />
      ) : (
        <>
          {stage !== 'inside' && (
            <div className="contents" style={sealVars}>
              <TempleEntrance onEnter={enter} ready={bootDone} />
            </div>
          )}
          <FlowerShower play={revealing && !reduced} />
          <SoundControl />
          <JourneyNav visible={stage === 'inside'} onNavigate={navigate} />
          <main id="main" className="relative z-10" inert={!revealing}>
            <InvitationReveal revealing={revealing} reduced={reduced} onRevealed={onInviteShown} />
            <CouplePortraits active={inside} reduced={reduced} />
            <MandapamScene active={inside} reduced={reduced} />
            <DateReveal active={inside} reduced={reduced} />
            <GoldenRings active={inside} reduced={reduced} />
            <VenueSection active={inside} reduced={reduced} />
            <FinalBlessings active={inside} reduced={reduced} />
          </main>
        </>
      )}
    </>
  )
}