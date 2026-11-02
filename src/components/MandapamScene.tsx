import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'
import { eventDetails } from '../data/eventDetails.ts'
import { OrnamentalDivider } from './Ornaments.tsx'

gsap.registerPlugin(ScrollTrigger)

/** Scene 3: the camera walks the pillared aisle while the words of the blessing surface */
export function MandapamScene({ active, reduced }: { active: boolean; reduced: boolean }) {
  const section = useRef<HTMLElement>(null)
  const words = eventDetails.wording.journey.split(' ')

  useGSAP(
    () => {
      if (!active || reduced) return
      const q = gsap.utils.selector(section)
      const tl = gsap.timeline({
        scrollTrigger: { trigger: section.current, start: 'top 70%', end: '62% 50%', scrub: 0.8 },
      })
      tl.from(q('.mq-eyebrow'), { autoAlpha: 0, y: 16, letterSpacing: '0.6em', duration: 0.4 }, 0)
        .from(q('.mq-word'), { autoAlpha: 0.06, y: 18, filter: 'blur(8px)', duration: 0.35, stagger: 0.07, ease: 'power2.out' }, 0.2)
        .from(q('.mq-divider'), { autoAlpha: 0, scaleX: 0.4, duration: 0.4 }, '>-0.2')
      gsap.to(q('.mq-inner'), {
        autoAlpha: 0,
        y: -30,
        ease: 'power1.in',
        scrollTrigger: { trigger: section.current, start: '80% 60%', end: 'bottom 30%', scrub: 0.6 },
      })
    },
    { dependencies: [active, reduced], scope: section },
  )

  return (
    <section ref={section} id="mandapam" data-dim="0.32" aria-label="The sacred mandapam" className="relative h-[240svh]">
      <div data-cam="corridorA" className="pointer-events-none absolute left-0 top-[8%] h-px w-px" aria-hidden="true" />
      <div data-cam="corridorB" className="pointer-events-none absolute left-0 top-[46%] h-px w-px" aria-hidden="true" />
      <div data-cam="corridorC" className="pointer-events-none absolute left-0 top-[84%] h-px w-px" aria-hidden="true" />
      <div className="sticky top-0 flex h-[100svh] items-center justify-center px-6">
        <div className="mq-inner relative max-w-[min(92vw,840px)] text-center">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(24,12,10,0.72), rgba(24,12,10,0))' }}
            aria-hidden="true"
          />
          <p className="mq-eyebrow eyebrow mb-7 text-[0.78rem] text-gold-soft text-glow sm:text-[0.86rem]">{eventDetails.wording.concept}</p>
          <blockquote>
            <p className="font-display text-[clamp(1.85rem,1.2rem+3.4vw,3.6rem)] font-light italic leading-[1.18] text-ivory text-glow">
              <span className="sr-only">{eventDetails.wording.journey}</span>
              <span aria-hidden="true">
                {words.map((w, i) => (
                  <span key={i} className={`mq-word inline-block whitespace-pre ${/^(love|togetherness|forever)/i.test(w) ? 'gold-text' : ''}`}>
                    {w}
                    {i < words.length - 1 ? ' ' : ''}
                  </span>
                ))}
              </span>
            </p>
          </blockquote>
          <OrnamentalDivider className="mq-divider mx-auto mt-8" width={200} />
        </div>
      </div>
    </section>
  )
}
