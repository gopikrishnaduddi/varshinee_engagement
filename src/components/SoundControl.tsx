import { Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** Your music: save the file as public/music.mp3 (or change this path to match your file name) */
const MUSIC_SRC = '/music.mp3'
/** 0 = silent, 1 = full volume (phones ignore this and use the device volume) */
const MUSIC_VOLUME = 0.6

/**
 * Background music. It is ON by default: browsers only allow sound after the guest's
 * first tap or click, so it starts on that first touch — normally "Enter the Celebration".
 * The button lets guests mute or unmute at any time.
 */
export function SoundControl() {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [available, setAvailable] = useState(true)
  const mutedByGuest = useRef(false)
  const resumeOnReturn = useRef(false)

  useEffect(() => {
    const el = new Audio(MUSIC_SRC)
    el.loop = true
    el.preload = 'auto'
    el.volume = MUSIC_VOLUME
    audio.current = el

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onError = () => {
      setAvailable(false)
      console.warn(`[invitation] Music file not found at "${MUSIC_SRC}". Save your audio at public${MUSIC_SRC}.`)
    }
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('error', onError)

    const gestures = ['click', 'touchend', 'keydown'] as const
    const stopListening = () => gestures.forEach((g) => window.removeEventListener(g, tryStart, true))
    function tryStart(e?: Event) {
      // the mute button handles its own clicks
      if (e && (e.target as Element | null)?.closest?.('[data-sound-toggle]')) return
      if (mutedByGuest.current || !el.paused) return
      el.play()
        .then(stopListening)
        .catch(() => {
          /* the browser is waiting for the guest's first tap */
        })
    }
    gestures.forEach((g) => window.addEventListener(g, tryStart, true))
    tryStart() // some desktop browsers allow sound straight away

    // pause when the guest switches apps or tabs, resume when they come back
    const onVisibility = () => {
      if (document.hidden) {
        resumeOnReturn.current = !el.paused
        el.pause()
      } else if (resumeOnReturn.current && !mutedByGuest.current) {
        el.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stopListening()
      document.removeEventListener('visibilitychange', onVisibility)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('error', onError)
      el.pause()
      el.removeAttribute('src')
      el.load()
      audio.current = null
    }
  }, [])

  const toggle = () => {
    const el = audio.current
    if (!el) return
    if (el.paused) {
      mutedByGuest.current = false
      el.play().catch(() => {})
    } else {
      mutedByGuest.current = true
      el.pause()
    }
  }

  if (!available) return null

  return (
    <button
      type="button"
      data-sound-toggle
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? 'Mute music' : 'Play music'}
      title={playing ? 'Mute music' : 'Play music'}
      className="group fixed z-40 grid h-11 w-11 place-items-center rounded-full border border-gold/50 bg-espresso/45 text-gold-soft backdrop-blur-md transition-colors duration-500 hover:border-gold-soft hover:bg-espresso/70"
      style={{ top: 'max(env(safe-area-inset-top), 14px)', right: 'max(env(safe-area-inset-right), 14px)' }}
    >
      {playing ? <Volume2 size={18} strokeWidth={1.6} /> : <VolumeX size={18} strokeWidth={1.6} />}
      {playing && (
        <span className="pointer-events-none absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-[2px]" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="sound-bar block w-[2px] rounded-full bg-gold-soft"
              style={{ height: 4, animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </span>
      )}
    </button>
  )
}