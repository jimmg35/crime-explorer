'use client'

import { TimeExtent } from '@/lib/data/types'
import { formatDateForLocale } from '@/lib/i18n'
import useI18n from '@/lib/i18n/useI18n'
import { clock16 } from '@esri/calcite-ui-icons/js/clock16.js'
import { mapPin16 } from '@esri/calcite-ui-icons/js/mapPin16.js'
import { pieChart16 } from '@esri/calcite-ui-icons/js/pieChart16.js'

type Props = {
  total: number
  previousTotal: number
  categoryCount: number
  previousCategoryCount: number
  timeExtent: TimeExtent
  previousTimeExtent: TimeExtent
}

const KpiCards = ({
  total,
  previousTotal,
  categoryCount,
  previousCategoryCount,
  timeExtent,
  previousTimeExtent
}: Props) => {
  const { lang, t } = useI18n()

  const rangeLabel = `${formatDateForLocale(timeExtent.start, lang, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })} - ${formatDateForLocale(timeExtent.end, lang, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}`

  const previousRangeLabel = `${formatDateForLocale(
    previousTimeExtent.start,
    lang,
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }
  )} - ${formatDateForLocale(previousTimeExtent.end, lang, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })}`

  const change = (current: number, prev: number) => {
    if (prev === 0) return null
    const diff = current - prev
    const pct = (diff / prev) * 100
    return { diff, pct }
  }

  const totalChange = change(total, previousTotal)
  const categoriesChange = change(categoryCount, previousCategoryCount)

  const cards = [
    {
      label: t('kpi.total'),
      value: total.toLocaleString(),
      icon: mapPin16,
      change: totalChange
    },
    {
      label: t('kpi.categories'),
      value: categoryCount.toString(),
      icon: pieChart16,
      change: categoriesChange
    },
    {
      label: t('kpi.range'),
      value: rangeLabel,
      icon: clock16,
      meta: `Prev: ${previousRangeLabel}`
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {cards.map((card) => {
        const isRangeCard = card.label === t('kpi.range')
        return (
          <div
            key={card.label}
            className={`rounded-xl border border-white/10 bg-white/5 px-3 py-3 flex flex-col gap-1 shadow-sm ${
              isRangeCard ? 'sm:col-span-2' : ''
            }`}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300">
              <Icon path={card.icon} />
              {card.label}
            </div>
            <div className="text-lg font-semibold text-white leading-tight">
              {card.value}
            </div>
            {card.change && (
              <div
                className={`text-xs font-semibold ${
                  card.change.diff >= 0 ? 'text-emerald-300' : 'text-rose-300'
                }`}
              >
                {card.change.diff >= 0 ? '+' : '-'}
                {Math.abs(card.change.pct).toFixed(1)}% vs prev period
              </div>
            )}
            {card.meta && (
              <div className="text-[11px] text-slate-400">{card.meta}</div>
            )}
          </div>
        )
      })}
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
