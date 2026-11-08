import { useRef, useState } from 'react'
import { SceneBg, Slate } from '../components/Scene'
import { useI18n } from '../i18n/I18n'
import { asset, FULL, gsap, LITE, liteReveal, useMotion } from '../lib/motion'

const ART = ['book-visuals', 'book-world', 'book-ui', 'book-combat']
const flipAt = (k: number) => 0.25 + k * 1.2
const LEAVES = ART.length - 1
const TOTAL = flipAt(LEAVES - 1) + 1.3

export function FlipBook() {
  const { t } = useI18n()
  const ref = useRef<HTMLElement>(null)
  const [sheet, setSheet] = useState(0)
  const sheetRef = useRef(0)
  const chapters = t.book.chapters

  useMotion(ref, (mm, root) => {
    mm.add(FULL, () => {
      root.classList.add('is-book')
      root.dataset.pin = '1'
      const leaves = gsap.utils.toArray<HTMLElement>('.leaf', root)
      const shades = gsap.utils.toArray<HTMLElement>('.leaf .shade', root)
      const dims = gsap.utils.toArray<HTMLElement>('.dim', root)
      const top = leaves.length + 2
      leaves.forEach((l, k) => gsap.set(l, { zIndex: top - k, rotationY: 0 }))
      gsap.set(dims, { opacity: 0.55 })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.querySelector('.bk-run'),
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          onUpdate: (self) => {
            const time = self.progress * TOTAL
            let s = 0
            for (let k = 0; k < LEAVES; k++) if (time > flipAt(k) + 0.5) s = k + 1
            if (s !== sheetRef.current) {
              sheetRef.current = s
              setSheet(s)
            }
          },
        },
      })
      tl.to({}, { duration: TOTAL }, 0)
      leaves.forEach((leaf, k) => {
        const at = flipAt(k)
        tl.set(leaf, { zIndex: top + k + 1 }, at)
        tl.to(leaf, { rotationY: -178 + k * 0.4, duration: 1, ease: 'power2.inOut' }, at)
        tl.to(shades[k], { opacity: 0.6, duration: 0.5, ease: 'power1.in' }, at)
        tl.to(shades[k], { opacity: 0, duration: 0.5, ease: 'power1.out' }, at + 0.5)
        if (k === LEAVES - 1) tl.to(dims[0], { opacity: 0, duration: 0.55 }, at + 0.3)
      })

      gsap.fromTo(
        root.querySelector('.bk-enter'),
        { opacity: 0 },
        { opacity: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'top 75%', end: 'top 25%', scrub: true } },
      )

      return () => {
        root.classList.remove('is-book')
        delete root.dataset.pin
      }
    })
    mm.add(LITE, () => liteReveal(root))
  })

  const image = (i: number) => (
    <>
      <img src={asset(`media/art/${ART[i]}.webp`)} alt="" width={800} height={920} loading="lazy" decoding="async" />
      <span className="pg-img-title" aria-hidden="true">
        {chapters[i].title}
      </span>
    </>
  )

  const text = (i: number) => (
    <div className="pg-text-in">
      <p className="pg-folio">
        {t.book.sheet} 0{i + 1} / 0{ART.length}
      </p>
      <h3>{chapters[i].title}</h3>
      <p className="pg-body">{chapters[i].body}</p>
      {chapters[i].items.length > 0 && (
        <ul>
          {chapters[i].items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <section ref={ref} id="sc-06" data-scene="06" className="scene">
      <div className="bk-run">
        <div className="bk-stage">
          <SceneBg art="chapters" />
          <div className="bk-enter scene-layer bk-col">
            <div className="bk-head">
              <Slate n="06" />
              <h2 className="h2 h2--sm" data-rv>
                {t.book.title}
              </h2>
              <p className="bk-count" aria-hidden="true">
                {t.book.sheet} 0{sheet + 1} / 0{ART.length}
              </p>
            </div>
            <div className="bk-persp">
              <div className="book">
                <div className="face pg-img bk-left" style={{ '--o': 1 } as React.CSSProperties} data-rv>
                  {image(0)}
                </div>
                {Array.from({ length: LEAVES }, (_, k) => (
                  <div className="leaf" key={k}>
                    <div className="face pg-text front" style={{ '--o': k * 2 + 2 } as React.CSSProperties} data-rv>
                      {text(k)}
                      <span className="shade" aria-hidden="true" />
                    </div>
                    <div className="face pg-img back" style={{ '--o': k * 2 + 3 } as React.CSSProperties} data-rv>
                      {image(k + 1)}
                      <span className="shade" aria-hidden="true" />
                    </div>
                  </div>
                ))}
                <div className="face pg-text bk-right" style={{ '--o': LEAVES * 2 + 2 } as React.CSSProperties} data-rv>
                  {text(LEAVES)}
                  <span className="dim" aria-hidden="true" />
                </div>
                <span className="spine" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
