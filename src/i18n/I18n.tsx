import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DICTS, type Dict, type Lang } from './dict'

const KEY = 'gatyo-lang'

function detect(): Lang {
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

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect)
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
