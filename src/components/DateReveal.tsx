import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { CalendarPlus } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { eventDetails } from '../data/eventDetails.ts'
import { googleCalendarUrl, ICS_FILENAME } from '../lib/ics.ts'
import { GoldGradient, OrnamentalDivider, useSvgId } from './Ornaments.tsx'

const isAppleMobile = () =>
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1))

/** A mandala of lotus petals that draws itself around the day */
function DateMandala() {
  const id = useSvgId('md')
  const g = `url(#${id}g)`
  const petals = Array.from({ length: 28 }, (_, i) => (
    <path
      key={i}
      d="M150 44 C158 30 158 20 150 8 C142 20 142 30 150 44 Z"
      transform={`rotate(${(i / 28) * 360} 150 150)`}
      stroke={g}
      strokeWidth="1"
      fill="none"
      pathLength={1}
      className="petal"
    />
  ))
  const dots = Array.from({ length: 56 }, (_, i) => {
    const a = (i / 56) * Math.PI * 2
    return <circle key={i} cx={150 + Math.cos(a) * 112} cy={150 + Math.sin(a) * 112} r={i % 2 ? 0.9 : 1.6} fill={g} className="md-dot" />
  })
  return (
    <svg viewBox="0 0 300 300" className="draw h-full w-full overflow-visible" aria-hidden="true" focusable="false">
      <defs>
        <GoldGradient id={`${id}g`} />
      </defs>
      {petals}
      <path d="M150 44 a106 106 0 1 1 -0.01 0" stroke={g} strokeWidth="1.4" fill="none" pathLength={1} className="ring" />
      <path d="M150 50 a100 100 0 1 1 -0.01 0" stroke={g} strokeWidth=".6" fill="none" pathLength={1} className="ring" />
      {dots}
      <path d="M150 62 a88 88 0 1 1 -0.01 0" stroke={g} strokeWidth=".5" fill="none" pathLength={1} className="ring" opacity=".7" />
    </svg>
  )
}

/** Tasteful time indicator: the hands settle at ten, and a gold arc marks 10 → 12 */
function ClockOrnament() {
  const id = useSvgId('ck')
  const g = `url(#${id}g)`
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    return <circle key={i} cx={32 + Math.cos(a) * 26} cy={32 + Math.sin(a) * 26} r={i % 3 === 0 ? 1.4 : 0.8} fill={g} />
  })
  // arc from 10 o'clock (-150°) to 12 o'clock (-90°)
  const r = 21
  const a0 = (-150 * Math.PI) / 180
  const a1 = (-90 * Math.PI) / 180
  const arc = `M ${32 + Math.cos(a0) * r} ${32 + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${32 + Math.cos(a1) * r} ${32 + Math.sin(a1) * r}`
  return (
    <svg viewBox="0 0 64 64" className="clock h-14 w-14 shrink-0" aria-hidden="true" focusable="false">
      <defs>
        <GoldGradient id={`${id}g`} />
      </defs>
      <circle cx="32" cy="32" r="30" fill="rgba(36,26,24,.5)" stroke={g} strokeWidth="1" />
      {ticks}
      <path className="clock-arc" d={arc} stroke={g} strokeWidth="3" strokeLinecap="round" fill="none" pathLength={1} style={{ strokeDasharray: 1 }} />
      <g className="hand-hour" transform="rotate(-60 32 32)">
        <path d="M32 32 L32 19" stroke="#f3e2b8" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      <g className="hand-minute">
        <path d="M32 32 L32 11" stroke="#f3e2b8" strokeWidth="1.3" strokeLinecap="round" />
      </g>
      <circle cx="32" cy="32" r="2.2" fill={g} />
    </svg>
  )
}

