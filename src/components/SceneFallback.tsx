import { useEffect, useRef } from 'react'
import { GoldGradient, useSvgId } from './Ornaments.tsx'

type Props = {
  /** whether this layer positions the HTML seal (true while the 3D world is not running) */
  ownsSeal: boolean
  inside: boolean
  reduced: boolean
}

const PETALS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 61) % 100,
  delay: -((i * 1.7) % 14),
  dur: 11 + ((i * 3.3) % 8),
  size: 9 + ((i * 5) % 8),
  hue: ['#fbf5e8', '#d7a5a0', '#f6eedf', '#e8962e', '#c98a86', '#fffaf2'][i % 6],
}))

/**
 * The lightweight, non-WebGL temple: an illustrated gate whose doors still open in CSS 3D,
 * then a lamp-lit courtyard backdrop. Also shown while the 3D world is still loading.
 */
export function SceneFallback({ ownsSeal, inside, reduced }: Props) {
  const doorway = useRef<HTMLDivElement>(null)
  const id = useSvgId('fb')
  const g = `url(#${id}g)`

  useEffect(() => {
    if (!ownsSeal) return
    const place = () => {
      const r = doorway.current?.getBoundingClientRect()
      if (!r) return
      const root = document.documentElement.style
      root.setProperty('--seal-x', `${r.left + r.width / 2}px`)
      root.setProperty('--seal-y', `${r.top + r.height * 0.36}px`)
      root.setProperty('--door-half', `${r.width / 2}px`)
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(document.documentElement)
    window.addEventListener('resize', place)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', place)
    }
  }, [ownsSeal])

  return (
    <div
      className="fb-scene absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{ ['--fb-h' as string]: 'min(70svh, 125vw)', ['--fb-ground' as string]: '26%' }}
    >
      {/* sky at golden hour */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 45% at 72% 62%, rgba(255,214,150,0.85), rgba(255,170,95,0.35) 45%, rgba(255,150,80,0) 75%), linear-gradient(180deg, #4a2530 0%, #8a4242 32%, #d98b5c 58%, #f1b878 70%, #6a3a30 71%, #2a1714 100%)',
        }}
      />
      {/* distant rajagopuram silhouette */}
      <svg className="absolute bottom-[36%] left-1/2 h-[46%] -translate-x-[8%] opacity-35" viewBox="0 0 200 300" preserveAspectRatio="xMidYMax meet">
        <path d="M30 300 V200 H170 V300 Z M40 200 L48 170 H152 L160 200 Z M52 170 L60 140 H140 L148 170 Z M64 140 L72 112 H128 L136 140 Z M76 112 L83 86 H117 L124 112 Z M86 86 L92 62 H108 L114 86 Z M88 62 Q100 40 112 62 Z M99 40 V30" fill="#3b1d1f" />
      </svg>
      {/* courtyard walls running off to either side, standing on the paved ground */}
      <div
        className="absolute inset-x-0"
        style={{ bottom: 'var(--fb-ground)', height: 'calc(var(--fb-h) * 0.274)', background: 'linear-gradient(180deg, #7a5137 0%, #5e3c2a 70%, #3a2418 100%)' }}
      >
        <div className="absolute inset-x-0 top-0 h-[6px]" style={{ background: '#a77d55' }} />
        <div className="absolute inset-x-0 top-[34%] h-[3px]" style={{ background: 'rgba(40,20,10,.35)' }} />
        <div className="absolute inset-x-0 bottom-[8%] h-[8%]" style={{ background: 'rgba(40,20,10,.4)' }} />
      </div>
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: 'var(--fb-ground)',
          background:
            'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 74px, rgba(30,16,10,.35) 74px 76px), linear-gradient(180deg, #6a4630 0%, #3d2618 55%, #241A18 100%)',
        }}
      />

      {/* the gate */}
      <div
        className="fb-gate absolute left-1/2 -translate-x-1/2 transition-opacity duration-1000"
        style={{ bottom: 'calc(var(--fb-ground) - var(--fb-h) * 0.049)', height: 'var(--fb-h)', aspectRatio: '600 / 700', opacity: inside ? 0 : 1 }}
      >
        <svg viewBox="0 0 600 700" className="absolute inset-0 h-full w-full">
          <defs>
            <GoldGradient id={`${id}g`} />
            <linearGradient id={`${id}s`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#d9b689" />
              <stop offset="1" stopColor="#9c7350" />
            </linearGradient>
            <linearGradient id={`${id}p`} x1="0" x2="1">
              <stop offset="0" stopColor="#8f6646" />
              <stop offset=".45" stopColor="#d8b68a" />
              <stop offset="1" stopColor="#87603f" />
            </linearGradient>
          </defs>
          {/* platform and step */}
          <rect x="140" y="652" width="320" height="14" fill="#a07a56" />
          <rect x="132" y="662" width="336" height="10" fill="#8a6446" />
          {/* tower body */}
          <rect x="180" y="390" width="240" height="262" fill={`url(#${id}s)`} />
          <rect x="228" y="444" width="144" height="208" fill="#6b4630" />
          <rect x="222" y="440" width="156" height="10" fill="#e1c393" />
          {/* crown tiers with niches */}
          {[
            [172, 355, 256, 35],
            [198, 318, 204, 31],
            [222, 288, 156, 24],
          ].map(([x, y, w, h], i) => (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} fill={`url(#${id}s)`} />
              {Array.from({ length: Math.floor(w / 26) }, (_, k) => (
                <path
                  key={k}
                  d={`M${x + 8 + k * 26} ${y + h - 4} v-${h * 0.45} q7 -${h * 0.38} 14 0 v${h * 0.45} z`}
                  fill="#5b3826"
                />
              ))}
              <rect x={x - 10} y={y - 6} width={w + 20} height={6} fill="#e3c697" />
            </g>
          ))}
          <path d="M232 288 V276 Q300 236 368 276 V288 Z" fill="#c9a274" />
          {[252, 276, 300, 324, 348].map((x) => (
            <path key={x} d={`M${x - 6} 270 q6 -12 12 0 q-2 -10 -6 -18 q-4 8 -6 18 z`} fill={g} />
          ))}
          {/* projecting cornice */}
          <rect x="152" y="392" width="296" height="12" fill="#e3c697" />
          {/* monumental pillars */}
          {[208, 392].map((cx) => (
            <g key={cx}>
              <rect x={cx - 22} y="404" width="44" height="248" fill={`url(#${id}p)`} />
              <rect x={cx - 26} y="626" width="52" height="26" fill="#b48c63" />
              <rect x={cx - 25} y="530" width="50" height="34" fill="#c49d70" />
              <ellipse cx={cx} cy="436" rx="20" ry="11" fill="#c9a274" />
              <rect x={cx - 30} y="404" width="60" height="9" fill="#d8b68a" />
            </g>
          ))}
          {/* garland swag and strands */}
          <path d="M208 414 Q300 470 392 414" stroke="#ee8f26" strokeWidth="10" strokeLinecap="round" strokeDasharray="0 9" fill="none" />
          <path d="M208 420 Q300 476 392 420" stroke="#fbf5e8" strokeWidth="5" strokeLinecap="round" strokeDasharray="0 7" fill="none" />
          {[192, 224, 376, 408].map((x) => (
            <path key={x} d={`M${x} 416 V600`} stroke={x % 2 ? '#f4c22c' : '#ee8f26'} strokeWidth="7" strokeLinecap="round" strokeDasharray="0 8" />
          ))}
          {/* lamp stands */}
          {[168, 432].map((x) => (
            <g key={x}>
              <path d={`M${x - 14} 652 Q${x} 636 ${x + 14} 652 Z M${x - 2} 640 V600 H${x + 2} V640 Z M${x - 13} 598 Q${x} 606 ${x + 13} 598 L${x + 11} 594 H${x - 11} Z`} fill={g} />
            </g>
          ))}
        </svg>
        {/* lamp flames */}
        {[168, 432].map((x) => (
          <span
            key={x}
            className={`fb-flame absolute block rounded-full ${reduced ? '' : 'animate-[flicker_2.4s_ease-in-out_infinite]'}`}
            style={{
              left: `${(x / 600) * 100}%`,
              top: `${(588 / 700) * 100}%`,
              width: '4.2%',
              aspectRatio: '1',
              transform: 'translate(-50%,-50%)',
              background: 'radial-gradient(circle, #fff6dc 0%, #ffcf7a 30%, rgba(255,150,60,.45) 55%, rgba(255,120,40,0) 75%)',
            }}
          />
        ))}
        {/* the doorway: warm light waiting behind two brass leaves */}
        <div
          ref={doorway}
          className="fb-doorway absolute"
          style={{ left: `${(236 / 600) * 100}%`, width: `${(128 / 600) * 100}%`, top: `${(452 / 700) * 100}%`, height: `${(200 / 700) * 100}%`, perspective: '900px' }}
        >
          <div className="fb-light absolute inset-0" style={{ background: 'radial-gradient(70% 60% at 50% 55%, #fff6dc, #ffc97a 45%, #e98f45 100%)' }} />
          {(['l', 'r'] as const).map((s) => (
            <div
              key={s}
              className={`fb-door-${s} absolute top-0 h-full w-1/2`}
              style={{
                [s === 'l' ? 'left' : 'right']: 0,
                transformOrigin: s === 'l' ? 'left center' : 'right center',
                background:
                  'radial-gradient(circle at 50% 50%, #f1d697 0 2.2px, transparent 2.6px) 0 0 / 50% 14.3%, linear-gradient(90deg, #8f6a30, #d6b46d 30%, #f0d796 50%, #c49a52 70%, #7d5a26)',
                boxShadow: 'inset 0 0 0 3px rgba(110,79,34,.9), inset 0 0 0 6px rgba(226,194,122,.6)',
              }}
            />
          ))}
        </div>
      </div>

      {/* inside the courtyard: lamp bokeh and drifting petals */}
      <div className="absolute inset-0 transition-opacity duration-[1600ms]" style={{ opacity: inside ? 1 : 0 }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(40% 28% at 50% 70%, rgba(255,180,90,0.35), transparent 70%), linear-gradient(180deg, #2a1420 0%, #5a2a33 38%, #a1564a 64%, #3a2018 66%, #1c110f 100%)',
          }}
        />
        {Array.from({ length: 22 }, (_, i) => (
          <span
            key={i}
            className="absolute block rounded-full"
            style={{
              left: `${8 + ((i * 41) % 84)}%`,
              top: `${66 + ((i * 7) % 24)}%`,
              width: `${10 + ((i * 13) % 26)}px`,
              aspectRatio: '1',
              background: 'radial-gradient(circle, rgba(255,214,150,.95), rgba(255,160,70,.35) 45%, rgba(255,140,50,0) 70%)',
              opacity: 0.5 + ((i * 17) % 50) / 100,
            }}
          />
        ))}
      </div>
      {!reduced &&
        PETALS.map((p, i) => (
          <span
            key={i}
            className="fb-petal absolute top-0 block"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 1.3,
              background: p.hue,
              borderRadius: '50% 50% 50% 0 / 60% 60% 40% 0',
              animation: `petal-fall ${p.dur}s linear ${p.delay}s infinite`,
              opacity: 0.85,
            }}
          />
        ))}
    </div>
  )
}
