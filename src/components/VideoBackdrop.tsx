import { useEffect, useRef, useState } from 'react'
import { journey } from '../lib/journey.ts'

/**
 * Your scroll-driven background video. Put the files in public/video/.
 * The portrait file is used on phones held upright; if it is missing, the landscape one is used everywhere.
 * If neither file exists, the site simply keeps the 3D temple.
 */
export const BACKGROUND_VIDEO = {
  landscape: '/video/temple-landscape.mp4',
  portrait: '/video/temple-portrait.mp4',
}

/** Download the whole clip first so scrubbing never waits on the network */
async function loadClip(src: string): Promise<string | null> {
  try {
    const res = await fetch(src)
    if (!res.ok) return null
    // the dev server answers a missing file with the web page itself — that is not a video
    const type = res.headers.get('content-type') ?? ''
    if (type.includes('text/html')) return null
    const blob = await res.blob()
    return blob.size > 1024 ? URL.createObjectURL(blob) : null
  } catch {
    return null
  }
}

type Props = {
  /** fade the video in (after the guest has walked through the doors) */
  show: boolean
  reduced: boolean
  /** reports whether a video was found and is ready to use */
  onStatus: (ready: boolean) => void
}

/**
 * The background video follows the page scroll: scrolling down moves the camera forward,
 * scrolling up rewinds it. It never plays by itself and has no sound.
 */
export function VideoBackdrop({ show, reduced, onStatus }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // pick and download the right clip for this screen
  useEffect(() => {
    let cancelled = false
    let url: string | null = null
    const portrait = window.innerWidth / Math.max(1, window.innerHeight) < 0.9
    const order = portrait ? [BACKGROUND_VIDEO.portrait, BACKGROUND_VIDEO.landscape] : [BACKGROUND_VIDEO.landscape]
    ;(async () => {
      for (const candidate of order) {
        url = await loadClip(candidate)
        if (cancelled) break
        if (url) {
          setSrc(url)
          return
        }
      }
      if (!cancelled) onStatus(false)
    })()
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // once the first frame is decoded, "wake" the video so phones draw frames when we seek
  useEffect(() => {
    const v = video.current
    if (!v || !src) return
    const onLoaded = () => {
      v.play()
        .then(() => v.pause())
        .catch(() => {})
        .finally(() => {
          v.currentTime = 0
          setReady(true)
          onStatus(true)
        })
    }
    const onError = () => onStatus(false)
    v.addEventListener('loadeddata', onLoaded, { once: true })
    v.addEventListener('error', onError, { once: true })
    return () => {
      v.removeEventListener('loadeddata', onLoaded)
      v.removeEventListener('error', onError)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // scrub: page scroll position → video time, eased so it glides like the camera did
  useEffect(() => {
    const v = video.current
    if (!v || !ready || !show) return
    let frame = 0
    let current = v.currentTime
    const tick = () => {
      const duration = v.duration
      if (duration && Number.isFinite(duration)) {
        const target = (reduced ? 0.45 : journey.scroll) * Math.max(0, duration - 0.05)
        current += (target - current) * (reduced ? 1 : 0.16)
        if (!v.seeking && Math.abs(v.currentTime - current) > 1 / 60) v.currentTime = current
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [ready, show, reduced])

  if (!src) return null
  return (
    <video
      ref={video}
      src={src}
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      tabIndex={-1}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover"
      style={{ opacity: show && ready ? 1 : 0, transition: 'opacity 1.2s cubic-bezier(.22,.8,.2,1)' }}
    />
  )
}