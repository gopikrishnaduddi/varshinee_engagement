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

export function finishBoot() {
  if (finished) return
  finished = true
  const node = el()
  if (node) {
    node.dataset.step = '3'
    // let the line complete before the seal lifts
    window.setTimeout(() => {
      node.classList.add('is-done')
      node.setAttribute('aria-hidden', 'true')
      window.setTimeout(() => node.remove(), 1000)
    }, 260)
  }
  doneListeners.forEach((fn) => fn())
}

export function isBootFinished() {
  return finished
}

export function onBootFinished(fn: () => void) {
  if (finished) fn()
  else doneListeners.add(fn)
  return () => doneListeners.delete(fn)
}
