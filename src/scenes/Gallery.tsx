import { useRef, useState } from 'react'
import { Glass, SceneBg, Slate } from '../components/Scene'
import { useI18n } from '../i18n/I18n'
import { asset, FULL, gsap, LITE, liteReveal, scrollToY, useMotion } from '../lib/motion'

const SHOTS = ['panel', 'clickgui', 'cards', 'glass']
const N = SHOTS.length
const startAt = (i: number) => i - 1 + 0.35 // i = 1..N-1
const TOTAL = startAt(N - 1) + 0.95

export function Gallery() {
  const { t } = useI18n()
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)

  useMotion(ref, (mm, root) => {
    mm.add(FULL, () => {
      root.classList.add('is-pin')
      root.dataset.pin = '1'
      const imgs = gsap.utils.toArray<HTMLElement>('.gal-img', root)
      const caps = gsap.utils.toArray<HTMLElement>('.gal-cap', root)
      const inner = gsap.utils.toArray<HTMLElement>('.gal-img img', root)
      gsap.set(imgs.slice(1), { opacity: 0 })
      gsap.set(caps.slice(1), { opacity: 0, y: 18 })
      gsap.set(inner, { scale: 1.08 })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.querySelector('.gal-run'),
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          onUpdate: (self) => {
            const time = self.progress * TOTAL
            let idx = 0
            for (let i = 1; i < N; i++) if (time > startAt(i) + 0.3) idx = i
            if (idx !== activeRef.current) {
              activeRef.current = idx
              setActive(idx)
            }
          },
        },
      })
      tl.to({}, { duration: TOTAL }, 0)
      for (let i = 1; i < N; i++) {
        const at = startAt(i)
        tl.to(imgs[i - 1], { scale: 1.06, opacity: 0, ease: 'power1.inOut', duration: 0.6 }, at)
        tl.fromTo(
          imgs[i],
          { scale: 1.12, opacity: 0, clipPath: 'inset(6% round 24px)' },
          { scale: 1, opacity: 1, clipPath: 'inset(0% round 24px)', ease: 'power2.out', duration: 0.6 },
          at,
        )
        tl.to(caps[i - 1], { opacity: 0, y: -14, duration: 0.3 }, at + 0.1)
        tl.to(caps[i], { opacity: 1, y: 0, duration: 0.35 }, at + 0.28)
      }
      inner.forEach((im, i) => {
        const from = i === 0 ? 0 : Math.max(0, startAt(i) - 0.1)
        const to = i === N - 1 ? TOTAL : startAt(i + 1) + 0.6
        tl.fromTo(im, { yPercent: -3 }, { yPercent: 3, duration: to - from }, from)
      })

      gsap.fromTo(
        root.querySelector('.gal-enter'),
        { opacity: 0 },
        { opacity: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'top 75%', end: 'top 25%', scrub: true } },
      )

      return () => {
        root.classList.remove('is-pin')
        delete root.dataset.pin
      }
    })
    mm.add(LITE, () => liteReveal(root))
  })

  const jump = (i: number) => {
    const run = ref.current?.querySelector<HTMLElement>('.gal-run')
    if (!run) return
    const top = run.getBoundingClientRect().top + window.scrollY
    const time = i === 0 ? 0 : startAt(i) + 0.62
    scrollToY(top + (time / TOTAL) * (run.offsetHeight - window.innerHeight))
  }

  return (
    <section ref={ref} id="sc-04" data-scene="04" className="scene">
      <div className="gal-run">
        <div className="gal-stage">
          <SceneBg art="gallery" />
          <div className="gal-enter scene-layer">
            <div className="gal-head">
              <Slate n="04" />
              <h2 className="h2 h2--sm" data-rv>
                {t.gallery.title}
              </h2>
            </div>
            <div className="gal-frames">
              {t.gallery.items.map((item, i) => (
                <figure className="gal-frame" key={SHOTS[i]} data-rv>
                  <Glass className="gal-img">
                    <img
                      src={asset(`media/gui/${SHOTS[i]}-960.webp`)}
                      srcSet={`${asset(`media/gui/${SHOTS[i]}-960.webp`)} 960w, ${asset(`media/gui/${SHOTS[i]}-1800.webp`)} 1800w`}
                      sizes="(min-width: 768px) 62vw, 92vw"
                      width={1800}
                      height={810}
                      alt={item.alt}
                      loading="lazy"
                      decoding="async"
                    />
                  </Glass>
                  <figcaption className="gal-cap">
                    <span className="gal-count">
                      0{i + 1} / 0{N}
                    </span>
                    <strong>{item.name}</strong>
                    <span>{item.desc}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <div className="gal-tabs" role="group" aria-label={t.gallery.tabsLabel}>
              {t.gallery.items.map((item, i) => (
                <button key={item.name} type="button" aria-current={active === i ? 'true' : undefined} onClick={() => jump(i)}>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
