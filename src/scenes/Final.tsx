import { Scene, Slate } from '../components/Scene'
import { useI18n } from '../i18n/I18n'
import { AUTHOR, DISCORD_URL, MUSIC_CREDIT } from '../i18n/dict'

export function Final() {
  const { t } = useI18n()
  return (
    <Scene n="08" art="final" last className="scene--final">
      <div className="final">
        <Slate n="08" />
        <h2 className="h2" data-rv>
          {t.final.title}
        </h2>
        <p className="lead" data-rv>
          {t.final.body}
        </p>
        <a className="cta" href={DISCORD_URL} target="_blank" rel="noopener" data-rv>
          {t.final.cta}
        </a>
      </div>
      <footer className="credits" data-rv>
        <p>
          {t.final.madeBy} <strong>{AUTHOR}</strong> · {t.hero.release}
        </p>
        <p>
          {t.promo.music}: {MUSIC_CREDIT}
        </p>
        <p className="legal">{t.final.legal}</p>
      </footer>
    </Scene>
  )
}
