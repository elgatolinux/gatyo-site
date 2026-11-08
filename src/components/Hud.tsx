import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18n'
import { DISCORD_URL, type Lang } from '../i18n/dict'
import { scrollToScene } from '../lib/motion'

const SCENES = ['01', '02', '03', '04', '05', '06', '07', '08'] as const
type SceneId = (typeof SCENES)[number]

export function Hud() {
  const { t, lang, setLang } = useI18n()
  const [current, setCurrent] = useState<SceneId>('01')
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-scene]')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setCurrent((e.target as HTMLElement).dataset.scene as SceneId)
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    els.forEach((el) => io.observe(el))

    let queued = false
    const paint = () => {
      queued = false
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
    }
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(paint)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    paint()
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const go = (e: React.MouseEvent<HTMLAnchorElement>, n: string) => {
    e.preventDefault()
    history.pushState(null, '', `#sc-${n}`)
    scrollToScene(`#sc-${n}`)
  }

  return (
    <>
      <a className="skip" href={DISCORD_URL}>
        {t.nav.skip}
      </a>
      <div className="hud-progress" aria-hidden="true">
        <div ref={bar} />
      </div>
      <header className="hud">
        <a href="#sc-01" className="hud-brand" aria-label={t.nav.top} onClick={(e) => go(e, '01')}>
          gatyo
        </a>
        <p className="hud-slate" aria-hidden="true">
          SC.{current} / {t.slates[current]}
        </p>
        <div className="lang" role="group" aria-label={t.nav.language}>
          {(['es', 'en'] as Lang[]).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <nav className="rail" aria-label={t.nav.scenes}>
        {SCENES.map((n) => (
          <a
            key={n}
            href={`#sc-${n}`}
            aria-label={`SC.${n} ${t.slates[n]}`}
            aria-current={current === n ? 'true' : undefined}
            onClick={(e) => go(e, n)}
          />
        ))}
      </nav>
    </>
  )
}
