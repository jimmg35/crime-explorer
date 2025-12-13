'use client'

import { mapPin16 } from '@esri/calcite-ui-icons/js/mapPin16.js'
import { pieChart16 } from '@esri/calcite-ui-icons/js/pieChart16.js'
import { clock16 } from '@esri/calcite-ui-icons/js/clock16.js'

import { TimeExtent } from '@/lib/data/types'
import { formatDateForLocale } from '@/lib/i18n'
import useI18n from '@/lib/i18n/useI18n'

type Props = {
  total: number
  categoryCount: number
  timeExtent: TimeExtent
}

const KpiCards = ({ total, categoryCount, timeExtent }: Props) => {
  const { lang, t } = useI18n()
  const rangeLabel = `${formatDateForLocale(timeExtent.start, lang, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })} – ${formatDateForLocale(timeExtent.end, lang, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}`

  const cards = [
    { label: t('kpi.total'), value: total.toLocaleString(), icon: mapPin16 },
    { label: t('kpi.categories'), value: categoryCount.toString(), icon: pieChart16 },
    { label: t('kpi.range'), value: rangeLabel, icon: clock16 }
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 flex flex-col gap-1 shadow-sm"
          style={card.label === t('kpi.range') ? { gridColumn: 'span 2' } : {}}
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300">
            <Icon path={card.icon} />
            {card.label}
          </div>
          <div className="text-lg font-semibold text-white leading-tight">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  )
}

const Icon = ({ path }: { path: string }) => (
  <svg
    className="w-4 h-4 fill-current text-cyan-300"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
)

export default KpiCards
