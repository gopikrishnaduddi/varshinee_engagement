import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Navigation } from 'lucide-react'
import { useRef } from 'react'
import { eventDetails } from '../data/eventDetails.ts'
import { Monogram } from './Monogram.tsx'
import { OrnamentalDivider } from './Ornaments.tsx'
import { ShareButton } from './ShareButton.tsx'

/** Scene 7: the lamp-lit courtyard at twilight, and a heartfelt farewell */
export function FinalBlessings({ active, reduced }: { active: boolean; reduced: boolean }) {
  const section = useRef<HTMLElement>(null)
  const e = eventDetails

  useGSAP(
    () => {
      if (!active || reduced) return
      const q = gsap.utils.selector(section)
      gsap
        .timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: { trigger: section.current, start: 'top 62%', toggleActions: 'play none none reverse' },
        })
        .from(q('.fb-seal'), { autoAlpha: 0, scale: 0.8, rotate: -25, duration: 1.6, ease: 'expo.out' }, 0)
        .from(q('.fb-name'), { autoAlpha: 0, y: 26, filter: 'blur(12px)', duration: 1.6, stagger: 0.3, ease: 'expo.out' }, 0.25)
        .from(q('.fb-amp'), { autoAlpha: 0, scale: 0.6, duration: 1.2, ease: 'back.out(1.5)' }, 0.55)
        .from(q('.fb-stagger'), { autoAlpha: 0, y: 14, duration: 1.1, stagger: 0.15 }, 1.0)
        .add(() => q('.fb-name').forEach((n) => n.classList.add('sheen')), 0.6)
    },
    { dependencies: [active, reduced], scope: section },
  )

  return (
    <section
      ref={section}
      id="blessings"
      data-dim="0.5"
      aria-labelledby="blessings-heading"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 pb-[max(env(safe-area-inset-bottom),3rem)] pt-28 text-center"
    >
      <div data-cam="finale" className="pointer-events-none absolute bottom-0 left-0 h-px w-px" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[10%] -z-10"
        style={{ background: 'radial-gradient(75% 60% at 50% 50%, rgba(22,12,12,0.7), rgba(22,12,12,0) 78%)' }}
        aria-hidden="true"
      />
      <Monogram className="fb-seal mb-8 h-[92px] w-[92px] sm:h-[108px] sm:w-[108px]" />
      <h2 id="blessings-heading" className="font-display font-light italic leading-[0.95]">
        <span className="fb-name gold-text block text-[clamp(3.2rem,2rem+7vw,6.6rem)]">{e.couple.partnerOne.first}</span>
        <span className="fb-amp gold-text my-1 block text-[clamp(2rem,1.4rem+3vw,3.4rem)]">&amp;</span>
        <span className="fb-name gold-text block text-[clamp(3.2rem,2rem+7vw,6.6rem)]">{e.couple.partnerTwo.first}</span>
      </h2>
      <OrnamentalDivider className="fb-stagger mx-auto mt-8" width={220} />
      <p className="fb-stagger mx-auto mt-7 max-w-[30ch] font-display text-[clamp(1.35rem,1.15rem+1vw,1.8rem)] italic leading-snug text-ivory text-glow">
        “{e.wording.blessing}”
      </p>
      <p className="fb-stagger eyebrow mt-7 text-gold-soft text-glow">{e.wording.closing}</p>

      <div className="fb-stagger mt-11 flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
        <a className="btn-royal" href={e.venue.mapsUrl} target="_blank" rel="noopener noreferrer">
          <Navigation size={16} strokeWidth={1.8} aria-hidden="true" />
          Get Directions
        </a>
        <ShareButton />
      </div>

      <p className="fb-stagger mt-14 font-ceremonial text-[0.66rem] leading-loose tracking-[0.36em] text-ivory/50">
        <span className="whitespace-nowrap">{e.date.dotted}</span>
        <span className="mx-2 hidden sm:inline">·</span>
        <br className="sm:hidden" />
        <span className="whitespace-nowrap">{e.venue.name.toUpperCase()}</span>
      </p>
    </section>
  )
}
