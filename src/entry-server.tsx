// Renders each language to static HTML at build time, so search engines read the
// full text without running JavaScript. See tools/prerender.mjs.
import { renderToString } from 'react-dom/server'
import App from './App'
import { I18nProvider } from './i18n/I18n'
import type { Lang } from './i18n/dict'

export { DICTS, AUTHOR } from './i18n/dict'

export const render = (lang: Lang) =>
  renderToString(
    <I18nProvider initialLang={lang}>
      <App />
    </I18nProvider>,
  )
