/**
 * Drives the static loading seal that index.html paints before any JavaScript runs.
 * The gold line advances only on real milestones — no invented percentages.
 */
type Milestone = 'app' | 'fonts' | 'world'

const reached = new Set<Milestone>()
let finished = false
const doneListeners = new Set<() => void>()

function el() {
  return document.getElementById('boot')
}

export function markBoot(step: Milestone) {
  reached.add(step)
  const node = el()
  if (node) node.dataset.step = String(reached.size)
}

/** The marigold-curtain opening always plays to the end (curtain parted, names written), even on a fast connection */
const MIN_SHOW_MS = 3700
const MIN_SHOW_REDUCED_MS = 900
let finishing = false

export function finishBoot() {
  if (finishing) return
  finishing = true
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]reducedmotion/.test(location.search)
  const wait = Math.max(0, (reduced ? MIN_SHOW_REDUCED_MS : MIN_SHOW_MS) - performance.now())
  window.setTimeout(() => {
    finished = true
    const node = el()
    if (node) {
      node.dataset.step = '3'
      window.setTimeout(() => {
        node.classList.add('is-done')
        node.setAttribute('aria-hidden', 'true')
        window.setTimeout(() => node.remove(), 1300)
      }, 200)
    }
    doneListeners.forEach((fn) => fn())
  }, wait)
}

export function isBootFinished() {
  return finished
}

export function onBootFinished(fn: () => void) {
  if (finished) fn()
  else doneListeners.add(fn)
  return () => doneListeners.delete(fn)
}