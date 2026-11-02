import { eventDetails } from '../data/eventDetails.ts'
import { GoldGradient, useSvgId } from './Ornaments.tsx'

const RING_TEXT = `${eventDetails.couple.partnerOne.first.toUpperCase()} ✦ ${eventDetails.couple.partnerTwo.first.toUpperCase()} ✦ ${eventDetails.date.dotted} ✦ `

/** The royal seal: an enamel medallion with the V & D monogram */
function SealArt({ clip }: { clip?: 'left' | 'right' }) {
  const id = useSvgId('seal')
  const gold = `url(#${id}g)`
  const beads = Array.from({ length: 56 }, (_, i) => {
    const a = (i / 56) * Math.PI * 2
    return <circle key={i} cx={120 + Math.cos(a) * 114} cy={120 + Math.sin(a) * 114} r={1.7} fill={gold} />
  })
  const guilloche = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2
    return (
      <circle
        key={i}
        cx={120 + Math.cos(a) * 24}
        cy={120 + Math.sin(a) * 24}
        r={50}
        fill="none"
        stroke="#e7cf98"
        strokeOpacity={0.075}
        strokeWidth={0.7}
      />
    )
  })
  return (
    <svg viewBox="0 0 240 240" className="block h-full w-full overflow-visible" aria-hidden="true" focusable="false">
      <defs>
        <GoldGradient id={`${id}g`} />
        <radialGradient id={`${id}e`} cx=".42" cy=".36" r=".72">
          <stop offset="0" stopColor="#82303f" />
          <stop offset=".62" stopColor="#591F2B" />
          <stop offset="1" stopColor="#33101a" />
        </radialGradient>
        <radialGradient id={`${id}s`} cx=".5" cy=".5" r=".5">
          <stop offset=".7" stopColor="#000" stopOpacity=".55" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <path id={`${id}p`} d="M 120,120 m -95,0 a 95,95 0 1,1 190,0 a 95,95 0 1,1 -190,0" />
        {clip && (
          <clipPath id={`${id}c`}>
            <rect x={clip === 'left' ? -20 : 120} y={-20} width={140} height={280} />
          </clipPath>
        )}
      </defs>
      <g clipPath={clip ? `url(#${id}c)` : undefined}>
        <circle cx="120" cy="124" r="122" fill={`url(#${id}s)`} />
        <circle cx="120" cy="120" r="109" fill="#2b1513" />
        {beads}
        <circle cx="120" cy="120" r="108" fill="none" stroke={gold} strokeWidth="3" />
        <circle cx="120" cy="120" r="103.5" fill="none" stroke={gold} strokeWidth=".6" opacity=".8" />
        <text
          fill={gold}
          fontFamily="Cinzel, Georgia, serif"
          fontSize="11.5"
          fontWeight={600}
          letterSpacing="2.6"
        >
          <textPath href={`#${id}p`} startOffset="0" textLength="588" lengthAdjust="spacing">
            {RING_TEXT}
          </textPath>
        </text>
        <circle cx="120" cy="120" r="85" fill="none" stroke={gold} strokeWidth="1.6" />
        <circle cx="120" cy="120" r="80.5" fill={`url(#${id}e)`} />
        <g>{guilloche}</g>
        <circle cx="120" cy="120" r="80.5" fill="none" stroke={gold} strokeWidth=".7" opacity=".7" />
        {/* lotus crest */}
        <path
          d="M120 58 C124 63 125 67 120 74 C115 67 116 63 120 58 Z M120 74 C126 69 131 68 136 69 C131 73 126 74 120 74 Z M120 74 C114 69 109 68 104 69 C109 73 114 74 120 74 Z"
          fill={gold}
        />
        <text x="86" y="146" textAnchor="middle" fill={gold} fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic" fontWeight={500} fontSize="66">
          {eventDetails.couple.monogram.left}
        </text>
        <text x="154" y="146" textAnchor="middle" fill={gold} fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic" fontWeight={500} fontSize="66">
          {eventDetails.couple.monogram.right}
        </text>
        <text x="120" y="134" textAnchor="middle" fill="#efd9b0" fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic" fontSize="24">
          &amp;
        </text>
        <path d="M100 166 H140" stroke={gold} strokeWidth=".9" />
        <circle cx="120" cy="166" r="2.2" fill={gold} />
      </g>
    </svg>
  )
}

export function Monogram({ split = false, className = '' }: { split?: boolean; className?: string }) {
  if (!split) {
    return (
      <div className={className}>
        <SealArt />
      </div>
    )
  }
  return (
    <div className={`relative ${className}`}>
      <div className="seal-left absolute inset-0">
        <SealArt clip="left" />
      </div>
      <div className="seal-right absolute inset-0">
        <SealArt clip="right" />
      </div>
    </div>
  )
}
