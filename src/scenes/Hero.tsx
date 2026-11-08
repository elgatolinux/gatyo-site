import { useLayoutEffect, useRef } from 'react'
import { Scene } from '../components/Scene'
import { useI18n } from '../i18n/I18n'
import { gsap } from '../lib/motion'

const WORD = 'gatyo'.split('')

export function Hero() {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const chars = root.querySelectorAll('.hero-ch')
    const rest = root.querySelectorAll('.hero-fade')
    // never full opacity 0, so the text still counts as painted for LCP
    gsap.set(chars, { yPercent: 16, opacity: 0.02 })
    gsap.set(rest, { y: 18, opacity: 0.02 })
    const play = () => {
      gsap.to(chars, { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.04, delay: 0.12 })
      gsap.to(rest, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.4 })
    }
    if (document.documentElement.classList.contains('is-in')) play()
    else window.addEventListener('gatyo:in', play, { once: true })
    return () => window.removeEventListener('gatyo:in', play)
  }, [])

  return (
    <Scene n="01" art="hero" eager className="scene--hero">
      <div ref={ref} className="hero">
        <p className="slate hero-fade">
          <span aria-hidden="true" className="slate-tick" />
          SC.01 / {t.slates['01']}
        </p>
        <h1 className="hero-word" aria-label="Gatyo">
          {WORD.map((c, i) => (
            <span key={i} className="hero-ch" aria-hidden="true">
              {c}
            </span>
          ))}
        </h1>
        <p className="hero-phrase hero-fade">{t.hero.phrase}</p>
        <p className="hero-compat hero-fade">{t.hero.compat}</p>
        <p className="hero-rel hero-fade">{t.hero.release}</p>
      </div>
      <p className="hero-scroll hero-fade" aria-hidden="true">
        {t.hero.scroll}
        <span />
      </p>
    </Scene>
  )
}
