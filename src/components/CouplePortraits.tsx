import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, useState } from 'react'
import { eventDetails } from '../data/eventDetails.ts'
import { KalashaCrest } from './Ornaments.tsx'

/** temple-arch shape: a full semicircle on top of a 3 : 4 portrait */
const ARCH = '50% 50% 10px 10px / 37.5% 37.5% 10px 10px'
/** space between the two portraits (also used to centre the "&" between them) */
const GAP = 'clamp(2.4rem, 9vw, 6rem)'

type PortraitProps = { src: string; label: string; first: string; last: string; full: string; initial: string }

function Portrait({ src, label, first, last, full, initial }: PortraitProps) {
  const [missing, setMissing] = useState(false)
  return (
    <figure className="flex min-w-0 flex-col items-center">
      <div className="cp-frame relative w-full">
        <KalashaCrest className="cp-crest absolute left-1/2 top-0 z-10 h-[clamp(1.9rem,1.5rem+1.6vw,2.8rem)] w-[clamp(1.9rem,1.5rem+1.6vw,2.8rem)] -translate-x-1/2 -translate-y-[72%] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" />
        {/* gold frame → dark inlay → photo, all sharing the arch shape */}
        <div
          className="p-[3px]"
          style={{
            borderRadius: ARCH,
            background: 'linear-gradient(155deg, #f7e2a6 0%, #b8893d 32%, #f2d38c 52%, #9a6f2c 78%, #e9c97f 100%)',
            boxShadow: '0 24px 60px -18px rgba(0,0,0,0.75), 0 0 34px rgba(255,186,96,0.22)',
          }}
        >
          <div className="p-[4px]" style={{ borderRadius: ARCH, background: '#2a1512' }}>
            <div className="cp-photo relative aspect-[3/4] overflow-hidden bg-maroon-deep" style={{ borderRadius: ARCH }}>
              {missing ? (
                <div className="flex h-full w-full items-center justify-center font-display text-[clamp(3rem,2rem+5vw,5.5rem)] italic text-gold-soft/70">
                  {initial}
                </div>
              ) : (
                <img
                  src={src}
                  alt={full}
                  width={600}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onError={() => setMissing(true)}
                  className="h-full w-full select-none object-cover"
                  style={{ objectPosition: '50% 30%' }}
                />
              )}
              {/* soft vignette and warm lamp-light so both photos sit in the same golden scene */}
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
                style={{
                  background:
                    'radial-gradient(115% 85% at 50% 34%, rgba(0,0,0,0) 56%, rgba(28,11,8,0.55) 100%), linear-gradient(180deg, rgba(255,196,120,0.08) 0%, rgba(0,0,0,0) 45%, rgba(36,14,10,0.32) 100%)',
                }}
              />
              <div className="pointer-events-none absolute inset-[6px] border border-gold-soft/55" style={{ borderRadius: ARCH }} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-5 w-full text-center sm:mt-7">
        <span className="cp-label block font-ceremonial text-[clamp(0.56rem,0.5rem+0.3vw,0.72rem)] font-semibold tracking-[0.34em] text-gold-soft/90">
          {label.toUpperCase()}
        </span>
        <span className="cp-label mt-2 block font-display text-[clamp(1.75rem,1.25rem+2.3vw,2.8rem)] italic leading-none text-ivory text-glow">{first}</span>
        <span className="cp-label mt-2.5 block text-balance font-ceremonial text-[clamp(0.6rem,0.54rem+0.3vw,0.8rem)] tracking-[0.22em] text-ivory/75">
          {last.toUpperCase()}
        </span>
      </figcaption>
    </figure>
  )
}

/** The bride and the groom, in two golden temple-arch frames, just after the invitation card */
export function CouplePortraits({ active, reduced }: { active: boolean; reduced: boolean }) {
  const section = useRef<HTMLElement>(null)
  const { couple, couplePhotos } = eventDetails

  useGSAP(
    () => {
      if (!active || reduced) return
      const q = gsap.utils.selector(section)
      gsap
        .timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: { trigger: q('.cp-pair')[0], start: 'top 78%', toggleActions: 'play none none reverse' },
        })
        .from(q('.cp-frame'), { autoAlpha: 0, y: 70, rotation: (i: number) => (i ? 3 : -3), duration: 1.5, ease: 'expo.out', stagger: 0.2 }, 0)
        .fromTo(q('.cp-photo'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'power3.inOut', stagger: 0.2 }, 0.1)
        .from(q('.cp-photo img'), { scale: 1.2, duration: 2.4, ease: 'power2.out', stagger: 0.2 }, 0.1)
        .from(q('.cp-crest'), { autoAlpha: 0, y: 12, duration: 0.9, stagger: 0.2 }, 0.9)
        .from(q('.cp-amp'), { autoAlpha: 0, scale: 0.4, rotation: -20, duration: 1.2, ease: 'back.out(1.8)' }, 1.0)
        .from(q('.cp-label'), { autoAlpha: 0, y: 14, duration: 0.9, stagger: 0.08 }, 1.1)
    },
    { dependencies: [active, reduced], scope: section },
  )

  return (
    <section
      ref={section}
      id="couple"
      data-dim="0.45"
      aria-label={`${couplePhotos.bride.label} and ${couplePhotos.groom.label}`}
      className="relative flex min-h-[100svh] items-center justify-center px-4 py-24 sm:px-6"
    >
      <div
        className="cp-pair relative mx-auto grid w-full max-w-[660px] grid-cols-2 pt-6"
        style={{ columnGap: GAP, containerType: 'inline-size' }}
      >
        <Portrait
          src={couplePhotos.bride.src}
          label={couplePhotos.bride.label}
          first={couple.partnerOne.first}
          last={couple.partnerOne.last}
          full={couple.partnerOne.full}
          initial={couple.monogram.left}
        />
        <Portrait
          src={couplePhotos.groom.src}
          label={couplePhotos.groom.label}
          first={couple.partnerTwo.first}
          last={couple.partnerTwo.last}
          full={couple.partnerTwo.full}
          initial={couple.monogram.right}
        />
        {/* the "&", centred between the two frames */}
        <span
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ top: `calc(1.5rem + (100cqw - ${GAP}) / 2 * 0.6667 - 2px)` }}
          aria-hidden="true"
        >
          <span className="cp-amp block font-display text-[clamp(2.2rem,1.6rem+2.6vw,3.6rem)] italic leading-none text-gold-soft text-glow">&amp;</span>
        </span>
      </div>
    </section>
  )
}