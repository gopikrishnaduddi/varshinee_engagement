import { useEffect, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const SCENES = [
  { id: 'invitation', label: 'Invitation' },
  { id: 'couple', label: 'The Couple' },
  { id: 'mandapam', label: 'Mandapam' },
  { id: 'date', label: 'The Date' },
  { id: 'rings', label: 'Two Hearts' },
  { id: 'venue', label: 'Venue' },
  { id: 'blessings', label: 'Blessings' },
]

/** A quiet column of lotus points on wide screens — jump straight to any scene */
export function JourneyNav({ visible, onNavigate }: { visible: boolean; onNavigate: (id: string) => void }) {
  const [active, setActive] = useState('invitation')

  useEffect(() => {
    if (!visible) return
    const triggers = SCENES.map((s) =>
      ScrollTrigger.create({
        trigger: `#${s.id}`,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && setActive(s.id),
      }),
    )
    return () => triggers.forEach((t) => t.kill())
  }, [visible])

  return (
    <nav
      aria-label="Scenes"
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 transition-opacity duration-1000 lg:block"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none' }}
    >
      <ol className="flex flex-col items-end gap-4">
        {SCENES.map((s) => {
          const on = active === s.id
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(s.id)
                }}
                aria-current={on ? 'step' : undefined}
                className="group flex items-center gap-3 py-1 text-ivory/60 transition-colors hover:text-gold-soft focus-visible:text-gold-soft"
                tabIndex={visible ? 0 : -1}
              >
                <span className="font-ceremonial text-[0.62rem] tracking-[0.3em] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                  {s.label.toUpperCase()}
                </span>
                <span
                  className="block rotate-45 border border-gold/70 transition-all duration-500"
                  style={{ width: on ? 9 : 6, height: on ? 9 : 6, background: on ? '#e7cf98' : 'transparent' }}
                  aria-hidden="true"
                />
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
