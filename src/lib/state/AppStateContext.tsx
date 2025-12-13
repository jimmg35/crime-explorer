'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { DEFAULT_BASEMAP } from '../data/config'
import { TimeExtent, TimeStep } from '../data/types'
import { Lang, SUPPORTED_LANGS } from '../i18n'
import { AppState, FilterState } from './types'

type AppStateContextValue = {
  state: AppState
  setLang: (lang: Lang) => void
  setBasemap: (basemap: string) => void
  setTimeExtent: (extent: TimeExtent) => void
  setCategories: (categories: string[]) => void
  setSheets: (sheets: string[]) => void
  setExtentMode: (mode: FilterState['extentMode']) => void
  setTimeStep: (step: TimeStep) => void
  resetFilters: () => void
}

const defaultFilters: FilterState = {
  categories: [],
  sheets: [],
  extentMode: 'all'
}

const decodeList = (value: string | null): string[] => {
  if (!value) return []
  return value
    .split('|')
    .map((v) => decodeURIComponent(v))
    .filter(Boolean)
}

const encodeList = (value: string[]): string | null => {
  if (!value.length) return null
  return value.map((v) => encodeURIComponent(v)).join('|')
}

const parseTime = (value: string | null): Date | null => {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.valueOf()) ? null : d
}

const clampTimeExtent = (input: TimeExtent, full: TimeExtent): TimeExtent => {
  const start = Math.max(full.start.valueOf(), input.start.valueOf())
  const end = Math.min(full.end.valueOf(), input.end.valueOf())
  if (start > end) return full
  return { start: new Date(start), end: new Date(end) }
}

const addMonths = (date: Date, months: number) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

const twelveMonthWindowFromStart = (full: TimeExtent): TimeExtent => {
  const start = full.start
  const endCandidate = addMonths(start, 12)
  const end =
    endCandidate.valueOf() > full.end.valueOf() ? full.end : endCandidate
  return { start, end }
}

const defaultTimeExtent = (full: TimeExtent): TimeExtent => {
  return twelveMonthWindowFromStart(full)
}

const getInitialLang = (
  searchParams: URLSearchParams | null,
  fallback: Lang
): Lang => {
  const paramValue = searchParams?.get('lang')
  if (paramValue && SUPPORTED_LANGS.includes(paramValue as Lang)) {
    return paramValue as Lang
  }
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('lang')
    if (stored && SUPPORTED_LANGS.includes(stored as Lang)) {
      return stored as Lang
    }
  }
  return fallback
}

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined
)

type ProviderProps = {
  children: React.ReactNode
  fullTimeExtent: TimeExtent
}

export const AppStateProvider = ({
  children,
  fullTimeExtent
}: ProviderProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialLang = useMemo(
    () => getInitialLang(searchParams, 'en'),
    [searchParams]
  )

  const initialTimeExtent = useMemo(() => {
    const start = parseTime(searchParams.get('timeStart'))
    const end = parseTime(searchParams.get('timeEnd'))
    if (start && end) return clampTimeExtent({ start, end }, fullTimeExtent)
    return defaultTimeExtent(fullTimeExtent)
  }, [searchParams, fullTimeExtent])

  const paramStep = searchParams.get('step') as TimeStep | null
  const initialStep: TimeStep =
    paramStep === 'day' ||
    paramStep === 'week' ||
    paramStep === 'month' ||
    paramStep === 'year'
      ? paramStep
      : 'month'

  const [state, setState] = useState<AppState>({
    lang: initialLang,
    basemap: searchParams.get('basemap') ?? DEFAULT_BASEMAP,
    timeExtent: initialTimeExtent,
    timeStep: initialStep,
    filters: {
      categories: decodeList(searchParams.get('categories')),
      sheets: decodeList(searchParams.get('sheets')),
      extentMode:
        (searchParams.get('extentMode') as FilterState['extentMode']) ?? 'all'
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('lang', state.lang)
  }, [state.lang])

  const serialize = useCallback((next: AppState) => {
    const params = new URLSearchParams()
    params.set('lang', next.lang)
    params.set('timeStart', next.timeExtent.start.toISOString())
    params.set('timeEnd', next.timeExtent.end.toISOString())
    if (next.basemap !== DEFAULT_BASEMAP) {
      params.set('basemap', next.basemap)
    }
    if (next.timeStep !== 'month') {
      params.set('step', next.timeStep)
    }
    const cats = encodeList(next.filters.categories)
    const sheets = encodeList(next.filters.sheets)
    if (cats) params.set('categories', cats)
    if (sheets) params.set('sheets', sheets)
    if (next.filters.extentMode !== 'all') {
      params.set('extentMode', next.filters.extentMode)
    }
    return params.toString()
  }, [])

  const lastQueryRef = useRef<string>('')
  useEffect(() => {
    const query = serialize(state)
    if (query === lastQueryRef.current) return
    lastQueryRef.current = query
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false
    })
  }, [state, serialize, router, pathname])

  const setLang = useCallback((lang: Lang) => {
    setState((prev) => ({ ...prev, lang }))
  }, [])

  const setBasemap = useCallback((basemap: string) => {
    setState((prev) => ({ ...prev, basemap }))
  }, [])

  const setTimeExtent = useCallback(
    (timeExtent: TimeExtent) => {
      setState((prev) => {
        const next = clampTimeExtent(timeExtent, fullTimeExtent)
        if (
          prev.timeExtent.start.valueOf() === next.start.valueOf() &&
          prev.timeExtent.end.valueOf() === next.end.valueOf()
        ) {
          return prev
        }
        return { ...prev, timeExtent: next }
      })
    },
    [fullTimeExtent]
  )

  const setCategories = useCallback((categories: string[]) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, categories }
    }))
  }, [])

  const setSheets = useCallback((sheets: string[]) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, sheets }
    }))
  }, [])

  const setExtentMode = useCallback(
    (extentMode: FilterState['extentMode']) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, extentMode }
      }))
    },
    []
  )

  const setTimeStep = useCallback((timeStep: TimeStep) => {
    setState((prev) => {
      let nextExtent = prev.timeExtent
      if (timeStep === 'month') {
        nextExtent = twelveMonthWindowFromStart(fullTimeExtent)
      }
      return { ...prev, timeStep, timeExtent: nextExtent }
    })
  }, [fullTimeExtent])

  const resetFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      filters: { ...defaultFilters },
      timeExtent: defaultTimeExtent(fullTimeExtent),
      timeStep: 'month'
    }))
  }, [fullTimeExtent])

  const value = useMemo(
    () => ({
      state,
      setLang,
      setBasemap,
      setTimeExtent,
      setCategories,
      setSheets,
      setExtentMode,
      setTimeStep,
      resetFilters
    }),
    [
      state,
      setLang,
      setBasemap,
      setTimeExtent,
      setCategories,
      setSheets,
      setExtentMode,
      setTimeStep,
      resetFilters
    ]
  )

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}

export const useAppState = () => {
  const ctx = useContext(AppStateContext)
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return ctx
}
