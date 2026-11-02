import { eventDetails } from '../data/eventDetails.ts'
import { Monogram } from './Monogram.tsx'

/** Composition used only to capture the 1200×630 social preview image (?og) */
export function OgCard() {
  const e = eventDetails
  return (
    <div className="fixed inset-0 z-20">
      <div
        className="absolute"
        style={{
          left: 'var(--seal-x)',
          top: 'var(--seal-y)',
          width: 'clamp(116px, calc(var(--door-half) * 1.08), 224px)',
          aspectRatio: '1',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <Monogram className="h-full w-full" />
      </div>
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-9 pt-28 text-center"
        style={{ background: 'linear-gradient(0deg, rgba(24,14,12,0.95) 0%, rgba(24,14,12,0.75) 45%, rgba(24,14,12,0) 100%)' }}
      >
        <p className="eyebrow text-gold-soft">The Engagement of</p>
        <p className="gold-text mt-2 font-display text-[64px] italic leading-none">{e.couple.short}</p>
        <p className="mt-4 font-ceremonial text-[17px] tracking-[0.28em] text-ivory/90">
          {e.date.weekday.toUpperCase()} · {e.date.day} {e.date.month.toUpperCase()} {e.date.year}
        </p>
      </div>
    </div>
  )
}
