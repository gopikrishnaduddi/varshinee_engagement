import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef } from 'react'
import { eventDetails } from '../data/eventDetails.ts'

/** Scene 5: an interlude — the interlocking rings float in the mandapam while three lines appear */
export function GoldenRings({ active, reduced }: { active: boolean; reduced: boolean }) {
  const section = useRef<HTMLElement>(null)
  const [one, two, three] = eventDetails.wording.rings

  useGSAP(
    () => {
      if (!active || reduced) return
      const q = gsap.utils.selector(section)
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section.current, start: 'top 55%', end: '55% 50%', scrub: 0.9 },
      })
      tl.from(q('.rl-1'), { autoAlpha: 0, y: 30, filter: 'blur(10px)', duration: 0.5, ease: 'power2.out' }, 0)
        .from(q('.rl-2'), { autoAlpha: 0, y: 26, filter: 'blur(10px)', duration: 0.5, ease: 'power2.out' }, 0.35)
        .from(q('.rl-3'), { autoAlpha: 0, letterSpacing: '0.75em', duration: 0.6, ease: 'power2.out' }, 0.65)
        .from(q('.rl-rule'), { scaleX: 0, duration: 0.5 }, 0.7)
      gsap.to(q('.rings-copy'), {
        autoAlpha: 0,
        ease: 'power1.in',
        scrollTrigger: { trigger: section.current, start: '82% 60%', end: 'bottom 35%', scrub: 0.6 },
      })
    },
    { dependencies: [active, reduced], scope: section },
  )

  return (
    <section ref={section} id="rings" data-dim="0.12" aria-label="Two hearts, one beautiful beginning" className="relative h-[210svh]">
      <div data-cam="ringsA" className="pointer-events-none absolute left-0 top-[25%] h-px w-px" aria-hidden="true" />
      <div data-cam="ringsB" className="pointer-events-none absolute left-0 top-[70%] h-px w-px" aria-hidden="true" />
      <div className="rings-copy sticky top-0 flex h-[100svh] flex-col items-center justify-between px-6 pb-[11svh] pt-[13svh] text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'linear-gradient(180deg, rgba(22,12,11,0.7) 0%, rgba(22,12,11,0) 32%, rgba(22,12,11,0) 62%, rgba(22,12,11,0.75) 100%)' }}
          aria-hidden="true"
        />
        <p className="rl-1 font-display text-[clamp(2.4rem,1.8rem+3vw,4.2rem)] font-light italic leading-none text-ivory text-glow">{one}</p>
        <div>
          <p className="rl-2 font-display text-[clamp(1.7rem,1.3rem+2.2vw,3rem)] italic leading-tight text-ivory text-glow">{two}</p>
          <span className="rl-rule mx-auto my-5 block h-px w-28 bg-gradient-to-r from-transparent via-gold to-transparent" aria-hidden="true" />
          <p className="rl-3 font-ceremonial text-[clamp(0.85rem,0.75rem+0.6vw,1.15rem)] font-semibold tracking-[0.42em] text-gold-soft text-glow">
            {three.toUpperCase()}
          </p>
        </div>
      </div>
    </section>
  )
}
