import gsap from 'gsap'
import { useEffect, useRef } from 'react'

/** How many flowers fly in from EACH side (phones get a little fewer) */
const FLOWERS_PER_SIDE = { phone: 24, desktop: 36 }
/** Wait this long after the invitation starts appearing before the flowers spill in (seconds) */
const START_DELAY = 0.5

const KINDS = ['rose', 'rose', 'rose', 'marigold', 'mpetal', 'mpetal', 'jasmine', 'jasmine'] as const
const SIZE: Record<(typeof KINDS)[number], [number, number]> = {
  rose: [18, 30],
  marigold: [24, 36],
  mpetal: [14, 22],
  jasmine: [16, 24],
}

/** Rose petals, marigolds and jasmine, drawn once and reused by every flower */
function FlowerShapes() {
  const marigoldOuter = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2
    return <circle key={`o${i}`} cx={20 + Math.cos(a) * 12} cy={20 + Math.sin(a) * 12} r={6.6} fill="url(#fs-mg-o)" />
  })
  const marigoldInner = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + 0.3
    return <circle key={`i${i}`} cx={20 + Math.cos(a) * 7} cy={20 + Math.sin(a) * 7} r={5.2} fill="url(#fs-mg-i)" />
  })
  const jasminePetals = Array.from({ length: 5 }, (_, i) => (
    <ellipse key={i} cx={20} cy={11} rx={5.2} ry={9.5} fill="url(#fs-jas)" transform={`rotate(${i * 72} 20 20)`} />
  ))
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="fs-rose-g" cx=".45" cy=".35" r=".75">
          <stop offset="0" stopColor="#c8394d" />
          <stop offset=".65" stopColor="#9e2a3a" />
          <stop offset="1" stopColor="#6e1424" />
        </radialGradient>
        <radialGradient id="fs-mg-o" cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor="#ffc247" />
          <stop offset="1" stopColor="#e8780e" />
        </radialGradient>
        <radialGradient id="fs-mg-i" cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor="#ffa526" />
          <stop offset="1" stopColor="#d4620a" />
        </radialGradient>
        <linearGradient id="fs-mp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffbe3d" />
          <stop offset="1" stopColor="#e6740c" />
        </linearGradient>
        <radialGradient id="fs-jas" cx=".5" cy=".3" r=".8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f3e9d6" />
        </radialGradient>
        <symbol id="fs-rose" viewBox="0 0 40 40">
          <path d="M20 2 C31 8 35 21 28 32 C24 38 16 38 12 32 C5 21 9 8 20 2 Z" fill="url(#fs-rose-g)" />
          <path d="M20 7 C21 16 21 25 20 33" stroke="rgba(255,190,190,.28)" strokeWidth="1" fill="none" />
        </symbol>
        <symbol id="fs-marigold" viewBox="0 0 40 40">
          {marigoldOuter}
          {marigoldInner}
          <circle cx="20" cy="20" r="4.6" fill="#b8520a" />
        </symbol>
        <symbol id="fs-mpetal" viewBox="0 0 40 40">
          <path d="M20 4 Q27 6 28 14 Q31 18 28 24 Q27 32 20 36 Q13 32 12 24 Q9 18 12 14 Q13 6 20 4 Z" fill="url(#fs-mp)" />
        </symbol>
        <symbol id="fs-jasmine" viewBox="0 0 40 40">
          {jasminePetals}
          <circle cx="20" cy="20" r="3" fill="#e7d68a" />
        </symbol>
      </defs>
    </svg>
  )
}

/**
 * A shower of rose petals, marigolds and jasmine thrown in from the left and right edges,
 * arcing inward and drifting down past the invitation. Plays once.
 */
export function FlowerShower({ play }: { play: boolean }) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const layer = root.current
    if (!play || !layer) return
    const W = window.innerWidth
    const H = window.innerHeight
    const phone = W < 700
    const perSide = phone ? FLOWERS_PER_SIDE.phone : FLOWERS_PER_SIDE.desktop
    const scale = phone ? 0.9 : 1.15
    const nodes: HTMLElement[] = []
    const tl = gsap.timeline({ delay: START_DELAY, onComplete: () => nodes.forEach((n) => n.remove()) })
    const rand = (a: number, b: number) => a + Math.random() * (b - a)

    for (const side of [-1, 1]) {
      for (let i = 0; i < perSide; i++) {
        const kind = KINDS[Math.floor(Math.random() * KINDS.length)]
        const size = rand(...SIZE[kind]) * scale
        const n = document.createElement('div')
        n.style.cssText = `position:absolute;left:0;top:0;width:${size}px;height:${size}px;will-change:transform,opacity;filter:drop-shadow(0 3px 4px rgba(40,15,10,.35))`
        n.innerHTML = `<svg viewBox="0 0 40 40" width="100%" height="100%"><use href="#fs-${kind}"/></svg>`
        layer.appendChild(n)
        nodes.push(n)

        // thrown in from just outside the edge, arcing up a little, then drifting down past the card
        const startX = side < 0 ? -size - rand(0, 40) : W + rand(0, 40)
        const startY = H * rand(0.08, 0.62)
        const reach = W * rand(0.18, 0.62)
        const endX = side < 0 ? reach : W - reach - size
        const lift = H * rand(0.04, 0.16)
        const at = rand(0, 1.3) // staggered over ~1.3 s so it spills rather than pops
        const fall = rand(3.4, 5.6)

        gsap.set(n, { x: startX, y: startY, rotation: rand(0, 360), transformPerspective: 500, opacity: 1 })
        tl.to(n, { x: endX, duration: fall, ease: 'power3.out' }, at)
          .to(n, { y: startY - lift, duration: 0.8, ease: 'power2.out' }, at)
          .to(n, { y: H + 80, duration: fall - 0.5, ease: 'power1.in' }, at + 0.8)
          .to(
            n,
            {
              rotation: `+=${side * rand(180, 520)}`,
              rotationX: rand(180, 720),
              rotationY: rand(-360, 360),
              duration: fall + 0.3,
              ease: 'none',
            },
            at,
          )
          .to(n, { opacity: 0, duration: 0.7, ease: 'power1.in' }, at + fall - 0.4)
      }
    }
    return () => {
      tl.kill()
      nodes.forEach((n) => n.remove())
    }
  }, [play])

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 25 }}>
      <FlowerShapes />
    </div>
  )
}