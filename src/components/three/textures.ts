import * as THREE from 'three'

/**
 * Every surface texture is painted procedurally on a canvas at start-up:
 * no image downloads, no missing files, and tiny memory on phones.
 */

function makeCanvas(w: number, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  return { c, ctx }
}

/** Seeded random so the temple looks identical on every visit */
export function rng(seed = 7) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function grain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed = 3) {
  const r = rng(seed)
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount
    d[i] = Math.max(0, Math.min(255, d[i] + n))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n * 0.95))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.85))
  }
  ctx.putImageData(img, 0, 0)
}

/** draw a blob at every wrapped offset so the canvas tiles seamlessly */
function wrappedBlob(ctx: CanvasRenderingContext2D, w: number, h: number, x: number, y: number, rad: number, color: string) {
  for (const ox of [-w, 0, w]) {
    for (const oy of [-h, 0, h]) {
      const cx = x + ox
      const cy = y + oy
      if (cx + rad < 0 || cx - rad > w || cy + rad < 0 || cy - rad > h) continue
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
      g.addColorStop(0, color)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2)
    }
  }
}

function toTexture(c: HTMLCanvasElement, color: boolean, repeat = true) {
  const t = new THREE.CanvasTexture(c)
  if (color) t.colorSpace = THREE.SRGBColorSpace
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  t.needsUpdate = true
  return t
}

export function sandstoneTextures(size = 512) {
  const { c, ctx } = makeCanvas(size)
  ctx.fillStyle = '#c7a57b'
  ctx.fillRect(0, 0, size, size)
  const r = rng(11)
  for (let i = 0; i < 70; i++) {
    const dark = r() > 0.45
    wrappedBlob(
      ctx,
      size,
      size,
      r() * size,
      r() * size,
      30 + r() * 150,
      dark ? `rgba(110,72,40,${0.05 + r() * 0.07})` : `rgba(255,236,205,${0.05 + r() * 0.06})`,
    )
  }
  // faint sedimentary strata
  for (let i = 0; i < 26; i++) {
    const y = r() * size
    ctx.fillStyle = `rgba(95,60,32,${0.025 + r() * 0.04})`
    ctx.fillRect(0, y, size, 1 + r() * 3)
  }
  grain(ctx, size, size, 26, 5)

  // bump: speckled pits and weathering
  const b = makeCanvas(size)
  b.ctx.fillStyle = '#808080'
  b.ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 900; i++) {
    const v = r() > 0.5 ? 40 : 200
    b.ctx.fillStyle = `rgba(${v},${v},${v},${0.08 + r() * 0.2})`
    const s = 1 + r() * 4
    b.ctx.beginPath()
    b.ctx.arc(r() * size, r() * size, s, 0, Math.PI * 2)
    b.ctx.fill()
  }
  grain(b.ctx, size, size, 40, 9)
  return { map: toTexture(c, true), bump: toTexture(b.c, false) }
}

/** Ashlar masonry for the courtyard walls: 128px per metre */
export function wallTextures() {
  const w = 1024
  const h = 512
  const { c, ctx } = makeCanvas(w, h)
  const b = makeCanvas(w, h)
  const r = rng(23)
  ctx.fillStyle = '#5a3d29'
  ctx.fillRect(0, 0, w, h)
  b.ctx.fillStyle = '#202020'
  b.ctx.fillRect(0, 0, w, h)
  const rowH = 64
  for (let y = 0; y < h; y += rowH) {
    let x = -r() * 200
    while (x < w) {
      const bw = 150 + r() * 120
      const tone = 168 + r() * 34
      const col = `rgb(${tone + 22},${tone - 6},${tone - 52})`
      for (const ox of [0, w]) {
        ctx.fillStyle = col
        ctx.fillRect(x + 2 - ox, y + 2, bw - 4, rowH - 4)
        b.ctx.fillStyle = '#a8a8a8'
        b.ctx.fillRect(x + 2 - ox, y + 2, bw - 4, rowH - 4)
        // chamfered top highlight & bottom shadow sell the relief
        ctx.fillStyle = 'rgba(255,240,215,0.12)'
        ctx.fillRect(x + 2 - ox, y + 2, bw - 4, 3)
        ctx.fillStyle = 'rgba(40,22,10,0.22)'
        ctx.fillRect(x + 2 - ox, y + rowH - 6, bw - 4, 4)
      }
      x += bw
    }
  }
  for (let i = 0; i < 40; i++) {
    wrappedBlob(ctx, w, h, r() * w, r() * h, 40 + r() * 120, `rgba(70,40,20,${0.05 + r() * 0.06})`)
  }
  grain(ctx, w, h, 22, 4)
  grain(b.ctx, w, h, 30, 6)
  return { map: toTexture(c, true), bump: toTexture(b.c, false) }
}

