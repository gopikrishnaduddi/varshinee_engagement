import { useEffect, useRef } from 'react'
import { eventDetails } from '../data/eventDetails.ts'
import { Monogram } from './Monogram.tsx'

type Props = {
  onEnter: () => void
  ready: boolean
}

/**
 * Scene 1 overlay: the royal seal sits on the closed temple doors, with the opening
 * line and the invitation to enter. Scrolling or swiping down also opens the doors.
 */
export function TempleEntrance({ onEnter, ready }: Props) {
  const root = useRef<HTMLElement>(null)
  const touchY = useRef<number | null>(null)

  useEffect(() => {
    if (!ready) return
    const wheel = (e: WheelEvent) => {
      if (e.deltaY > 12) onEnter()
    }
    const start = (e: TouchEvent) => {
      touchY.current = e.touches[0]?.clientY ?? null
    }
    const move = (e: TouchEvent) => {
      if (touchY.current === null) return
      const dy = touchY.current - (e.touches[0]?.clientY ?? touchY.current)
      if (dy > 46) {
        touchY.current = null
        onEnter()
      }
    }
    const key = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key) && document.activeElement === document.body) {
        e.preventDefault()
        onEnter()
      }
    }
    window.addEventListener('wheel', wheel, { passive: true })
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('touchstart', start)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('keydown', key)
    }
  }, [ready, onEnter])

  const e = eventDetails
  return (
    <section
      ref={root}
      className="gate fixed inset-0 z-20 select-none"
      aria-labelledby="gate-title"
      style={{ touchAction: 'none' }}
    >
      <h1 id="gate-title" className="sr-only">
        {e.couple.short} — {e.eventName} invitation
      </h1>
      <p className="sr-only">
        {e.wording.families}, {e.couple.partnerOne.full} and {e.couple.partnerTwo.full} invite you to their engagement on{' '}
        {e.date.weekday}, {e.date.day} {e.date.month} {e.date.year}, {e.time.display}, at {e.venue.name}. {e.food}.
      </p>

      <div
        className="seal pointer-events-none absolute"
        style={{
          left: 'var(--seal-x)',
          top: 'var(--seal-y)',
          width: 'clamp(116px, calc(var(--door-half) * 1.08), 224px)',
          aspectRatio: '1',
          transform: 'translate(-50%, -50%)',
          opacity: 0,
        }}
      >
        <div className="seal-glow absolute inset-[-30%] rounded-full" aria-hidden="true" />
        <Monogram split className="h-full w-full" />
      </div>
      

      <div
        className="gate-ui absolute inset-x-0 bottom-0 flex flex-col items-center px-6 text-center"
        style={{
          paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 22px), 4.5svh)',
          paddingTop: '18svh',
          background:
            'linear-gradient(0deg, rgba(24,14,12,0.92) 0%, rgba(24,14,12,0.78) 34%, rgba(24,14,12,0.35) 70%, rgba(24,14,12,0) 100%)',
        }}
      >
        
        <p className="gate-quote font-display text-ivory text-glow text-[clamp(1.35rem,1.1rem+1.4vw,2.05rem)] italic leading-snug" style={{ opacity: 0 }}>
          “{e.wording.opening}”
        </p>
        <span className="gate-rule my-5 block h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent" style={{ opacity: 0 }} aria-hidden="true" />
        <button type="button" className="gate-button btn-royal" onClick={onEnter} disabled={!ready} style={{ opacity: 0 }}>
          <span aria-hidden="true" className="text-[0.6rem]">✦</span>
          Enter the Celebration
          <span aria-hidden="true" className="text-[0.6rem]">✦</span>
        </button>
        <p className="gate-hint mt-4 font-sans text-[0.72rem] tracking-[0.12em] text-ivory/60" style={{ opacity: 0 }}>
          Tap to open the temple doors
        </p>
      </div>
    </section>
  )
}
