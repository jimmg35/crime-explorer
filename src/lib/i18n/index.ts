import en from './en.json'
import es from './es.json'

export type Lang = 'en' | 'es'

const dictionaries: Record<Lang, Record<string, string>> = {
  en,
  es
}

const fallback = dictionaries.en

export const translate = (lang: Lang, key: string): string => {
  const dict = dictionaries[lang] ?? fallback
  if (dict[key]) return dict[key]
  if (fallback[key]) return fallback[key]
  return key
}

export const formatDateForLocale = (
  date: Date,
  lang: Lang,
  options?: Intl.DateTimeFormatOptions
): string => {
  const locale = lang === 'es' ? 'es-US' : 'en-US'
  return new Intl.DateTimeFormat(locale, options).format(date)
}

export const SUPPORTED_LANGS: Lang[] = ['en', 'es']
