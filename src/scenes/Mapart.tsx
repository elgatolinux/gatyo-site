import { useRef } from 'react'
import { Glass, Scene, Slate } from '../components/Scene'
import { useI18n } from '../i18n/I18n'
import { asset, FULL, gsap, useMotion } from '../lib/motion'

const GRID = 4
const TILES = Array.from({ length: GRID * GRID }, (_, i) => ({ x: i % GRID, y: Math.floor(i / GRID) }))

export function Mapart() {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)

  useMotion(ref, (mm, root) => {
    mm.add(FULL, () => {
      gsap.fromTo(
        root.querySelectorAll('.tile'),
        { opacity: 0.08, scale: 0.86 },
        {
          opacity: 1, scale: 1, ease: 'none', stagger: 0.08,
          scrollTrigger: { trigger: root, start: 'top 80%', end: 'center 45%', scrub: true },
        },
      )
    })
  })

  return (
    <Scene n="07" art="mapart">
      <div className="split split--media">
        <div>
          <Slate n="07" />
          <h2 className="h2" data-rv>
            {t.mapart.title}
          </h2>
          <p className="lead" data-rv>
            {t.mapart.body}
          </p>
          <dl className="stats" data-rv>
            <div>
              <dd>63</dd>
              <dt>{t.mapart.materials}</dt>
            </div>
            <div>
              <dd>4×4</dd>
              <dt>{t.mapart.maps}</dt>
            </div>
          </dl>
        </div>
        <div ref={ref} data-rv>
          <Glass ratio="1 / 1" reveal>
            <div className="tiles" aria-hidden="true">
              {TILES.map(({ x, y }) => (
                <span
                  key={`${x}-${y}`}
                  className="tile"
                  style={{
                    backgroundImage: `url(${asset('media/art/book-world.webp')})`,
                    backgroundPosition: `${(x / (GRID - 1)) * 100}% ${(y / (GRID - 1)) * 100}%`,
                  }}
                />
              ))}
            </div>
          </Glass>
        </div>
      </div>
    </Scene>
  )
}
