import { Check, Link2, MessageCircle, Share2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { copyLink, nativeShare, whatsappUrl } from '../lib/share.ts'

/** Native share sheet where available; otherwise WhatsApp and copy-link options */
export function ShareButton() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    const onClick = (e: MouseEvent) => {
      if (!panel.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onClick)
    panel.current?.querySelector<HTMLElement>('a,button')?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onClick)
    }
  }, [open])

  const share = async () => {
    const outcome = await nativeShare()
    if (outcome === 'unsupported') setOpen((v) => !v)
  }

  const copy = async () => {
    const ok = await copyLink()
    setCopied(ok)
    if (ok) window.setTimeout(() => setCopied(false), 2400)
  }

  return (
    <div className="relative">
      <button ref={button} type="button" className="btn-ghost" onClick={share} aria-expanded={open} aria-haspopup="true">
        <Share2 size={16} strokeWidth={1.7} aria-hidden="true" />
        Share Invitation
      </button>
      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label="Share the invitation"
          className="absolute bottom-[calc(100%+12px)] left-1/2 z-30 w-[min(84vw,280px)] -translate-x-1/2 rounded-2xl border border-gold/40 bg-espresso/95 p-2 text-left shadow-2xl backdrop-blur-md"
        >
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 font-sans text-[0.95rem] text-ivory transition-colors hover:bg-gold/10"
            onClick={() => setOpen(false)}
          >
            <MessageCircle size={18} strokeWidth={1.6} className="text-gold-soft" aria-hidden="true" />
            Share on WhatsApp
          </a>
          <button
            type="button"
            onClick={copy}
            className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-3 font-sans text-[0.95rem] text-ivory transition-colors hover:bg-gold/10"
          >
            {copied ? (
              <Check size={18} strokeWidth={1.8} className="text-gold-soft" aria-hidden="true" />
            ) : (
              <Link2 size={18} strokeWidth={1.6} className="text-gold-soft" aria-hidden="true" />
            )}
            <span aria-live="polite">{copied ? 'Link copied' : 'Copy invitation link'}</span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-ivory/50 hover:text-ivory"
            aria-label="Close share options"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
