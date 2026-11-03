import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * The opening gate scene as a real video. Put the files in public/video/.
 * `door` is where the golden doors sit inside each video, in that video's own pixels —
 * the V & D seal is placed on the doors from these numbers. If you swap in a different
 * gate video, these four numbers need updating to match its doors.
 */
export const GATE_VIDEO = {
  landscape: {
    src: '/video/gate-landscape.mp4',
    poster: '/video/gate-landscape.jpg',
    width: 1344,
    height: 768,
    door: { centerX: 669, top: 465, bottom: 664, halfWidth: 71 },
  },
  portrait: {
    src: '/video/gate-portrait.mp4',
    poster: '/video/gate-portrait.jpg',
    width: 432,
    height: 768,
    door: { centerX: 213, top: 465, bottom: 664, halfWidth: 71 },
  },
}

/** how far down the doors the seal sits (0 = top edge of the doors, 1 = bottom) */
const SEAL_ON_DOOR = 0.25

export type GateStatus = 'pending' | 'ready' | 'missing'
export type SealSpot = { x: number; y: number; half: number }

type Props = {
  /** fade the gate away (when the light floods through on entering) */
  hidden: boolean
  reduced: boolean
  onStatus: (status: GateStatus) => void
  onSeal: (spot: SealSpot) => void
}

const isPortrait = () => window.innerWidth / Math.max(1, window.innerHeight) < 0.9

export function GateVideo({ hidden, reduced, onStatus, onSeal }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [variant, setVariant] = useState<'landscape' | 'portrait'>(() => (isPortrait() ? 'portrait' : 'landscape'))
  const [ready, setReady] = useState(false)
  const [fit, setFit] = useState<'cover' | 'contain'>('cover')
  const meta = GATE_VIDEO[variant]

  // the first frame is ready → show it; a missing phone file falls back to the landscape one
  useEffect(() => {
    const v = video.current
    if (!v) return
    const onLoaded = () => {
      setReady(true)
      onStatus('ready')
      if (!reduced) v.play().catch(() => {}) // e.g. iPhone Low Power Mode: the still frame is shown instead
    }
    const onError = () => {
      if (variant === 'portrait') setVariant('landscape')
      else onStatus('missing')
    }
    v.addEventListener('loadeddata', onLoaded)
    v.addEventListener('error', onError)
    return () => {
      v.removeEventListener('loadeddata', onLoaded)
      v.removeEventListener('error', onError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, reduced])

  // place the seal on the doors, wherever the doors land on this screen
  useLayoutEffect(() => {
    if (!ready) return
    const place = () => {
      const el = wrap.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const videoAspect = meta.width / meta.height
      // much wider screens show the whole gate (blurred stone fills the sides) so the tower top is never cut off
      const contain = r.width / Math.max(1, r.height) > videoAspect * 1.03
      const s = contain ? Math.min(r.width / meta.width, r.height / meta.height) : Math.max(r.width / meta.width, r.height / meta.height)
      const ox = r.left + (r.width - meta.width * s) / 2
      const oy = r.top + (r.height - meta.height * s) / 2
      const d = meta.door
      const spot = {
        x: ox + d.centerX * s,
        y: oy + (d.top + (d.bottom - d.top) * SEAL_ON_DOOR) * s,
        half: d.halfWidth * s,
      }
      setFit(contain ? 'contain' : 'cover')
      el.style.transformOrigin = `${spot.x}px ${spot.y}px`
      onSeal(spot)
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, variant])

  return (
    <div
      ref={wrap}
      className="gate-video absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{
        opacity: ready && !hidden ? 1 : 0,
        transition: 'opacity 1.2s cubic-bezier(.22,.8,.2,1)',
        willChange: 'transform, opacity',
      }}
    >
      {fit === 'contain' && (
        <div
          className="absolute inset-[-6%]"
          style={{
            backgroundImage: `url(${meta.poster})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(26px) brightness(0.62) saturate(1.1)',
          }}
        />
      )}
      <video
        key={variant}
        ref={video}
        src={meta.src}
        poster={meta.poster}
        muted
        loop
        playsInline
        autoPlay={!reduced}
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
        className="absolute inset-0 h-full w-full"
        style={{ objectFit: fit, objectPosition: 'center' }}
      />
    </div>
  )
}