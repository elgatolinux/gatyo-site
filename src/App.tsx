import { useEffect, useLayoutEffect } from 'react'
import { Hud } from './components/Hud'
import { Custom } from './scenes/Custom'
import { Final } from './scenes/Final'
import { FlipBook } from './scenes/FlipBook'
import { Gallery } from './scenes/Gallery'
import { Hero } from './scenes/Hero'
import { Mapart } from './scenes/Mapart'
import { Promo } from './scenes/Promo'
import { Shaders } from './scenes/Shaders'
import { FULL, gsap, ScrollTrigger, scrollToScene, startSmooth } from './lib/motion'

export default function App() {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add(FULL, () => startSmooth())
    return () => mm.revert()
  }, [])

  useEffect(() => {
    let alive = true
    const settle = () => {
      if (!alive) return
      ScrollTrigger.refresh()
      if (location.hash) scrollToScene(location.hash, true)
    }
    settle()
    window.__gatyoReady?.()
    document.fonts?.ready.then(settle)

    const onLang = () => requestAnimationFrame(() => ScrollTrigger.refresh())
    const onHash = () => scrollToScene(location.hash, true)
    window.addEventListener('gatyo:lang', onLang)
    window.addEventListener('hashchange', onHash)
    return () => {
      alive = false
      window.removeEventListener('gatyo:lang', onLang)
      window.removeEventListener('hashchange', onHash)
    }
  }, [])

  return (
    <>
      <div className="atmo" aria-hidden="true">
        <div className="atmo-fog" />
      </div>
      <Hud />
      <main>
        <Hero />
        <Promo />
        <Shaders />
        <Gallery />
        <Custom />
        <FlipBook />
        <Mapart />
        <Final />
      </main>
      <div className="grain" aria-hidden="true" />
    </>
  )
}
