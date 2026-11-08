// Screenshot sweep, console sweep and LCP. Usage: node tools/shoot.mjs <url> <outdir> [desktop|mobile|reduced|mobile-reduced]
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const [url, out, mode = 'desktop'] = process.argv.slice(2)
const CHROME = process.env.CHROME_PATH
mkdirSync(out, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const MODES = {
  desktop: { width: 1440, height: 900, mobile: false, reduced: false },
  mobile: { width: 360, height: 800, mobile: true, reduced: false },
  mobile390: { width: 390, height: 844, mobile: true, reduced: false },
  reduced: { width: 1440, height: 900, mobile: false, reduced: true },
  laptop: { width: 1280, height: 720, mobile: false, reduced: false },
  tablet: { width: 820, height: 1180, mobile: true, reduced: false },
}
const cfg = MODES[mode]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'shell', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage()
await page.setViewport({ width: cfg.width, height: cfg.height, isMobile: cfg.mobile, hasTouch: cfg.mobile, deviceScaleFactor: 1 })
if (cfg.reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])

if (process.env.SHOT_LANG) await page.evaluateOnNewDocument((l) => localStorage.setItem('gatyo-lang', l), process.env.SHOT_LANG)

if (process.env.SHOT_ACCENT) await page.evaluateOnNewDocument((a) => localStorage.setItem('gatyo-accent', a), process.env.SHOT_ACCENT)

const problems = []
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) problems.push(`console.${m.type()}: ${m.text()}`) })
page.on('requestfailed', (r) => { if (!/\.mp4/.test(r.url())) problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`) })
page.on('response', (r) => { if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`) })

await page.evaluateOnNewDocument(() => {
  window.__lcp = 0
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__lcp = e.startTime; window.__lcpEl = e.element?.tagName + '.' + (e.element?.className || '') } }).observe({ type: 'largest-contentful-paint', buffered: true })
})

await page.goto(url, { waitUntil: 'load' })
await sleep(2600)
const lcp = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), el: window.__lcpEl }))

const info = await page.evaluate(() => {
  const h = innerHeight
  const scenes = [...document.querySelectorAll('[data-scene]')].map((s) => {
    const r = s.getBoundingClientRect()
    return { n: s.dataset.scene, top: Math.round(r.top + scrollY), h: Math.round(r.height), pin: !!s.dataset.pin }
  })
  return { vh: h, total: document.documentElement.scrollHeight, scenes, overflowX: document.documentElement.scrollWidth - innerWidth }
})

const go = async (y, wait = 1300) => {
  await page.evaluate((y) => { window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y) }, y)
  await sleep(wait)
}

// Every scene at its mid-point, each pinned scene at several depths, and the dissolve between scenes.
const stops = []
for (const s of info.scenes) {
  if (s.pin) {
    const run = s.h - info.vh
    for (const p of [0, 0.2, 0.33, 0.5, 0.7, 0.88, 1]) stops.push([`${s.n}-pin${String(Math.round(p * 100)).padStart(3, '0')}`, s.top + run * p])
  } else {
    stops.push([`${s.n}-mid`, s.top + Math.max(0, (s.h - info.vh) / 2)])
  }
}
for (let i = 1; i < info.scenes.length; i++) {
  stops.push([`t${info.scenes[i - 1].n}-${info.scenes[i].n}`, info.scenes[i].top - info.vh * 0.42])
}
stops.push(['end', info.total])

let idx = 0
stops.sort((a, b) => a[1] - b[1])
for (const [name, y] of stops) {
  await go(y)
  await page.screenshot({ path: `${out}/${String(idx++).padStart(2, '0')}-${name}.jpg`, type: 'jpeg', quality: 62 })
}

const after = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth - innerWidth, video: (() => { const v = document.querySelector('video'); return v && { src: v.currentSrc, ready: v.readyState, muted: v.muted } })() }))
console.log(JSON.stringify({ mode, viewports: +(info.total / info.vh).toFixed(1), total: info.total, vh: info.vh, overflowX: info.overflowX, after, lcp, scenes: info.scenes.map((s) => `${s.n}:${(s.h / info.vh).toFixed(1)}${s.pin ? 'p' : ''}`).join(' ') }))
console.log(problems.length ? [...new Set(problems)].join('\n') : 'no console problems')
await browser.close()