/** Large paving slabs for the courtyard floor */
export function floorTextures() {
  const size = 1024
  const { c, ctx } = makeCanvas(size)
  const b = makeCanvas(size)
  const r = rng(41)
  ctx.fillStyle = '#3a2618'
  ctx.fillRect(0, 0, size, size)
  b.ctx.fillStyle = '#1a1a1a'
  b.ctx.fillRect(0, 0, size, size)
  const rows = [176, 128, 192, 144, 176, 208]
  let y = 0
  for (const rh of rows) {
    let x = -r() * 300
    while (x < size) {
      const sw = 180 + r() * 220
      const tone = 140 + r() * 40
      for (const ox of [0, size]) {
        const g = ctx.createLinearGradient(x - ox, y, x - ox + sw, y + rh)
        g.addColorStop(0, `rgb(${tone + 30},${tone + 4},${tone - 34})`)
        g.addColorStop(1, `rgb(${tone + 16},${tone - 8},${tone - 44})`)
        ctx.fillStyle = g
        ctx.fillRect(x + 3 - ox, y + 3, sw - 6, rh - 6)
        b.ctx.fillStyle = '#9a9a9a'
        b.ctx.fillRect(x + 3 - ox, y + 3, sw - 6, rh - 6)
      }
      x += sw
    }
    y += rh
  }
  for (let i = 0; i < 60; i++) {
    wrappedBlob(ctx, size, size, r() * size, r() * size, 30 + r() * 160, `rgba(40,22,12,${0.06 + r() * 0.08})`)
  }
  grain(ctx, size, size, 20, 8)
  grain(b.ctx, size, size, 26, 12)
  return { map: toTexture(c, true), bump: toTexture(b.c, false) }
}

