import { useRef, type ReactNode } from 'react'
import { useI18n } from '../i18n/I18n'
import { asset, FULL, gsap, LITE, liteReveal, useMotion } from '../lib/motion'

export function Slate({ n }: { n: keyof ReturnType<typeof useI18n>['t']['slates'] }) {
  const { t } = useI18n()
  return (
    <p className="slate" data-rv>
      <span aria-hidden="true" className="slate-tick" />
      SC.{n} / {t.slates[n]}
    </p>
  )
}

export function SceneBg({ art, eager = false }: { art: string; eager?: boolean }) {
  return (
    <div className="scene-bg" aria-hidden="true">
      <picture>
        <source media="(min-width: 768px)" srcSet={asset(`media/art/${art}-w.webp`)} />
        <img src={asset(`media/art/${art}-p.webp`)} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />
      </picture>
    </div>
  )
}

export function Glass({ children, ratio, className = '', reveal = false }: { children: ReactNode; ratio?: string; className?: string; reveal?: boolean }) {
  return (
    <div className={`glass ${className}`} style={ratio ? ({ '--ar': ratio } as React.CSSProperties) : undefined}>
      <div className="glass-in" data-reveal={reveal ? '' : undefined}>
        {children}
      </div>
    </div>
  )
}

/** Non-pinned scene: masked background, the shared dissolve in and out, matched parallax. */
export function Scene({
  n,
  art,
  children,
  last = false,
  eager = false,
  className = '',
}: {
  n: string
  art: string
  children: ReactNode
  last?: boolean
  eager?: boolean
  className?: string
}) {
  const ref = useRef<HTMLElement>(null)

  useMotion(ref, (mm, root) => {
    mm.add(FULL, () => {
      const enter = root.querySelector('[data-in]')
      const leave = root.querySelector('[data-out]')
      if (n !== '01') {
        gsap.fromTo(enter, { opacity: 0, y: 40 }, {
          opacity: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: root, start: 'top 75%', end: 'top 25%', scrub: true },
        })
      }
      if (!last) {
        gsap.to(leave, {
          opacity: 0.15, scale: 0.97, ease: 'none',
          scrollTrigger: { trigger: root, start: 'bottom 62%', end: 'bottom 28%', scrub: true },
        })
      }
      const img = root.querySelector('.scene-bg img')
      if (img) {
        gsap.fromTo(img, { yPercent: -5 }, {
          yPercent: 5, ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      }
      root.querySelectorAll('[data-reveal]').forEach((el) => {
        const inner = el.querySelector('img, video')
        gsap.fromTo(el, { clipPath: 'inset(12% round 18px)' }, {
          clipPath: 'inset(0% round 18px)', ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 48%', scrub: true },
        })
        if (inner) {
          gsap.fromTo(inner, { scale: 1.2 }, {
            scale: 1, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 48%', scrub: true },
          })
        }
      })
    })
    mm.add(LITE, () => liteReveal(root))
  })

  return (
    <section ref={ref} id={`sc-${n}`} data-scene={n} className={`scene ${className}`}>
      <SceneBg art={art} eager={eager} />
      <div data-out className="scene-layer">
        <div data-in className="scene-in">
          {children}
        </div>
      </div>
    </section>
  )
}