/** Scene 4: the ceremonial date on an arched, temple-niche plaque */
export function DateReveal({ active, reduced }: { active: boolean; reduced: boolean }) {
  const section = useRef<HTMLElement>(null)
  const e = eventDetails
  const apple = useMemo(isAppleMobile, [])

  useGSAP(
    () => {
      const q = gsap.utils.selector(section)
      if (reduced || !active) {
        if (reduced) gsap.set(q('.draw path, .clock-arc'), { strokeDashoffset: 0 })
        return
      }
      gsap.set(q('.clock-arc'), { strokeDashoffset: 1 })
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: { trigger: section.current, start: 'top 72%', toggleActions: 'play none none reverse' },
      })
      tl.from(q('.plaque'), { autoAlpha: 0, y: 50, scale: 0.97, duration: 1.3, ease: 'expo.out' }, 0)
        .to(q('.petal'), { strokeDashoffset: 0, duration: 1.6, stagger: { each: 0.035, from: 'start' }, ease: 'power2.inOut' }, 0.2)
        .to(q('.ring'), { strokeDashoffset: 0, duration: 2, stagger: 0.15, ease: 'power2.inOut' }, 0.2)
        .from(q('.md-dot'), { autoAlpha: 0, duration: 0.6, stagger: { each: 0.012, from: 'start' } }, 0.6)
        .from(q('.day'), { autoAlpha: 0, scale: 0.86, filter: 'blur(10px)', duration: 1.6, ease: 'expo.out' }, 0.7)
        .from(q('.month'), { autoAlpha: 0, letterSpacing: '0.9em', duration: 1.5, ease: 'power2.out' }, 1.0)
        .from(q('.year, .weekday'), { autoAlpha: 0, y: 10, duration: 1, stagger: 0.15 }, 1.3)
        .from(q('.time-row'), { autoAlpha: 0, y: 14, duration: 1 }, 1.6)
        .to(q('.clock-arc'), { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 1.9)
        .from(q('.hand-hour'), { rotation: -360, svgOrigin: '32 32', duration: 2.2, ease: 'power3.inOut' }, 1.7)
        .from(q('.hand-minute'), { rotation: -720, svgOrigin: '32 32', duration: 2.2, ease: 'power3.inOut' }, 1.7)
        .from(q('.date-cta > *'), { autoAlpha: 0, y: 12, duration: 0.9, stagger: 0.12 }, 2.1)
    },
    { dependencies: [active, reduced], scope: section },
  )

  return (
    <section ref={section} id="date" data-dim="0.3" aria-labelledby="date-heading" className="relative flex min-h-[100svh] items-center justify-center px-4 py-24">
      <div data-cam="canopy" className="pointer-events-none absolute left-0 top-1/2 h-px w-px" aria-hidden="true" />
      <div className="plaque plaque-dark relative w-full max-w-[520px] rounded-[9999px_9999px_28px_28px] px-[clamp(1.5rem,6vw,3rem)] pb-10 pt-[clamp(3.2rem,10vw,4.6rem)] text-center">
        <div className="pointer-events-none absolute inset-[10px] rounded-[9999px_9999px_20px_20px] border border-gold/35" aria-hidden="true" />
        <h2 id="date-heading" className="sr-only">
          {e.date.weekday}, {e.date.day} {e.date.month} {e.date.year}, {e.time.display}
        </h2>

        <div className="relative mx-auto aspect-square w-[min(68vw,260px)]" aria-hidden="true">
          <DateMandala />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="day gold-text font-display text-[clamp(5rem,4rem+6vw,7rem)] font-light leading-[0.85]">{e.date.day}</span>
          </div>
        </div>
        <p className="month mt-5 font-ceremonial text-[clamp(1.45rem,1.2rem+1.4vw,2.05rem)] font-medium tracking-[0.3em] text-ivory" aria-hidden="true">
          {e.date.month.toUpperCase()}
        </p>
        <p className="year mt-1 font-display text-[1.5rem] italic text-gold-soft" aria-hidden="true">
          {e.date.year}
        </p>
        <OrnamentalDivider className="weekday mx-auto mt-4" width={180} />
        <p className="weekday eyebrow mt-3 text-gold-soft" aria-hidden="true">
          {e.date.weekday}
        </p>

        <div className="time-row mx-auto mt-8 flex max-w-[340px] flex-col items-center justify-center gap-3 rounded-2xl border border-gold/25 bg-espresso/40 px-5 py-4 text-center min-[400px]:flex-row min-[400px]:gap-4 min-[400px]:text-left">
          <ClockOrnament />
          <div>
            <p className="whitespace-nowrap font-sans text-[1.18rem] font-semibold tracking-[0.02em] text-ivory tabular-nums">{e.time.display}</p>
            <p className="mt-0.5 font-ceremonial text-[0.7rem] tracking-[0.24em] text-gold-soft">{e.eventName.toUpperCase()}</p>
            <p className="mt-1 font-display text-[1.05rem] italic text-ivory/80">{e.food}</p>
          </div>
        </div>

        <div className="date-cta mt-8 flex flex-col items-center gap-5">
          <a
            className="btn-royal"
            href={`/${ICS_FILENAME}`}
            {...(apple ? {} : { download: ICS_FILENAME })}
            type="text/calendar"
          >
            <CalendarPlus size={17} strokeWidth={1.8} aria-hidden="true" />
            Add to Calendar
          </a>
          <a
            className="font-sans text-[0.82rem] text-gold-soft/90 underline decoration-gold/40 underline-offset-4 transition-colors hover:text-ivory"
            href={googleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            or add to Google Calendar
          </a>
        </div>
      </div>
    </section>
  )
}
