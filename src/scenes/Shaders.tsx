import { Scene, Slate } from '../components/Scene'
import { useI18n } from '../i18n/I18n'

const SWATCHES = [
  'radial-gradient(circle at 30% 30%, #f9a8d4 0 3%, transparent 4%), radial-gradient(circle at 70% 60%, #fff 0 2%, transparent 3%), linear-gradient(135deg, #1b0b3a, #6d28d9 60%, #f9a8d4)',
  'linear-gradient(135deg, #fb7185, #fbbf24, #4ade80, #38bdf8, #a855f7)',
  'linear-gradient(180deg, #fde047, #f97316 45%, #b91c1c)',
  'repeating-linear-gradient(180deg, rgba(103,232,249,.9) 0 3px, rgba(14,116,144,.55) 3px 7px)',
  'linear-gradient(135deg, #f5f5f5, #6b7280 42%, #f5f5f5 58%, #374151)',
]

export function Shaders() {
  const { t } = useI18n()
  return (
    <Scene n="03" art="shaders">
      <div className="split">
        <div>
          <Slate n="03" />
          <h2 className="h2" data-rv>
            {t.shaders.title}
          </h2>
          <p className="lead" data-rv>
            {t.shaders.body}
          </p>
        </div>
        <div>
          <dl className="stats" data-rv>
            <div>
              <dd>12</dd>
              <dt>{t.shaders.fills}</dt>
            </div>
            <div>
              <dd>9</dd>
              <dt>{t.shaders.outlines}</dt>
            </div>
          </dl>
          <ul className="swatches" data-rv>
            {t.shaders.samples.map((name, i) => (
              <li key={name}>
                <span aria-hidden="true" style={{ background: SWATCHES[i] }} />
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Scene>
  )
}
