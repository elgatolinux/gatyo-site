// The same seven accents as the client. Colors live in index.css, under [data-accent].
export const ACCENTS = ['violet', 'pink', 'lavender', 'cyan', 'mint', 'amber', 'coral'] as const
export type Accent = (typeof ACCENTS)[number]

const KEY = 'gatyo-accent'

export function getAccent(): Accent {
  const current = document.documentElement.getAttribute('data-accent')
  return ACCENTS.includes(current as Accent) ? (current as Accent) : 'violet'
}

export function setAccent(a: Accent) {
  document.documentElement.setAttribute('data-accent', a)
  try {
    localStorage.setItem(KEY, a)
  } catch {
    /* storage may be blocked: the color still applies for this visit */
  }
}