/** Carved brass door leaf: colour (aged recesses) + bump (relief) */
export function doorTextures() {
  const w = 384
  const h = 1200
  const col = makeCanvas(w, h)
  const bump = makeCanvas(w, h)

  const paint = (ctx: CanvasRenderingContext2D, low: string, mid: string, high: string) => {
    ctx.fillStyle = mid
    ctx.fillRect(0, 0, w, h)
    // raised outer frame
    ctx.fillStyle = high
    ctx.fillRect(0, 0, w, 26)
    ctx.fillRect(0, h - 26, w, 26)
    ctx.fillRect(0, 0, 26, h)
    ctx.fillRect(w - 26, 0, 26, h)
    const cols = 2
    const rows = 6
    const pad = 40
    const gap = 22
    const pw = (w - pad * 2 - gap * (cols - 1)) / cols
    const ph = (h - pad * 2 - gap * (rows - 1)) / rows
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = pad + i * (pw + gap)
        const y = pad + j * (ph + gap)
        // recessed panel
        ctx.fillStyle = low
        ctx.fillRect(x, y, pw, ph)
        // raised beading inside the panel
        ctx.strokeStyle = high
        ctx.lineWidth = 4
        ctx.strokeRect(x + 10, y + 10, pw - 20, ph - 20)
        // lotus rosette
        const cx = x + pw / 2
        const cy = y + ph / 2
        const R = Math.min(pw, ph) * 0.34
        ctx.fillStyle = high
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2
          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate(a)
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.quadraticCurveTo(R * 0.42, -R * 0.45, 0, -R)
          ctx.quadraticCurveTo(-R * 0.42, -R * 0.45, 0, 0)
          ctx.fill()
          ctx.restore()
        }
        ctx.fillStyle = low
        ctx.beginPath()
        ctx.arc(cx, cy, R * 0.26, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = high
        ctx.beginPath()
        ctx.arc(cx, cy, R * 0.15, 0, Math.PI * 2)
        ctx.fill()
        // corner dots
        for (const [dx, dy] of [
          [18, 18],
          [pw - 18, 18],
          [18, ph - 18],
          [pw - 18, ph - 18],
        ]) {
          ctx.beginPath()
          ctx.arc(x + dx, y + dy, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }
  paint(col.ctx, '#8d6a33', '#c39a52', '#f2d99c')
  grain(col.ctx, w, h, 18, 2)
  // patina in the lower third where hands and time have touched the doors
  const g = col.ctx.createLinearGradient(0, h * 0.55, 0, h)
  g.addColorStop(0, 'rgba(60,35,10,0)')
  g.addColorStop(1, 'rgba(60,35,10,0.28)')
  col.ctx.fillStyle = g
  col.ctx.fillRect(0, 0, w, h)

  paint(bump.ctx, '#3c3c3c', '#8a8a8a', '#e6e6e6')
  bump.ctx.filter = 'blur(1.5px)'
  bump.ctx.drawImage(bump.c, 0, 0)
  bump.ctx.filter = 'none'
  return { map: toTexture(col.c, true, false), bump: toTexture(bump.c, false, false) }
}

/** Rows of arched niches (kudu) for the gopuram tiers; tiles horizontally */
export function tierTextures() {
  const w = 512
  const h = 256
  const { c, ctx } = makeCanvas(w, h)
  const b = makeCanvas(w, h)
  ctx.fillStyle = '#c29b6c'
  ctx.fillRect(0, 0, w, h)
  b.ctx.fillStyle = '#8a8a8a'
  b.ctx.fillRect(0, 0, w, h)
  const niches = 4
  const nw = w / niches
  for (let i = 0; i < niches; i++) {
    const x = i * nw
    // pilasters
    for (const ctx2 of [ctx, b.ctx]) {
      ctx2.fillStyle = ctx2 === ctx ? '#d8b88c' : '#d0d0d0'
      ctx2.fillRect(x + 6, 28, 14, h - 50)
      ctx2.fillRect(x + nw - 20, 28, 14, h - 50)
      // arched niche
      ctx2.fillStyle = ctx2 === ctx ? '#4a2d1c' : '#2a2a2a'
      ctx2.beginPath()
      const nx = x + 32
      const nwid = nw - 64
      ctx2.moveTo(nx, h - 34)
      ctx2.lineTo(nx, 110)
      ctx2.quadraticCurveTo(nx + nwid / 2, 20, nx + nwid, 110)
      ctx2.lineTo(nx + nwid, h - 34)
      ctx2.closePath()
      ctx2.fill()
      // horseshoe arch frame
      ctx2.strokeStyle = ctx2 === ctx ? '#e3c697' : '#e0e0e0'
      ctx2.lineWidth = 6
      ctx2.beginPath()
      ctx2.moveTo(nx - 4, 112)
      ctx2.quadraticCurveTo(nx + nwid / 2, 6, nx + nwid + 4, 112)
      ctx2.stroke()
    }
    // a hint of a sculpted figure inside the niche
    ctx.fillStyle = 'rgba(160,110,70,0.55)'
    ctx.beginPath()
    ctx.ellipse(x + nw / 2, 120, 9, 11, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x + nw / 2 - 12, 132, 24, 70)
  }
  // cornice bands
  ctx.fillStyle = '#e1c393'
  ctx.fillRect(0, 0, w, 14)
  ctx.fillRect(0, h - 22, w, 22)
  ctx.fillStyle = 'rgba(60,30,10,0.35)'
  ctx.fillRect(0, 14, w, 6)
  grain(ctx, w, h, 22, 31)
  return { map: toTexture(c, true), bump: toTexture(b.c, false) }
}

/** Carved lotus ceiling for the mandapam canopy */
export function ceilingTextures() {
  const size = 512
  const { c, ctx } = makeCanvas(size)
  ctx.fillStyle = '#8f6c48'
  ctx.fillRect(0, 0, size, size)
  const cx = size / 2
  const cy = size / 2
  ctx.strokeStyle = '#d9b98a'
  ctx.lineWidth = 6
  ctx.strokeRect(14, 14, size - 28, size - 28)
  ctx.strokeRect(40, 40, size - 80, size - 80)
  const rings = [
    { n: 24, R: 210, inner: 160, col: '#c9a675' },
    { n: 16, R: 160, inner: 104, col: '#d8b98a' },
    { n: 12, R: 104, inner: 56, col: '#e7cfa6' },
  ]
  for (const ring of rings) {
    ctx.fillStyle = ring.col
    for (let k = 0; k < ring.n; k++) {
      const a = (k / ring.n) * Math.PI * 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(a)
      ctx.beginPath()
      ctx.moveTo(0, -ring.inner)
      ctx.quadraticCurveTo((ring.R - ring.inner) * 0.55, -(ring.inner + ring.R) / 2, 0, -ring.R)
      ctx.quadraticCurveTo(-(ring.R - ring.inner) * 0.55, -(ring.inner + ring.R) / 2, 0, -ring.inner)
      ctx.fill()
      ctx.strokeStyle = 'rgba(70,40,20,0.5)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()
    }
  }
  ctx.fillStyle = '#5e3c22'
  ctx.beginPath()
  ctx.arc(cx, cy, 52, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e9cf9c'
  ctx.beginPath()
  ctx.arc(cx, cy, 24, 0, Math.PI * 2)
  ctx.fill()
  grain(ctx, size, size, 20, 17)
  return toTexture(c, true, false)
}

/** A rice-flour kolam with coloured powder, laid before the mandapam steps */
export function kolamTexture() {
  const size = 1024
  const { c, ctx } = makeCanvas(size)
  ctx.clearRect(0, 0, size, size)
  const cx = size / 2
  const cy = size / 2
  const petal = (R: number, inner: number, n: number, fill: string, stroke: string, rot = 0) => {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + rot
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(a)
      ctx.beginPath()
      ctx.moveTo(0, -inner)
      ctx.bezierCurveTo((R - inner) * 0.7, -inner - (R - inner) * 0.2, (R - inner) * 0.35, -R * 0.95, 0, -R)
      ctx.bezierCurveTo(-(R - inner) * 0.35, -R * 0.95, -(R - inner) * 0.7, -inner - (R - inner) * 0.2, 0, -inner)
      ctx.fillStyle = fill
      ctx.fill()
      ctx.lineWidth = 7
      ctx.strokeStyle = stroke
      ctx.stroke()
      ctx.restore()
    }
  }
  const white = 'rgba(250,244,230,0.95)'
  // outer looping border of dots and arcs
  ctx.strokeStyle = white
  ctx.lineWidth = 6
  for (let k = 0; k < 32; k++) {
    const a = (k / 32) * Math.PI * 2
    const x = cx + Math.cos(a) * 460
    const y = cy + Math.sin(a) * 460
    ctx.beginPath()
    ctx.arc(x, y, 22, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = white
    ctx.beginPath()
    ctx.arc(cx + Math.cos(a + Math.PI / 32) * 430, cy + Math.sin(a + Math.PI / 32) * 430, 7, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(cx, cy, 410, 0, Math.PI * 2)
  ctx.stroke()
  petal(400, 250, 16, 'rgba(140,30,45,0.92)', white) // kumkum red
  petal(330, 170, 12, 'rgba(232,150,46,0.95)', white, Math.PI / 12) // marigold
  petal(240, 100, 8, 'rgba(240,200,70,0.95)', white) // turmeric
  petal(150, 40, 8, 'rgba(215,165,160,0.95)', white, Math.PI / 8) // rose
  ctx.fillStyle = white
  ctx.beginPath()
  ctx.arc(cx, cy, 44, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(140,30,45,0.95)'
  ctx.beginPath()
  ctx.arc(cx, cy, 20, 0, Math.PI * 2)
  ctx.fill()
  // powder texture: knock out speckles so it reads as hand-laid
  const r = rng(77)
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.15 + r() * 0.5})`
    ctx.fillRect(r() * size, r() * size, 1 + r() * 2, 1 + r() * 2)
  }
  ctx.globalCompositeOperation = 'source-over'
  return toTexture(c, true, false)
}

/** Soft radial glow sprite used for flames, lamps and light bloom */
export function glowTexture() {
  const size = 128
  const { c, ctx } = makeCanvas(size)
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.18, 'rgba(255,236,190,0.75)')
  g.addColorStop(0.45, 'rgba(255,180,90,0.22)')
  g.addColorStop(1, 'rgba(255,140,40,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return toTexture(c, true, false)
}
