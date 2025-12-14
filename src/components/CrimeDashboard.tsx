'use client'

import { filterFeatures } from '@/lib/data/aggregations'
import { CrimeDataset, ExtentBounds } from '@/lib/data/types'
import useI18n from '@/lib/i18n/useI18n'
import { useAppState } from '@/lib/state/AppStateContext'
import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import InteractiveTour from './InteractiveTour'
import LanguageSwitch from './LanguageSwitch'
import ChartsPanel from './charts/ChartsPanel'
import FiltersPanel from './filters/FiltersPanel'
import KpiCards from './kpi/KpiCards'

const MapPanel = dynamic(() => import('./map/MapPanel'), {
  ssr: false
})

type Props = {
  data: CrimeDataset
}

const CrimeDashboard = ({ data }: Props) => {
  const { state, setCategories, setExtentMode, setTimeExtent, resetFilters } =
    useAppState()
  const { t } = useI18n()
  const [viewExtent, setViewExtent] = useState<ExtentBounds | null>(null)

  const categoryTotals = useMemo(() => {
    const counts = new Map<string, number>()
    data.features.forEach((feature) => {
      const name = feature.offenseType
      counts.set(name, (counts.get(name) || 0) + 1)
    })
    return data.categories.map((name) => ({
      name,
      count: counts.get(name) || 0
    }))
  }, [data.categories, data.features])

  const filteredFeatures = useMemo(
    () =>
      filterFeatures(
        data.features,
        state.filters,
        state.timeExtent,
        state.filters.extentMode === 'view' ? viewExtent : null
      ),
    [data.features, state.filters, state.timeExtent, viewExtent]
  )

  const categoryCount = useMemo(
    () => new Set(filteredFeatures.map((f) => f.offenseType)).size,
    [filteredFeatures]
  )

  const previousTimeExtent = useMemo(() => {
    const duration =
      state.timeExtent.end.getTime() - state.timeExtent.start.getTime()
    const start = new Date(state.timeExtent.start.getTime() - duration)
    const end = new Date(state.timeExtent.start)
    return { start, end }
  }, [state.timeExtent])

  const previousFilteredFeatures = useMemo(
    () =>
      filterFeatures(
        data.features,
        state.filters,
        previousTimeExtent,
        state.filters.extentMode === 'view' ? viewExtent : null
      ),
    [data.features, state.filters, previousTimeExtent, viewExtent]
  )

  const previousCategoryCount = useMemo(
    () => new Set(previousFilteredFeatures.map((f) => f.offenseType)).size,
    [previousFilteredFeatures]
  )
  const toggleCategoryFilter = (name: string) => {
    if (!name) return
    const current = state.filters.categories
    if (current.includes(name)) {
      setCategories(current.filter((item) => item !== name))
    } else {
      setCategories([...current, name])
    }
  }

  const handleResetFilters = () => {
    resetFilters()
  }

  return (
    <div className="min-h-dvh h-dvh w-dvw bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <header
        id="tour-header"
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-950"
      >
        <div>
          <div className="text-lg font-semibold leading-tight">
            {t('app.title')}
          </div>
          <p className="text-sm text-slate-400">{t('app.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto justify-start lg:justify-end">
          <a
            href="https://sdsc.fsu.edu/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 text-xs font-semibold text-green-100 bg-green-400/10 border border-green-400/50 rounded-full px-3 py-1 hover:bg-green-400/20 transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_0_4px_rgba(74,222,128,0.15)]"></span>
            Spatial Data Science Center @ Florida State University
          </a>
          <InteractiveTour />
          <LanguageSwitch />
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 lg:gap-4 p-3 sm:p-4 overflow-auto lg:overflow-hidden">
        <section
          id="tour-map"
          className="flex-1 min-h-[360px] lg:min-h-0 rounded-2xl overflow-hidden border border-white/10 bg-slate-900/80 shadow-inner"
        >
          <MapPanel data={data} onExtentChange={setViewExtent} />
        </section>

        <aside className="w-full lg:w-[420px] flex flex-col gap-4 overflow-visible lg:overflow-y-auto lg:min-h-0 pr-0 lg:pr-1">
          <div id="tour-filters">
            <FiltersPanel
              categories={categoryTotals}
              selectedCategories={state.filters.categories}
              extentMode={state.filters.extentMode}
              onCategoriesChange={setCategories}
              onExtentModeChange={setExtentMode}
              onReset={handleResetFilters}
            />
          </div>
          <div id="tour-kpis">
            <KpiCards
              total={filteredFeatures.length}
              previousTotal={previousFilteredFeatures.length}
              categoryCount={categoryCount}
              previousCategoryCount={previousCategoryCount}
              timeExtent={state.timeExtent}
              previousTimeExtent={previousTimeExtent}
            />
          </div>
          <div id="tour-charts">
            <ChartsPanel
              features={filteredFeatures}
              timeStep={state.timeStep}
              onCategoryToggle={toggleCategoryFilter}
              onTimeBucketSelect={(start, end) => setTimeExtent({ start, end })}
            />
          </div>
        </aside>
      </main>
    </div>
  )
}

export default CrimeDashboard
