// Procedural art for the site: one locked style (obsidian voxels + glass, light
// from the upper left, violet/pink on near-black). Only the subject changes.
// Usage: CHROME_PATH=/path/to/chrome node tools/gen_art.mjs [name ...]
import puppeteer from 'puppeteer-core'
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const CHROME = process.env.CHROME_PATH
if (!CHROME) throw new Error('Set CHROME_PATH')

const OUT = 'public/media/art'
const TMP = '.art-cache'
const SS = 1.5

const WIDE = [1600, 900]
const TALL = [720, 1280]
const PAGE = [800, 920]
const JOBS = [
  ['hero-w', 'hero', WIDE, 11], ['hero-p', 'hero', TALL, 12],
  ['shaders-w', 'shaders', WIDE, 21], ['shaders-p', 'shaders', TALL, 22],
  ['custom-w', 'custom', WIDE, 31], ['custom-p', 'custom', TALL, 32],
  ['mapart-w', 'mapart', WIDE, 41], ['mapart-p', 'mapart', TALL, 42],
  ['final-w', 'final', WIDE, 51], ['final-p', 'final', TALL, 52],
  ['film-w', 'film', WIDE, 71], ['film-p', 'film', TALL, 72],
  ['gallery-w', 'gallery', WIDE, 81], ['gallery-p', 'gallery', TALL, 82],
  ['chapters-w', 'chapters', WIDE, 91], ['chapters-p', 'chapters', TALL, 92],
  ['book-visuals', 'prisms', PAGE, 61], ['book-world', 'island', PAGE, 62],
  ['book-ui', 'panels', PAGE, 63], ['book-combat', 'fracture', PAGE, 64],
]

