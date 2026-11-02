import { eventDetails } from '../data/eventDetails.ts'
import { GoldGradient, useSvgId } from './Ornaments.tsx'

/** A calligrapher's swash, drawn with a single continuous stroke */
function Swash({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  const id = useSvgId('sw')
  return (
    <svg
      className={`draw ${className}`}
      viewBox="0 0 400 56"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={flip ? { transform: 'scale(-1,-1)' } : undefined}
    >
      <defs>
        <GoldGradient id={`${id}g`} dark />
      </defs>
      <path
        d="M14 34 C 64 48, 116 48, 160 34 S 232 10, 258 22 C 274 30, 264 44, 250 38 C 236 32, 252 16, 288 20 S 352 38, 388 26"
        stroke={`url(#${id}g)`}
        strokeWidth="1.5"
        strokeLinecap="round"
        pathLength={1}
      />
      <path d="M150 40 C 170 44, 190 42, 206 36" stroke={`url(#${id}g)`} strokeWidth=".8" strokeLinecap="round" pathLength={1} />
      <circle cx="388" cy="26" r="2" fill={`url(#${id}g)`} className="swash-dot" />
    </svg>
  )
}

/**
 * The couple's names — the typographic heart of the invitation.
 * Real, selectable heading text; the gold is a text gradient, not an image.
 */
export function CoupleNames({ tone = 'ink' }: { tone?: 'ink' | 'gold' }) {
  const { partnerOne, partnerTwo } = eventDetails.couple
  const nameClass = tone === 'ink' ? 'gold-ink' : 'gold-text'
  return (
    <h2 className="couple-names relative mx-auto flex flex-col items-center" id="couple-names" tabIndex={-1}>
      <span className="name-block relative block">
        <span className={`name-first block font-display italic font-normal leading-[0.92] ${nameClass}`}>{partnerOne.first}</span>
        <span className="name-last mt-2 block font-ceremonial uppercase text-maroon">{partnerOne.last}</span>
      </span>
      <Swash className="swash-a -mt-1 w-[min(78%,330px)]" />
      <span className="amp-row my-1 flex items-center gap-4" >
        <span className="amp-line block h-px w-[clamp(36px,12cqi,90px)] bg-gradient-to-r from-transparent to-brass" aria-hidden="true" />
        <span className={`amp font-display italic leading-none ${nameClass}`}>&amp;</span>
        <span className="amp-line block h-px w-[clamp(36px,12cqi,90px)] bg-gradient-to-l from-transparent to-brass" aria-hidden="true" />
      </span>
      <Swash className="swash-b mb-1 w-[min(78%,330px)]" flip />
      <span className="name-block relative block">
        <span className={`name-first block font-display italic font-normal leading-[0.92] ${nameClass}`}>{partnerTwo.first}</span>
        <span className="name-last mt-2 block font-ceremonial uppercase text-maroon">{partnerTwo.last}</span>
      </span>
    </h2>
  )
}
