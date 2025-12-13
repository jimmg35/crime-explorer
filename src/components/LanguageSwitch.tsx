'use client'

import { SUPPORTED_LANGS, translate, type Lang } from '@/lib/i18n'
import { useAppState } from '@/lib/state/AppStateContext'

const LanguageSwitch = () => {
  const { state, setLang } = useAppState()

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-slate-300">
        {translate(state.lang, 'lang.label')}
      </span>
      <div className="inline-flex rounded-full bg-white/10 p-1 backdrop-blur">
        {SUPPORTED_LANGS.map((lang) => {
          const isActive = state.lang === lang
          return (
            <button
              key={lang}
              type="button"
              className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
              onClick={() => setLang(lang)}
              aria-pressed={isActive}
            >
              {translate(lang as Lang, `lang.${lang}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default LanguageSwitch
