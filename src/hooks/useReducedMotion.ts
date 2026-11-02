import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

function snapshot() {
  return window.matchMedia(QUERY).matches || new URLSearchParams(window.location.search).has('reducedmotion')
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && snapshot()
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, snapshot, () => false)
}
