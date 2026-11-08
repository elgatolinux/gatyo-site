import { useState } from 'react'
import { Scene, Slate } from '../components/Scene'
import { useI18n } from '../i18n/I18n'
import { ACCENTS, getAccent, setAccent, type Accent } from '../lib/accent'

export function Custom() {
  const { t } = useI18n()
  const c = t.custom
  const [accent, setAccentState] = useState<Accent>(getAccent)
  const choose = (a: Accent) => {
    setAccent(a)
    setAccentState(a)
  }
  return (
    <Scene n="05" art="custom">
      <Slate n="05" />
      <h2 className="h2" data-rv>
        {c.title}
      </h2>
      <div className="bento">
        <article className="card card--wide" data-rv>
          <h3>{c.video.title}</h3>
          <p>{c.video.body}</p>
        </article>
        <article className="card card--num" data-rv>
          <p className="num">15</p>
          <p>{c.anims.label}</p>
        </article>
        <article className="card card--num" data-rv>
          <p className="num">7</p>
          <p>{c.accents.label}</p>
          <p className="accent-hint">{c.accents.hint}</p>
          <div className="dots" role="group" aria-label={c.accents.label}>
            {ACCENTS.map((id, i) => (
              <button key={id} type="button" data-accent={id} title={c.accents.names[i]} aria-label={c.accents.names[i]} aria-pressed={accent === id} onClick={() => choose(id)}>
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
        </article>
        <article className="card card--wide" data-rv>
          <h3>{c.sky.title}</h3>
          <p>{c.sky.body}</p>
        </article>
      </div>
    </Scene>
  )
}
