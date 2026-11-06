import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ChevronDown } from 'lucide-react'
import { useRef } from 'react'
import { eventDetails } from '../data/eventDetails.ts'
import { CoupleNames } from './CoupleNames.tsx'
import { CornerOrnament, GoldGradient, KalashaCrest, OrnamentalDivider, useSvgId } from './Ornaments.tsx'

type Props = { revealing: boolean; reduced: boolean; onRevealed?: () => void }

/** Scene 2: the royal invitation, unfolding on antique parchment */
export function InvitationReveal({ revealing, reduced, onRevealed }: Props) {
  const section = useRef<HTMLElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const gid = useSvgId('frame')
  const e = eventDetails

  useGSAP(
    () => {
      if (!revealing) return
      const q = gsap.utils.selector(section)
      if (reduced) {
        gsap.set(section.current, { autoAlpha: 1 })
        gsap.set(q('.draw path'), { strokeDashoffset: 0 })
        onRevealed?.()
        return
      }
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: onRevealed })
      tl.set(section.current, { autoAlpha: 1 })
        .from(card.current, { autoAlpha: 0, y: 60, scale: 0.94, rotationX: 10, duration: 1.6, ease: 'expo.out' }, 0)
        .from(q('.frame-line'), { scaleX: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.08 }, 0.2)
        .from(q('.frame-line-v'), { scaleY: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.08 }, 0.2)
        .to(q('.corner path'), { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.02 }, 0.3)
        .from(q('.corner'), { autoAlpha: 0, duration: 1.2, stagger: 0.08 }, 0.3)
        .from(q('.crest'), { autoAlpha: 0, y: 10, scale: 0.8, duration: 1 }, 0.6)
        .from(q('.inv-hosts > span'), { autoAlpha: 0, y: 10, duration: 1.1, stagger: 0.22 }, 0.75)
        .from(q('.inv-invite > span'), { autoAlpha: 0, y: 14, duration: 1.1, stagger: 0.32 }, 1.35)
        // names arrive as if written by hand, left to right
        .fromTo(
          q('.name-first')[0],
          { clipPath: 'inset(-20% 100% -20% 0)', autoAlpha: 1 },
          { clipPath: 'inset(-20% -10% -20% 0)', duration: 1.9, ease: 'power2.inOut' },
          2.15,
        )
        .addLabel('swashA', 2.9)
        .to(q('.swash-a path'), { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', stagger: 0.25 }, 'swashA')
        .from(q('.name-last')[0], { autoAlpha: 0, y: 8, letterSpacing: '0.7em', duration: 1.3, ease: 'power2.out' }, 2.9)
        .from(q('.amp-line'), { scaleX: 0, duration: 1.1, ease: 'power2.inOut' }, 3.5)
        .from(q('.amp'), { autoAlpha: 0, scale: 0.6, rotate: -12, duration: 1.3, ease: 'back.out(1.6)' }, 3.55)
        .to(q('.swash-b path'), { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', stagger: 0.25 }, 3.8)
        .fromTo(
          q('.name-first')[1],
          { clipPath: 'inset(-20% 100% -20% 0)', autoAlpha: 1 },
          { clipPath: 'inset(-20% -10% -20% 0)', duration: 1.9, ease: 'power2.inOut' },
          4.0,
        )
        .from(q('.name-last')[1], { autoAlpha: 0, y: 8, letterSpacing: '0.7em', duration: 1.3, ease: 'power2.out' }, 4.75)
        .from(q('.swash-dot'), { autoAlpha: 0, duration: 0.6 }, 4.5)
        .from(q('.inv-detail'), { autoAlpha: 0, y: 12, duration: 1, stagger: 0.12 }, 5.0)
        .from(q('.scroll-cue'), { autoAlpha: 0, y: -8, duration: 1 }, 5.6)
        .add(() => {
          q('.name-first').forEach((n) => n.classList.add('sheen'))
        }, 2.4)
    },
    { dependencies: [revealing, reduced], scope: section },
  )

  // the card tilts gently toward the pointer — desktop only, never while reading on a phone
  useGSAP(
    () => {
      if (reduced || !revealing || !window.matchMedia('(pointer: fine)').matches) return
      const rx = gsap.quickTo(card.current, 'rotationX', { duration: 1.2, ease: 'power3.out' })
      const ry = gsap.quickTo(card.current, 'rotationY', { duration: 1.2, ease: 'power3.out' })
      const move = (ev: PointerEvent) => {
        const x = ev.clientX / window.innerWidth - 0.5
        const y = ev.clientY / window.innerHeight - 0.5
        rx(-y * 4)
        ry(x * 5)
      }
      window.addEventListener('pointermove', move)
      return () => window.removeEventListener('pointermove', move)
    },
    { dependencies: [revealing, reduced] },
  )

  return (
    <section
      ref={section}
      id="invitation"
      data-dim="0.15"
      aria-label="The invitation"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 pb-16 pt-[max(12svh,72px)] sm:px-6"
      style={{ visibility: revealing ? undefined : 'hidden', perspective: '1400px' }}
    >
      <div data-cam="invite" className="pointer-events-none absolute left-0 top-1/2 h-px w-px" aria-hidden="true" />
      <div
        ref={card}
        className="parchment relative w-full max-w-[620px] rounded-[6px] px-[clamp(1.4rem,6vw,3.6rem)] py-[clamp(2.6rem,8vw,4.4rem)] text-center"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {/* the gold-foil border: hairlines that draw in, with corner flourishes */}
        <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
          <defs>
            <GoldGradient id={gid} dark />
          </defs>
        </svg>
        <div className="pointer-events-none absolute inset-[10px] sm:inset-[14px]" aria-hidden="true">
          <span className="frame-line absolute left-[46px] right-[46px] top-0 h-px origin-center bg-brass/80" />
          <span className="frame-line absolute bottom-0 left-[46px] right-[46px] h-px origin-center bg-brass/80" />
          <span className="frame-line-v absolute bottom-[46px] left-0 top-[46px] w-px origin-center bg-brass/80" />
          <span className="frame-line-v absolute bottom-[46px] right-0 top-[46px] w-px origin-center bg-brass/80" />
          <span className="frame-line absolute left-[54px] right-[54px] top-[8px] h-px origin-center bg-brass/40" />
          <span className="frame-line absolute bottom-[8px] left-[54px] right-[54px] h-px origin-center bg-brass/40" />
          <CornerOrnament gradientId={gid} className="corner draw absolute -left-[3px] -top-[3px] w-[64px] sm:w-[78px]" />
          <CornerOrnament gradientId={gid} className="corner draw absolute -right-[3px] -top-[3px] w-[64px] sm:w-[78px]" style={{ transform: 'scaleX(-1)' }} />
          <CornerOrnament gradientId={gid} className="corner draw absolute -bottom-[3px] -left-[3px] w-[64px] sm:w-[78px]" style={{ transform: 'scaleY(-1)' }} />
          <CornerOrnament gradientId={gid} className="corner draw absolute -bottom-[3px] -right-[3px] w-[64px] sm:w-[78px]" style={{ transform: 'scale(-1,-1)' }} />
        </div>

        <div className="relative" style={{ containerType: 'inline-size' }}>
          <KalashaCrest dark className="crest mx-auto mb-4 h-11 w-11 sm:h-12 sm:w-12" />
          <p className="inv-hosts font-ceremonial text-[clamp(0.95rem,0.86rem+0.45vw,1.18rem)] font-semibold leading-[1.5] tracking-[0.06em] text-maroon">
            <span className="block">{e.hosts.names[0]}</span>
            <span className="block font-display text-[1.3em] font-medium italic leading-[1.1] text-brass">&amp;</span>
            <span className="block">{e.hosts.names[1]}</span>
          </p>
          <p className="inv-invite mt-4 text-balance font-display text-[clamp(1.2rem,1.05rem+0.8vw,1.55rem)] italic leading-snug text-ink">
            <span className="block">{e.hosts.line}</span>
          </p>

          <div className="mt-7 sm:mt-9">
            <CoupleNames />
          </div>

          <OrnamentalDivider dark width={220} className="inv-detail mx-auto mt-8 max-w-full sm:mt-10" />
          <div className="mt-6 space-y-2.5 sm:mt-7">
            <p className="inv-detail font-ceremonial text-[clamp(0.78rem,0.72rem+0.3vw,0.95rem)] font-semibold tracking-[0.22em] text-maroon">
              {e.date.weekday.toUpperCase()} <span className="mx-1.5 text-brass">|</span> {e.date.day} {e.date.month.toUpperCase()} {e.date.year}
            </p>
            <p className="inv-detail font-sans text-[0.98rem] font-medium tracking-[0.06em] text-ink tabular-nums">{e.time.display}</p>
            <p className="inv-detail pt-3 font-ceremonial text-[0.68rem] tracking-[0.36em] text-brass">VENUE</p>
            <p className="inv-detail font-display text-[clamp(1.35rem,1.2rem+0.8vw,1.75rem)] font-medium leading-tight text-ink">{e.venue.name}</p>
            <p className="inv-detail font-display text-[1.1rem] italic text-ink/80">{e.food}</p>
          </div>
        </div>
      </div>

      <a
        href="#mandapam"
        className="scroll-cue mt-10 flex flex-col items-center gap-2 text-ivory/75 transition-colors hover:text-gold-soft"
        aria-label="Continue to the next scene"
      >
        <span className="font-ceremonial text-[0.64rem] tracking-[0.4em]">CONTINUE THE JOURNEY</span>
        <ChevronDown size={18} strokeWidth={1.4} className="cue-bob" aria-hidden="true" />
      </a>
    </section>
  )
}