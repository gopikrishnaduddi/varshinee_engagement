import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { MapPin } from 'lucide-react'
import { useRef } from 'react'
import { eventDetails } from '../data/eventDetails.ts'
import { KalashaCrest, OrnamentalDivider } from './Ornaments.tsx'
import { QRCodeFrame } from './QRCodeFrame.tsx'

/** Scene 6: venue, the family's QR code and directions on an arched ivory stone plaque */
export function VenueSection({ active, reduced }: { active: boolean; reduced: boolean }) {
  const section = useRef<HTMLElement>(null)
  const e = eventDetails

  useGSAP(
    () => {
      if (!active || reduced) return
      const q = gsap.utils.selector(section)
      gsap
        .timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: { trigger: section.current, start: 'top 70%', toggleActions: 'play none none reverse' },
        })
        .from(q('.venue-plaque'), { autoAlpha: 0, y: 60, duration: 1.3, ease: 'expo.out' }, 0)
        .from(q('.v-stagger'), { autoAlpha: 0, y: 14, duration: 1, stagger: 0.12 }, 0.35)
        .from(q('.qr-frame'), { autoAlpha: 0, y: 18, duration: 1.1 }, 0.7)
    },
    { dependencies: [active, reduced], scope: section },
  )

  return (
    <section ref={section} id="venue" data-dim="0.4" aria-labelledby="venue-heading" className="relative flex min-h-[100svh] items-center justify-center px-4 py-24">
      <div data-cam="venue" className="pointer-events-none absolute left-0 top-1/2 h-px w-px" aria-hidden="true" />
      <div className="venue-plaque parchment relative w-full max-w-[540px] rounded-[9999px_9999px_24px_24px] px-[clamp(1.4rem,6vw,3rem)] pb-10 pt-[clamp(3.6rem,12vw,5rem)] text-center">
        <div className="pointer-events-none absolute inset-[10px] rounded-[9999px_9999px_16px_16px] border border-brass/50" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-[16px] rounded-[9999px_9999px_12px_12px] border border-brass/25" aria-hidden="true" />
        <div className="relative">
          <KalashaCrest dark className="v-stagger mx-auto mb-3 h-10 w-10" />
          <p className="v-stagger eyebrow text-brass">Venue</p>
          <h2 id="venue-heading" className="v-stagger gold-ink mt-3 font-ceremonial text-[clamp(1.35rem,1.1rem+1.3vw,1.95rem)] font-semibold leading-tight tracking-[0.12em]">
            {e.wording.venueHeading.toUpperCase()}
          </h2>
          <OrnamentalDivider dark width={200} className="v-stagger mx-auto mt-4 max-w-full" />
          <p className="v-stagger mt-4 font-display text-[clamp(1.8rem,1.5rem+1.6vw,2.5rem)] font-medium leading-tight text-ink">{e.venue.name}</p>
          <p className="v-stagger mt-2 font-sans text-[0.9rem] leading-relaxed text-ink/75">
            <span className="whitespace-nowrap">
              {e.date.weekday}, {e.date.day} {e.date.month} {e.date.year}
            </span>{' '}
            <span className="hidden sm:inline">·</span> <br className="sm:hidden" />
            <span className="whitespace-nowrap tabular-nums">{e.time.display}</span>
          </p>

          <div className="mt-9">
            <QRCodeFrame />
          </div>

          <a className="btn-royal v-stagger mt-8" href={e.venue.mapsUrl} target="_blank" rel="noopener noreferrer">
            <MapPin size={17} strokeWidth={1.8} aria-hidden="true" />
            Open in Google Maps
          </a>
          <p className="v-stagger mt-4 font-display text-[1.05rem] italic text-ink/75">{e.food}</p>
        </div>
      </div>
    </section>
  )
}
