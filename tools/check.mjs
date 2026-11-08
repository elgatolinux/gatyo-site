// Behaviour checks. Usage: node tools/check.mjs <url>
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const url = process.argv[2]
const SHOTS = process.argv[3] || '.verify/check'
mkdirSync(SHOTS, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: 'shell', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
const DISCORD = 'https://discord.gg/Hpzua3uQmV'
const results = []
const report = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`) }

async function fresh(vp, opts = {}) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  await page.setViewport(vp)
  if (opts.reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  if (opts.langs) await page.evaluateOnNewDocument((l) => Object.defineProperty(navigator, 'languages', { get: () => l }), opts.langs)
  return { ctx, page }
}
const DESK = { width: 1440, height: 900 }
const PHONE = { width: 360, height: 800, isMobile: true, hasTouch: true }

// --- LCP on a mid-range phone profile, cold cache
for (const vp of [{ width: 360, height: 800, isMobile: true, hasTouch: true }, { width: 390, height: 844, isMobile: true, hasTouch: true }]) {
  const { ctx, page } = await fresh(vp)
  const cdp = await page.createCDPSession()
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.evaluateOnNewDocument(() => {
    window.__lcp = 0
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__lcp = e.startTime; window.__lcpEl = (e.element?.tagName || '') + '.' + (e.element?.className || '') } }).observe({ type: 'largest-contentful-paint', buffered: true })
  })
  const mp4 = []
  page.on('request', (r) => { if (r.url().includes('.mp4')) mp4.push(r.url()) })
  let bytes = 0
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength })
  await page.goto(url, { waitUntil: 'load', timeout: 60000 })
  await sleep(6000)
  const r = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), el: window.__lcpEl, pre: !!document.getElementById('pre') }))
  report(`LCP slow-4G + 4x CPU ${vp.width}x${vp.height}`, r.lcp > 0 && r.lcp <= 2500, `${r.lcp} ms on ${r.el}, first-view ${(bytes / 1024).toFixed(0)} KB`)
  report(`video not requested before scrolling ${vp.width}`, mp4.length === 0, `${mp4.length} requests`)
  report(`preloader gone ${vp.width}`, !r.pre)
  await ctx.close()
}

// --- sound button, video lazy + pause off-screen
{
  const { ctx, page } = await fresh(DESK)
  const mp4 = []
  page.on('request', (r) => { if (r.url().includes('.mp4')) mp4.push(r.url()) })
  await page.goto(url, { waitUntil: 'load' })
  await sleep(2600)
  report('desktop: no video request at top', mp4.length === 0)
  const y = await page.evaluate(() => { const v = document.querySelector('video'); const r = document.querySelector('#sc-02').getBoundingClientRect(); return r.top + scrollY + v.closest('.glass').offsetTop * 0 + 340 })
  await page.evaluate((y) => window.__lenis.scrollTo(y, { immediate: true, force: true }), y)
  await sleep(2400)
  const st0 = await page.evaluate(() => { const v = document.querySelector('video'); return { src: !!v.currentSrc, muted: v.muted, paused: v.paused, t: v.currentTime, loop: v.loop } })
  report('video loaded, muted, looping, playing', st0.src && st0.muted && !st0.paused && st0.loop, JSON.stringify(st0))
  const btn = '.ctl--hi'
  const label0 = await page.$eval(btn, (b) => b.textContent)
  await page.click(btn)
  await sleep(300)
  const st1 = await page.evaluate((btn) => { const v = document.querySelector('video'); const b = document.querySelector(btn); return { muted: v.muted, paused: v.paused, pressed: b.getAttribute('aria-pressed'), label: b.textContent, volume: v.volume } }, btn)
  report('sound button unmutes', !st1.muted && st1.pressed === 'true' && st1.label !== label0 && !st1.paused, `"${label0}" -> "${st1.label}"`)
  await page.evaluate(() => window.__lenis.scrollTo(document.documentElement.scrollHeight, { immediate: true, force: true }))
  await sleep(1200)
  report('video pauses off-screen (no stray sound)', await page.evaluate(() => document.querySelector('video').paused))
  const links = await page.$$eval('a[href*="discord"]', (a) => a.map((x) => ({ href: x.href, text: x.textContent, cls: x.className })))
  const cta = links.find((l) => l.cls === 'cta')
  report('Discord CTA link', cta?.href === DISCORD, cta?.href)
  report('every discord link is correct', links.every((l) => l.href === DISCORD), `${links.length} links`)
  const banned = await page.evaluate(() => /descarga|download|\.apk|indetectable|undetect|anti-?ban|anillo de objetivo|target ring/i.exec(document.body.innerText)?.[0] ?? '')
  report('no banned claims in the copy', banned === '', banned)
  await ctx.close()
}

// --- keyboard
{
  const { ctx, page } = await fresh(DESK)
  await page.goto(url, { waitUntil: 'load' })
  await sleep(2600)
  let presses = 0, last = -1, stuck = 0
  for (; presses < 80; presses++) {
    await page.keyboard.press('PageDown')
    await sleep(260)
    const s = await page.evaluate(() => ({ y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight }))
    if (s.y >= s.max - 2) { last = s.y; break }
    stuck = s.y === last ? stuck + 1 : 0
    last = s.y
    if (stuck > 6) break
  }
  const end = await page.evaluate(() => ({ y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight }))
  report('PageDown reaches the end (not trapped in pins)', end.y >= end.max - 2, `${presses + 1} presses, y=${end.y}/${end.max}`)

  await page.evaluate(() => window.__lenis.scrollTo(0, { immediate: true, force: true }))
  await sleep(600)
  const seen = []
  let visibleAll = true
  for (let i = 0; i < 24; i++) {
    await page.keyboard.press('Tab')
    await sleep(420)
    const f = await page.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { tag: a.tagName, text: (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 22), cls: a.className, on: r.bottom > 0 && r.top < innerHeight, y: Math.round(scrollY) } })
    if (f.tag === 'BODY') break
    seen.push(f.text)
    if (!f.on && f.cls !== 'skip') visibleAll = false
    if (f.cls === 'cta') break
  }
  report('Tab reaches the CTA, focus stays visible', seen.at(-1)?.length > 0 && visibleAll, seen.join(' | '))
  await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); await sleep(300)
  report('Shift+Tab goes back (no trap)', await page.evaluate(() => document.activeElement.className !== 'cta'))
  await ctx.close()
}

// --- reduced motion + phone: nothing hidden, no pins
for (const [name, vp, opts] of [['reduced desktop', DESK, { reduced: true }], ['reduced phone', PHONE, { reduced: true }], ['phone', PHONE, {}]]) {
  const { ctx, page } = await fresh(vp, opts)
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(url, { waitUntil: 'load' })
  await sleep(1800)
  const max = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < max; y += Math.round(vp.height * 0.7)) { await page.evaluate((y) => scrollTo(0, y), y); await sleep(140) }
  await sleep(900)
  const r = await page.evaluate(() => {
    const hidden = [...document.querySelectorAll('[data-rv], .gal-frame, .face, h2, h3')].filter((e) => { const s = getComputedStyle(e); return +s.opacity < 0.95 || s.visibility === 'hidden' || e.getBoundingClientRect().height === 0 }).map((e) => e.className || e.tagName)
    return { hidden, pin: !!document.querySelector('.is-pin,.is-book'), lenis: !!window.__lenis, frames: document.querySelectorAll('.gal-frame').length, faces: document.querySelectorAll('.face').length, overflow: document.documentElement.scrollWidth - innerWidth, pre: !!document.getElementById('pre') }
  })
  report(`${name}: no pins, all content visible`, !r.pin && !r.lenis && r.hidden.length === 0 && r.overflow <= 0 && errs.length === 0, JSON.stringify(r))
  await ctx.close()
}

// --- languages
for (const [langs, want] of [[['fr-FR', 'fr'], 'es'], [['en-US'], 'en'], [['es-MX'], 'es'], [['de', 'en'], 'en']]) {
  const { ctx, page } = await fresh(DESK, { langs })
  await page.goto(url, { waitUntil: 'load' })
  await sleep(600)
  const got = await page.evaluate(() => document.documentElement.lang)
  report(`language detection ${langs.join(',')}`, got === want, got)
  await ctx.close()
}
{
  const { ctx, page } = await fresh(DESK, { langs: ['fr'] })
  await page.goto(url, { waitUntil: 'load' })
  await sleep(2400)
  await page.click('.lang button:nth-child(2)')
  await sleep(400)
  const a = await page.evaluate(() => ({ lang: document.documentElement.lang, title: document.title, phrase: document.querySelector('.hero-phrase').textContent }))
  await page.reload({ waitUntil: 'load' })
  await sleep(1000)
  const b = await page.evaluate(() => document.documentElement.lang)
  report('selector switches and is remembered', a.lang === 'en' && b === 'en' && /Client for/.test(a.title), `${a.phrase} / after reload ${b}`)
  await ctx.close()
}

// --- accent picker
for (const [name, vp] of [['desktop', DESK], ['phone', PHONE]]) {
  const { ctx, page } = await fresh(vp)
  await page.goto(url, { waitUntil: 'load' })
  await sleep(2400)
  const css = () => page.evaluate(() => { const c = getComputedStyle(document.documentElement); return { accent: c.getPropertyValue('--accent-rgb').trim(), attr: document.documentElement.getAttribute('data-accent') } })
  const before = await css()
  const n = await page.$$eval('.dots button', (b) => b.length)
  await page.evaluate(() => document.querySelector('.dots button[data-accent="cyan"]').click())
  await sleep(200)
  const after = await css()
  const pressed = await page.$$eval('.dots button[aria-pressed="true"]', (b) => b.map((x) => x.dataset.accent))
  const heroColorChanged = await page.evaluate(() => getComputedStyle(document.querySelector('.cta')).backgroundImage.includes('103, 232, 249') || getComputedStyle(document.querySelector('.cta')).backgroundImage.includes('103 232 249'))
  await page.reload({ waitUntil: 'load' })
  await sleep(1200)
  const kept = await css()
  const target = await page.evaluate(() => { const d = document.querySelector('.dots button'); const r = d.getBoundingClientRect(); return { w: r.width, h: r.height, wrapped: document.documentElement.scrollWidth - innerWidth } })
  report(`accent picker ${name}`, before.accent === '168 85 247' && n === 7 && after.accent === '34 211 238' && pressed.join() === 'cyan' && heroColorChanged && kept.accent === '34 211 238' && target.wrapped <= 0, JSON.stringify({ before: before.accent, after: after.accent, kept: kept.attr, ...target }))
  await ctx.close()
}

// --- hard-load deep links
for (const [vpName, vp] of [['desktop', DESK], ['phone', PHONE]]) {
  for (const n of ['04', '06', '08']) {
    const { ctx, page } = await fresh(vp)
    await page.goto(`${url}#sc-${n}`, { waitUntil: 'load' })
    await sleep(2800)
    const r = await page.evaluate((n) => { const t = document.querySelector(`#sc-${n}`).getBoundingClientRect(); return { top: Math.round(t.top), bottom: Math.round(t.bottom), y: Math.round(scrollY), vh: innerHeight, text: document.body.innerText.length } }, n)
    report(`deep link #sc-${n} ${vpName}`, r.top <= 2 && r.bottom > r.vh * 0.5 && r.y > 0 && r.text > 200, JSON.stringify(r))
    await page.screenshot({ path: `${SHOTS}/deep-${vpName}-${n}.jpg`, type: 'jpeg', quality: 60 })
    await ctx.close()
  }
}

await browser.close()
const failed = results.filter((x) => !x).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
