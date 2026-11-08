// Writes the static pages: / (detects the language), /es/ and /en/, plus sitemap.xml.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { render, DICTS, AUTHOR } from '../.ssr/entry-server.js'

const SITE = 'https://elgatolinux.github.io/gatyo-site/'
const PAGES = [
  { path: '', lang: 'es', fixed: false, url: SITE },
  { path: 'es/', lang: 'es', fixed: true, url: `${SITE}es/` },
  { path: 'en/', lang: 'en', fixed: true, url: `${SITE}en/` },
]
const LOCALE = { es: 'es_ES', en: 'en_US' }
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function replaceOnce(html, from, to) {
  if (typeof from === 'string' ? !html.includes(from) : !from.test(html)) throw new Error(`prerender: not found: ${from}`)
  return html.replace(from, () => to)
}

const template = readFileSync('dist/index.html', 'utf8')

for (const { path, lang, fixed, url } of PAGES) {
  const { title, description } = DICTS[lang].meta
  const other = lang === 'es' ? 'en' : 'es'
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', name: 'Gatyo', url: SITE, inLanguage: ['es', 'en'] },
      {
        '@type': 'SoftwareApplication',
        name: 'Gatyo',
        url,
        description,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Android',
        softwareVersion: '1.0.0',
        author: { '@type': 'Person', name: AUTHOR },
      },
    ],
  }).replace(/</g, '\\u003c')

  const head = [
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="es" href="${SITE}es/" />`,
    `<link rel="alternate" hreflang="en" href="${SITE}en/" />`,
    `<link rel="alternate" hreflang="x-default" href="${SITE}" />`,
    `<meta property="og:locale" content="${LOCALE[lang]}" />`,
    `<meta property="og:locale:alternate" content="${LOCALE[other]}" />`,
    `<script type="application/ld+json">${jsonLd}</script>`,
  ].join('\n    ')

  let html = template
  html = replaceOnce(html, '<html lang="es">', fixed ? `<html lang="${lang}" data-fixed-lang="${lang}">` : `<html lang="${lang}">`)
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
  html = replaceOnce(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`)
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(title)}" />`)
  html = replaceOnce(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(description)}" />`)
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
  html = replaceOnce(html, '</head>', `    ${head}\n  </head>`)
  html = replaceOnce(html, '<div id="root"></div>', `<div id="root">${render(lang)}</div>`)

  mkdirSync(`dist/${path}`, { recursive: true })
  writeFileSync(`dist/${path}index.html`, html)
}

const today = new Date().toISOString().slice(0, 10)
const alternates = ['es', 'en'].map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${l}/" />`).concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}" />`).join('\n')
const entries = PAGES.map(({ url }) => `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n${alternates}\n  </url>`).join('\n')
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries}\n</urlset>\n`)
console.log('prerendered:', PAGES.map((p) => `/${p.path}`).join(' '), '+ sitemap.xml')
