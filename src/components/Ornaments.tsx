import { useId, type CSSProperties } from 'react'

/** SVG-safe unique id (React ids contain characters that break url(#…) references) */
export function useSvgId(prefix = 'o') {
  return prefix + useId().replace(/[^a-zA-Z0-9_-]/g, '')
}

/** Shared metallic-gold gradient so every ornament reads as the same foil */
export function GoldGradient({ id, dark = false }: { id: string; dark?: boolean }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      {dark ? (
        <>
          <stop offset="0" stopColor="#8a6428" />
          <stop offset=".35" stopColor="#c49a50" />
          <stop offset=".55" stopColor="#7a5520" />
          <stop offset=".8" stopColor="#b58b42" />
          <stop offset="1" stopColor="#6e4c1b" />
        </>
      ) : (
        <>
          <stop offset="0" stopColor="#f7e3b0" />
          <stop offset=".3" stopColor="#c8a45d" />
          <stop offset=".55" stopColor="#8f6a30" />
          <stop offset=".78" stopColor="#e8cf95" />
          <stop offset="1" stopColor="#a98243" />
        </>
      )}
    </linearGradient>
  )
}

/** Lotus-and-diamond divider with tapering hairlines */
export function OrnamentalDivider({
  className = '',
  dark = false,
  width = 260,
  style,
}: {
  className?: string
  dark?: boolean
  width?: number
  style?: CSSProperties
}) {
  const id = useSvgId()
  const g = `url(#${id}g)`
  return (
    <svg
      className={className}
      style={style}
      width={width}
      viewBox="0 0 260 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <GoldGradient id={`${id}g`} dark={dark} />
        <linearGradient id={`${id}l`} x1="0" x2="1">
          <stop offset="0" stopColor={dark ? '#8a6428' : '#c8a45d'} stopOpacity="0" />
          <stop offset="1" stopColor={dark ? '#8a6428' : '#e7cf98'} />
        </linearGradient>
      </defs>
      <path d="M8 12 H104" stroke={`url(#${id}l)`} strokeWidth="1" pathLength={1} />
      <path d="M252 12 H156" stroke={`url(#${id}l)`} strokeWidth="1" pathLength={1} />
      <circle cx="110" cy="12" r="1.6" fill={g} />
      <circle cx="150" cy="12" r="1.6" fill={g} />
      {/* lotus */}
      <path
        d="M130 3 C134 7 135 10 130 17 C125 10 126 7 130 3 Z M130 17 C136 12 141 11 146 12 C141 15 136 17 130 17 Z M130 17 C124 12 119 11 114 12 C119 15 124 17 130 17 Z"
        fill={g}
      />
      <path d="M118 20 H142" stroke={g} strokeWidth=".8" />
    </svg>
  )
}

/** Corner flourish for the invitation's foil border (drawn for the top-left; rotate for others) */
export function CornerOrnament({ className = '', style, gradientId }: { className?: string; style?: CSSProperties; gradientId: string }) {
  const s = `url(#${gradientId})`
  return (
    <svg className={className} style={style} viewBox="0 0 120 120" fill="none" aria-hidden="true" focusable="false">
      <path d="M6 118 V34 Q6 6 34 6 H118" stroke={s} strokeWidth="1.6" pathLength={1} />
      <path d="M15 118 V40 Q15 15 40 15 H118" stroke={s} strokeWidth=".8" pathLength={1} />
      {/* curling vine */}
      <path d="M24 70 C24 44 44 24 70 24" stroke={s} strokeWidth="1" pathLength={1} />
      <path d="M24 70 C30 64 30 56 24 52 M70 24 C64 30 56 30 52 24" stroke={s} strokeWidth=".9" pathLength={1} />
      {/* lotus bud in the corner */}
      <path
        d="M30 30 C34 22 42 20 46 22 C44 30 38 34 30 30 Z M30 30 C22 34 20 42 22 46 C30 44 34 38 30 30 Z M30 30 C25 24 25 18 28 14 C33 18 33 24 30 30 Z M30 30 C24 25 18 25 14 28 C18 33 24 33 30 30 Z"
        fill={s}
        opacity=".95"
      />
      <circle cx="30" cy="30" r="2.6" fill="#f6eedf" stroke={s} strokeWidth=".8" />
      <circle cx="86" cy="15" r="1.4" fill={s} />
      <circle cx="98" cy="15" r="1" fill={s} />
      <circle cx="15" cy="86" r="1.4" fill={s} />
      <circle cx="15" cy="98" r="1" fill={s} />
    </svg>
  )
}

/** Small kalasha (sacred pot) crest used above headings */
export function KalashaCrest({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  const id = useSvgId()
  const g = `url(#${id}g)`
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <GoldGradient id={`${id}g`} dark={dark} />
      </defs>
      {/* mango leaves */}
      <path d="M32 20 C26 14 20 12 14 13 C18 18 24 21 32 20 Z" fill={g} />
      <path d="M32 20 C38 14 44 12 50 13 C46 18 40 21 32 20 Z" fill={g} />
      <path d="M32 19 C29 12 29 8 32 4 C35 8 35 12 32 19 Z" fill={g} />
      {/* coconut */}
      <ellipse cx="32" cy="18" rx="5.5" ry="6" fill={g} />
      {/* pot */}
      <path d="M24 26 H40 L38 29 C46 33 47 44 41 50 C37 54 27 54 23 50 C17 44 18 33 26 29 Z" fill={g} />
      <path d="M22 40 H42" stroke={dark ? '#f4ead6' : '#3d141d'} strokeWidth="1" opacity=".55" />
      <path d="M26 56 H38" stroke={g} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
