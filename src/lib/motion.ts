import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)
export { gsap, ScrollTrigger }

/** Pins, scrub and smooth scroll: wide enough, tall enough, motion allowed. */
export const FULL = '(min-width: 1000px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)'
/** Phones and short screens: everything stacked, one light fade per block. */
export const LITE =
  '(max-width: 999px) and (prefers-reduced-motion: no-preference), (max-height: 559px) and (prefers-reduced-motion: no-preference)'

declare global {
  interface Window {
    __lenis?: Lenis
    __gatyoReady?: () => void
  }
}

export const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`

export function startSmooth() {
  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 })
  window.__lenis = lenis
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (t: number) => lenis.raf(t * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis.destroy()
    window.__lenis = undefined
  }
}

export function scrollToY(y: number, immediate = false) {
  const lenis = window.__lenis
  if (lenis) lenis.scrollTo(y, { immediate, force: true, duration: 1.2 })
  else window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' })
}

/** Scrolls to a scene. Pinned scenes start at their top; the rest skip the dissolve overlap. */
export function scrollToScene(hash: string, immediate = false) {
  const el = document.querySelector<HTMLElement>(hash)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  const skip = el.dataset.pin ? 0 : el.previousElementSibling ? window.innerHeight * 0.18 : 0
  scrollToY(top + skip, immediate)
}

/** Builds motion inside gsap.matchMedia so everything reverts on unmount or breakpoint change. */
export function useMotion<T extends HTMLElement>(
  ref: RefObject<T | null>,
  setup: (mm: gsap.MatchMedia, root: T) => void,
) {
  useLayoutEffect(() => {
    if (!ref.current) return
    const mm = gsap.matchMedia()
    setup(mm, ref.current)
    return () => mm.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** The one entry fade used on phones. */
export function liteReveal(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-rv]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } },
    )
  })
}