/* Runs in the browser. */
function render({ W, H, scene, seed }) {
  const TAU = Math.PI * 2
  let s0 = seed >>> 0
  const rnd = () => {
    s0 = (s0 + 1831565813) >>> 0
    let t = s0
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const mix = (a, b, t) => a + (b - a) * t
  const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
  const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l) }
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`

  // locked style
  const BG = [11, 6, 20]
  const OBSIDIAN = [24, 14, 42]
  const VIOLET = [168, 85, 247]
  const PINK = [249, 168, 212]
  const HILITE = [201, 155, 255]
  const LIGHT = norm([-0.55, -0.72, -0.42])

  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const g = cv.getContext('2d')
  const asp = W / H
  const f = H * 1.1
  const halfY = (z) => (H / 2) * z / f
  const halfX = (z) => (W / 2) * z / f
  const FAR = 15

  const rot = ([x, y, z], [a, b, c]) => {
    let t
    t = y * Math.cos(a) - z * Math.sin(a); z = y * Math.sin(a) + z * Math.cos(a); y = t
    t = x * Math.cos(b) + z * Math.sin(b); z = -x * Math.sin(b) + z * Math.cos(b); x = t
    t = x * Math.cos(c) - y * Math.sin(c); y = x * Math.sin(c) + y * Math.cos(c); x = t
    return [x, y, z]
  }
  const FACES = [
    [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1], [1, 0, 0]],
    [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1], [-1, 0, 0]],
    [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1], [0, 1, 0]],
    [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1], [0, -1, 0]],
    [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1], [0, 0, 1]],
    [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1], [0, 0, -1]],
  ]

  const items = []
  const box = (c, d, o = {}) => items.push({ c, d: Array.isArray(d) ? d : [d, d, d], r: o.r || [0, 0, 0], glass: !!o.glass, tint: o.tint ?? rnd(), line: o.line ?? 1, glow: o.glow ?? 0 })
  const randRot = () => [rnd() * TAU, rnd() * TAU, rnd() * TAU]
  const tintOf = (t) => mix3(VIOLET, PINK, clamp(t))

  const drawBox = (b, pitch) => {
    const world = (p) => {
      const q = rot([p[0] * b.d[0] / 2, p[1] * b.d[1] / 2, p[2] * b.d[2] / 2], b.r)
      const v = [q[0] + b.c[0], q[1] + b.c[1], q[2] + b.c[2]]
      return pitch ? rot(v.map((x, i) => x - pitch.o[i]), pitch.a).map((x, i) => x + pitch.o[i]) : v
    }
    const center = world([0, 0, 0])
    if (center[2] < 0.6) return
    const fog = clamp((center[2] - 2) / (FAR - 2))
    const tint = tintOf(b.tint)
    const proj = (v) => [W / 2 + (v[0] * f) / v[2], H / 2 + (v[1] * f) / v[2]]
    const faces = FACES.map((F) => {
      const vs = F.slice(0, 4).map(world)
      const nOrig = rot(F[4], b.r)
      const n = pitch ? rot(nOrig, pitch.a) : nOrig
      const mid = vs.reduce((a, v) => [a[0] + v[0] / 4, a[1] + v[1] / 4, a[2] + v[2] / 4], [0, 0, 0])
      const toCam = norm(mid.map((x) => -x))
      return { vs, n, mid, facing: dot(n, toCam), toCam }
    }).sort((a, c) => c.mid[2] - a.mid[2])
    const fade = Math.pow(1 - fog, 1.35)
    for (const F of faces) {
      if (!b.glass && F.facing <= 0) continue
      const pts = F.vs.map((v) => { const p = proj(v); return p })
      if (pts.every((p) => p[0] < -60 || p[0] > W + 60 || p[1] < -60 || p[1] > H + 60)) continue
      const lam = clamp(dot(F.n, LIGHT))
      const rim = Math.pow(1 - Math.abs(F.facing), 2.2)
      // gradient runs from the vertex nearest the light to the opposite corner
      let a = pts[0], c = pts[2]
      for (let i = 0; i < 4; i++) if (pts[i][0] + pts[i][1] < a[0] + a[1]) { a = pts[i]; c = pts[(i + 2) % 4] }
      const path = () => { g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < 4; i++) g.lineTo(...pts[i]); g.closePath() }
      const grad = g.createLinearGradient(a[0], a[1], c[0], c[1])
      if (b.glass) {
        g.globalCompositeOperation = 'lighter'
        const al = (0.03 + 0.15 * rim + 0.09 * lam) * fade * (b.d[2] < 0.1 ? 0.42 : 1)
        grad.addColorStop(0, rgb(mix3(tint, HILITE, 0.5), al * 1.8))
        grad.addColorStop(0.55, rgb(tint, al * 0.5))
        grad.addColorStop(1, rgb(tint, al))
        g.fillStyle = grad; path(); g.fill()
        g.strokeStyle = rgb(mix3(HILITE, PINK, b.tint), (0.2 + 0.65 * Math.max(lam, rim)) * fade)
        g.lineWidth = clamp((1.9 * f) / (F.mid[2] * H), 0.6, 2.4) * (W > 1400 ? 1.5 : 1.15)
        g.lineJoin = 'round'; g.stroke()
        g.globalCompositeOperation = 'source-over'
      } else {
        const lit = Math.pow(lam, 1.7)
        // shadows stay violet, only lit faces reach the tint (avoids muddy mauves)
        const shade = clamp(0.03 + 1.2 * lit + b.glow)
        const deep = mix3(OBSIDIAN, VIOLET, 0.82)
        const body = shade < 0.5 ? mix3(OBSIDIAN, VIOLET, shade * 1.64) : mix3(deep, tint, (shade - 0.5) * 2)
        const c1 = mix3(body, mix3(BG, VIOLET, 0.18), fog * 0.8)
        const c2 = mix3(mix3(OBSIDIAN, VIOLET, 0.02 + 0.16 * shade), BG, Math.min(1, 0.25 + fog))
        grad.addColorStop(0, rgb(c1)); grad.addColorStop(1, rgb(c2))
        g.fillStyle = grad; path(); g.fill()
        g.strokeStyle = rgb(mix3(tint, PINK, 0.45), (0.1 + 0.8 * Math.max(lit, rim * 0.55)) * fade * b.line)
        g.lineWidth = clamp((1.25 * f) / (F.mid[2] * H), 0.5, 1.8) * (W > 1400 ? 1.4 : 1.05)
        g.lineJoin = 'round'; g.stroke()
      }
    }
  }

  /* ---------- subjects ---------- */
  let glow = [{ x: 0.3, y: 0.28, r: 0.85, c: VIOLET, a: 0.3 }, { x: 0.72, y: 0.74, r: 0.6, c: PINK, a: 0.08 }]
  let pitch = null

  if (scene === 'hero') {
    const n = asp > 1 ? 340 : 210
    for (let i = 0; i < n; i++) {
      const z = mix(2.1, 13, Math.pow(rnd(), 0.62))
      const ang = rnd() * TAU
      const rr = mix(0.55, 1.28, Math.pow(rnd(), 0.5))
      const sq = asp > 1 ? 1 : 1.15
      const x = Math.cos(ang) * rr * halfX(z) * sq
      const y = Math.sin(ang) * rr * halfY(z) * (asp > 1 ? 1 : 0.86)
      const size = mix(0.1, 0.62, Math.pow(rnd(), 3.2)) * (1 + (13 - z) * 0.05)
      box([x, y, z], size, { r: randRot(), glass: rnd() < 0.3, tint: clamp(0.5 + y / halfY(z) * 0.5 + (rnd() - 0.5) * 0.35) })
    }
    glow = [{ x: 0.5, y: 0.46, r: 0.62, c: VIOLET, a: 0.34 }, { x: 0.5, y: 0.5, r: 0.28, c: PINK, a: 0.14 }]
  }

  if (scene === 'final') {
    const n = asp > 1 ? 240 : 150
    for (let i = 0; i < n; i++) {
      const u = Math.pow(rnd(), 0.8)
      const z = mix(2.2, 14.5, u)
      const ang = rnd() * TAU
      const rr = mix(0.5, 1.5, Math.pow(rnd(), 0.5)) * mix(1.5, 0.18, u)
      const x = Math.cos(ang) * rr * halfX(5) * (asp > 1 ? 1 : 1.35)
      const y = Math.sin(ang) * rr * halfY(5) * (asp > 1 ? 1 : 0.7)
      box([x, y, z], mix(0.1, 0.46, Math.pow(rnd(), 2.6)), { r: randRot(), glass: rnd() < 0.42, tint: clamp(u + (rnd() - 0.5) * 0.3) })
    }
    glow = [{ x: 0.5, y: 0.5, r: 0.46, c: PINK, a: 0.3 }, { x: 0.5, y: 0.5, r: 1.0, c: VIOLET, a: 0.24 }]
  }

  if (scene === 'shaders') {
    const cols = asp > 1 ? 7 : 4
    const span = asp > 1 ? 4.3 : 1.15
    for (let c = 0; c < cols; c++) {
      const cx = mix(-span, span, cols === 1 ? 0.5 : c / (cols - 1))
      const z = 6.6 + Math.abs(c - (cols - 1) / 2) * (asp > 1 ? 0.45 : 0.7) + (c % 2) * 0.55
      const style = c % 4
      const hgt = Math.round(mix(9, 15, rnd()))
      const top = -((hgt - 1) * 0.52) / 2 - 0.2
      for (let y = 0; y < hgt; y++) {
        const k = y / (hgt - 1)
        const jitter = style === 3 ? 0.14 : 0.05
        const t = style === 0 ? k : style === 1 ? (y % 2 ? 0.05 : 0.9) : style === 2 ? 0.5 + 0.5 * Math.sin(k * 6 + c) : 1 - k
        box([cx + (rnd() - 0.5) * jitter, top + y * 0.52, z + (rnd() - 0.5) * jitter], 0.5, {
          r: [0.28, 0.58 + (rnd() - 0.5) * 0.08, 0], glass: style === 1 && y % 2 === 1, tint: t, glow: style === 2 ? 0.2 : 0, line: style === 3 ? 1.5 : 1,
        })
      }
    }
    for (let i = 0; i < 90; i++) {
      const z = mix(3, 12, rnd())
      box([(rnd() - 0.5) * 2.4 * halfX(z), (rnd() - 0.5) * 2.4 * halfY(z), z], mix(0.05, 0.16, rnd()), { r: randRot(), glass: rnd() < 0.5 })
    }
    glow = [{ x: 0.5, y: 0.22, r: 0.8, c: VIOLET, a: 0.34 }, { x: 0.5, y: 0.86, r: 0.5, c: PINK, a: 0.1 }]
  }

  if (scene === 'custom') {
    const cols = asp > 1 ? 19 : 9
    const rows = asp > 1 ? 11 : 17
    const u = asp > 1 ? 1.05 : 0.86
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
      const nx = x / (cols - 1), ny = y / (rows - 1)
      const peel = asp > 1 ? clamp((nx - 0.5) * 2) : clamp((ny - 0.5) * 2)
      const pz = Math.pow(peel, 2.2) * 3.2 * (0.6 + rnd() * 0.8)
      const s = 0.5 * (1 - peel * 0.25)
      box(
        [(x - (cols - 1) / 2) * u + (rnd() - 0.5) * 0.02, (y - (rows - 1) / 2) * u, 9 - pz],
        [u * 0.92 * (1 - peel * 0.35), u * 0.92 * (1 - peel * 0.35), 0.12 + s * peel * 0.4],
        { r: [(rnd() - 0.5) * peel * 1.9 + 0.1, (rnd() - 0.5) * peel * 1.9 + 0.32, (rnd() - 0.5) * peel * 1.2], glass: rnd() < 0.3 + peel * 0.5, tint: asp > 1 ? nx : ny, line: 0.9 },
      )
    }
    glow = asp > 1
      ? [{ x: 0.82, y: 0.34, r: 0.62, c: PINK, a: 0.2 }, { x: 0.18, y: 0.7, r: 0.8, c: VIOLET, a: 0.2 }]
      : [{ x: 0.5, y: 0.8, r: 0.62, c: PINK, a: 0.18 }, { x: 0.5, y: 0.14, r: 0.7, c: VIOLET, a: 0.22 }]
  }

  if (scene === 'mapart') {
    const nx = asp > 1 ? 72 : 36, ny = asp > 1 ? 46 : 60
    const u = 0.26
    pitch = { o: [0, 0, 9], a: [0.98, 0.16, asp > 1 ? -0.12 : 0.06] }
    const tones = 7
    for (let x = 0; x < nx; x++) for (let y = 0; y < ny; y++) {
      const X = x / (nx - 1), Y = y / (ny - 1)
      // an abstract dune gradient quantised to a few tones, like a dithered map
      const v = Y + 0.1 * Math.sin(X * 8 + Y * 3) + 0.09 * Math.sin(X * 19 + 2)
      const dither = ((x ^ y) & 1 ? 0.5 : -0.5) / tones
      const q = Math.round(clamp(v + dither) * (tones - 1)) / (tones - 1)
      const gx = Math.floor(x / (nx / 4)), gy = Math.floor(y / (ny / 4))
      const seam = (x % Math.round(nx / 4) === 0 || y % Math.round(ny / 4) === 0) ? 0.06 : 0
      const h = 0.1 + q * 0.42
      box([(x - nx / 2) * u + gx * 0.05, -h / 2 + 0.2, 9 + (y - ny / 2) * u + gy * 0.05], [u - 0.012 - seam, h, u - 0.012 - seam], { tint: q, line: 0.42, glow: q * 0.5 - 0.1 })
    }
    for (let i = 0; i < 46; i++) {
      const z = mix(3, 12, rnd())
      box([(rnd() - 0.5) * 2 * halfX(z), (rnd() - 0.5) * 2 * halfY(z), z], mix(0.05, 0.2, rnd()), { r: randRot(), glass: true })
    }
    glow = [{ x: 0.5, y: 0.3, r: 0.9, c: VIOLET, a: 0.28 }, { x: 0.68, y: 0.14, r: 0.4, c: PINK, a: 0.14 }]
  }

  if (scene === 'prisms') {
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * TAU + rnd() * 0.25
      const r = mix(0.12, 1.25, Math.pow(rnd(), 0.75))
      const tall = mix(0.9, 2.6, 1 - r / 1.25) * mix(0.8, 1.2, rnd())
      const w = mix(0.18, 0.34, rnd())
      box([Math.cos(a) * r * 1.2, 1.15 - tall / 2 - (1.25 - r) * 0.5, 6.4 + Math.sin(a) * r * 1.2], [w, tall, w], { r: [Math.sin(a) * 0.2 * r, a * 2, -Math.cos(a) * 0.2 * r], glass: i % 3 !== 0, tint: 1 - r / 1.25 })
    }
    glow = [{ x: 0.42, y: 0.34, r: 0.75, c: VIOLET, a: 0.38 }, { x: 0.6, y: 0.7, r: 0.4, c: PINK, a: 0.14 }]
  }

  if (scene === 'island') {
    pitch = { o: [0, 0, 7], a: [0.56, 0.62, 0] }
    const R = 11
    const u = 0.27
    for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) {
      const d = Math.hypot(x, y) / R
      if (d > 1) continue
      const n = 0.5 + 0.28 * Math.sin(x * 0.7 + 1) * Math.cos(y * 0.6) + 0.18 * Math.sin((x + y) * 1.3)
      const top = (1 - d * d) * (0.35 + n * 0.5) * 1.1
      const bot = (1 - d) * (2.3 + n * 1.3)
      const h = top + bot + 0.1
      box([x * u, -top + h / 2, 7 + y * u], [u - 0.012, h, u - 0.012], { tint: clamp(1 - top * 1.25), line: 0.5 })
    }
    for (let i = 0; i < 40; i++) {
      const a = rnd() * TAU, r = mix(3.2, 4.3, rnd())
      box([Math.cos(a) * r, mix(-2.2, 1.4, rnd()), 7 + Math.sin(a) * r], mix(0.08, 0.3, rnd()), { r: randRot(), glass: rnd() < 0.6 })
    }
    glow = [{ x: 0.36, y: 0.26, r: 0.7, c: VIOLET, a: 0.34 }, { x: 0.6, y: 0.8, r: 0.5, c: PINK, a: 0.12 }]
  }

  if (scene === 'panels') {
    for (let i = 0; i < 9; i++) {
      const t = i / 8
      box([mix(-1.0, 0.9, t), mix(0.95, -0.95, t), mix(5.0, 8.8, t)], [2.5, 3.1, 0.07], { r: [-0.14, 0.58, 0.05], glass: true, tint: t })
    }
    for (let i = 0; i < 60; i++) {
      const z = mix(3, 11, rnd())
      box([(rnd() - 0.5) * 2 * halfX(z), (rnd() - 0.5) * 2 * halfY(z), z], mix(0.05, 0.16, rnd()), { r: randRot(), glass: rnd() < 0.3 })
    }
    glow = [{ x: 0.46, y: 0.42, r: 0.7, c: VIOLET, a: 0.34 }, { x: 0.66, y: 0.68, r: 0.4, c: PINK, a: 0.12 }]
  }

  if (scene === 'fracture') {
    const N = 7, u = 0.42
    for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) for (let z = 0; z < N; z++) {
      const p = [(x - 3) * u, (y - 3) * u, (z - 3) * u]
      const crack = Math.abs(p[0] * 0.8 - p[1] + 0.1 * Math.sin(p[2] * 7))
      const spread = crack < 0.22 ? 0 : 1 + (crack - 0.22) * 0.5
      if (crack < 0.22) continue
      const v = rot(p.map((c) => c * spread), [0.52, 0.72, 0])
      box([v[0], v[1], 7.4 + v[2]], u - 0.03, { r: [0.52, 0.72, 0], tint: 0.15, line: 0.42 })
    }
    glow = [{ x: 0.5, y: 0.5, r: 0.44, c: PINK, a: 0.18 }, { x: 0.32, y: 0.26, r: 0.8, c: VIOLET, a: 0.16 }]
  }

  if (scene === 'film') {
    // an empty strip of glass frames crossing the shot
    const n = asp > 1 ? 11 : 10
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1)
      const pos = asp > 1
        ? [mix(-halfX(6.4) * 1.1, halfX(6.4) * 1.1, t), mix(1.3, -1.3, t), mix(8, 5, t)]
        : [mix(0.75, -0.75, t), mix(-3.4, 3.4, t), mix(8, 5.5, t)]
      box(pos, asp > 1 ? [2.1, 1.25, 0.06] : [1.5, 0.95, 0.06], { r: [0.12, -0.36, 0.08], glass: true, tint: t })
      for (let k = 0; k < 6; k++) {
        const off = (k / 5 - 0.5) * (asp > 1 ? 1.9 : 1.3)
        const edge = asp > 1 ? 0.78 : 0.62
        box([pos[0] + off, pos[1] - edge, pos[2]], 0.09, { r: [0.12, -0.36, 0.08], tint: t })
        box([pos[0] + off, pos[1] + edge, pos[2]], 0.09, { r: [0.12, -0.36, 0.08], tint: t })
      }
    }
    for (let i = 0; i < 60; i++) {
      const z = mix(3, 13, rnd())
      box([(rnd() - 0.5) * 2.2 * halfX(z), (rnd() - 0.5) * 2.2 * halfY(z), z], mix(0.05, 0.2, rnd()), { r: randRot(), glass: rnd() < 0.3 })
    }
    glow = [{ x: 0.3, y: 0.3, r: 0.8, c: VIOLET, a: 0.34 }, { x: 0.76, y: 0.72, r: 0.5, c: PINK, a: 0.16 }]
  }

  if (scene === 'gallery') {
    // a corridor of glass panes, one for each way of looking at the menu
    const wide = asp > 1 ? 3.3 : 1.25
    for (const side of [-1, 1]) for (let i = 0; i < 11; i++) {
      const z = 3 + i * 1.15
      box([side * wide, 0, z], [0.06, 3.7, 1.0], { glass: true, tint: i / 10 })
      box([side * wide, 1.95, z], [0.32, 0.12, 1.02], { tint: i / 10, glow: 0.2 })
      box([side * wide, -1.95, z], [0.32, 0.12, 1.02], { tint: 1 - i / 10, line: 0.8 })
    }
    for (let i = 0; i < 44; i++) {
      const z = mix(3.5, 14, rnd())
      box([(rnd() - 0.5) * wide * 1.4, (rnd() - 0.5) * 3, z], mix(0.04, 0.13, rnd()), { r: randRot(), glass: rnd() < 0.5 })
    }
    glow = [{ x: 0.5, y: 0.5, r: 0.42, c: PINK, a: 0.34 }, { x: 0.5, y: 0.46, r: 0.9, c: VIOLET, a: 0.28 }]
  }

  if (scene === 'chapters') {
    // a fan of thin slabs, like pages caught mid-turn
    const n = 30
    const k = asp > 1 ? 1 : 0.55
    for (let i = 0; i < n; i++) {
      const a = mix(-1.15, 1.15, i / (n - 1))
      box([Math.sin(a) * 2.3 * k, 0.15, 8.6 - Math.cos(a) * 1.3], [2.5 * k, 3.5 * k, 0.05], { r: [0, a, 0], glass: i % 3 !== 0, tint: i / (n - 1), line: 0.7 })
    }
    for (let i = 0; i < 70; i++) {
      const z = mix(3, 13, rnd())
      box([(rnd() - 0.5) * 2.2 * halfX(z), (rnd() - 0.5) * 2.2 * halfY(z), z], mix(0.05, 0.2, rnd()), { r: randRot(), glass: rnd() < 0.4 })
    }
    glow = [{ x: 0.5, y: 0.34, r: 0.72, c: VIOLET, a: 0.32 }, { x: 0.5, y: 0.78, r: 0.42, c: PINK, a: 0.14 }]
  }

  /* ---------- paint ---------- */
  g.fillStyle = rgb(BG); g.fillRect(0, 0, W, H)
  const D = Math.max(W, H)
  for (const L of glow) {
    const rg = g.createRadialGradient(L.x * W, L.y * H, 0, L.x * W, L.y * H, L.r * D)
    rg.addColorStop(0, rgb(L.c, L.a * 0.42)); rg.addColorStop(0.5, rgb(L.c, L.a * 0.1)); rg.addColorStop(1, rgb(L.c, 0))
    g.fillStyle = rg; g.fillRect(0, 0, W, H)
  }
  const depth = (b) => { const c = pitch ? rot(b.c.map((x, i) => x - pitch.o[i]), pitch.a)[2] + pitch.o[2] : b.c[2]; return c }
  items.sort((a, b) => depth(b) - depth(a))
  for (const b of items) drawBox(b, pitch)

  // bloom
  const copy = document.createElement('canvas')
  copy.width = W; copy.height = H
  const cg = copy.getContext('2d')
  cg.drawImage(cv, 0, 0)
  const u = D / 1920
  g.globalCompositeOperation = 'lighter'
  g.filter = `blur(${9 * u}px) brightness(.55) contrast(2.6)`; g.globalAlpha = 0.42; g.drawImage(copy, 0, 0)
  g.filter = `blur(${42 * u}px) brightness(.5) contrast(2.4)`; g.globalAlpha = 0.3; g.drawImage(copy, 0, 0)
  g.filter = 'none'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'

  // vignette (never fully black, so masks melt into the atmosphere)
  const vg = g.createRadialGradient(W / 2, H / 2, D * 0.28, W / 2, H / 2, D * 0.8)
  vg.addColorStop(0, 'rgba(6,3,12,0)'); vg.addColorStop(1, 'rgba(6,3,12,.78)')
  g.fillStyle = vg; g.fillRect(0, 0, W, H)
  return cv.toDataURL('image/png')
}

const want = process.argv.slice(2)
mkdirSync(OUT, { recursive: true }); mkdirSync(TMP, { recursive: true })
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'shell', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('about:blank')
for (const [name, scene, [w, h], seed] of JOBS) {
  if (want.length && !want.includes(name) && !want.includes(scene)) continue
  const url = await page.evaluate(render, { W: Math.round(w * SS), H: Math.round(h * SS), scene, seed })
  const png = join(TMP, `${name}.png`)
  writeFileSync(png, Buffer.from(url.split(',')[1], 'base64'))
  const out = join(OUT, `${name}.webp`)
  execFileSync('magick', [png, '-strip', '-resize', `${w}x${h}!`, '-quality', '76', '-define', 'webp:method=6', out])
  console.log(name)
}
await browser.close()
if (want.length === 0) rmSync(join(TMP, '.keep'), { force: true })
