import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DICTS, type Dict, type Lang } from './dict'

const KEY = 'gatyo-lang'

function detect(): Lang {
  // /es/ and /en/ are fixed by their URL; only the main address detects.
  const fixed = document.documentElement.dataset.fixedLang
  if (fixed === 'es' || fixed === 'en') return fixed
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'es' || saved === 'en') return saved
  } catch {
    /* storage may be blocked */
  }
  for (const l of navigator.languages ?? [navigator.language]) {
    const base = l.toLowerCase().split('-')[0]
    if (base === 'es') return 'es'
    if (base === 'en') return 'en'
  }
  return 'es'
}

const Ctx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void } | null>(null)

export const langPath = (l: Lang) => `${import.meta.env.BASE_URL}${l}/`

export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initialLang ?? detect())
  const t = DICTS[lang]

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
    window.dispatchEvent(new Event('gatyo:lang'))
  }, [lang, t])

  const value = useMemo(
    () => ({
      lang,
      t,
      setLang: (l: Lang) => {
        setLangState(l)
        document.documentElement.dataset.fixedLang = l
        history.replaceState(null, '', langPath(l) + location.hash)
        document.querySelector('link[rel="canonical"]')?.setAttribute('href', location.origin + langPath(l))
        try {
          localStorage.setItem(KEY, l)
        } catch {
          /* storage may be blocked */
        }
      },
    }),
    [lang, t],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n outside provider')
  return v
}
