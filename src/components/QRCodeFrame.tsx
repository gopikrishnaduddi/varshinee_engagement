import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { eventDetails } from '../data/eventDetails.ts'
import { GoldGradient, useSvgId } from './Ornaments.tsx'

/**
 * Presents the family's ORIGINAL venue QR code. The image is never rotated, cropped,
 * recoloured, overlaid or distorted: it sits on a plain white mat that adds quiet zone,
 * and every flourish lives outside that mat.
 */
export function QRCodeFrame() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>('loading')
  const [crisp, setCrisp] = useState(false)
  const id = useSvgId('qr')
  const g = `url(#${id}g)`
  const e = eventDetails

  return (
    <figure className="qr-frame relative mx-auto w-[min(72vw,272px)]">
      {/* corner flourishes, all outside the white mat */}
      <svg className="pointer-events-none absolute -inset-[18px] h-[calc(100%+36px)] w-[calc(100%+36px)]" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs>
          <GoldGradient id={`${id}g`} dark />
        </defs>
        {[
          'M2 16 V2 H16',
          'M84 2 H98 V16',
          'M98 84 V98 H84',
          'M16 98 H2 V84',
        ].map((d) => (
          <path key={d} d={d} stroke={g} strokeWidth="1.2" fill="none" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div
        className="rounded-[14px] p-[3px]"
        style={{ background: 'linear-gradient(135deg, #f3dca5, #b8904b 35%, #e9cf94 55%, #8f6a30 80%, #d6b46d)' }}
      >
        <div className="rounded-[11px] bg-white p-[clamp(12px,3.6vw,16px)]">
          {status !== 'missing' ? (
            <img
              src={e.venue.qrImage}
              alt={`QR code: scan for directions to ${e.venue.name}`}
              className="block h-auto w-full"
              style={{ imageRendering: crisp ? 'pixelated' : 'auto', aspectRatio: 'auto' }}
              loading="lazy"
              decoding="async"
              onLoad={(ev) => {
                const img = ev.currentTarget
                // small source images stay razor sharp when scaled up
                setCrisp(img.naturalWidth < img.clientWidth * (window.devicePixelRatio || 1))
                setStatus('ok')
              }}
              onError={() => {
                setStatus('missing')
                console.warn(
                  `[invitation] Venue QR image not found at "${e.venue.qrImage}". Save the original QR code image at public${e.venue.qrImage}.`,
                )
              }}
            />
          ) : (
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 text-center text-maroon">
              <MapPin size={34} strokeWidth={1.4} aria-hidden="true" />
              <p className="px-3 font-display text-[1.05rem] italic leading-snug text-ink">
                Use the button below for directions to the venue
              </p>
            </div>
          )}
        </div>
      </div>
      {status !== 'missing' && (
        <figcaption className="mt-5 font-ceremonial text-[0.7rem] font-semibold tracking-[0.3em] text-maroon">SCAN FOR VENUE DIRECTIONS</figcaption>
      )}
    </figure>
  )
}
