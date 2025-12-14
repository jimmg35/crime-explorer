'use client'

import {
  timeSeries as buildTimeSeries,
  hourDistribution,
  topCategories
} from '@/lib/data/aggregations'
import { CrimeFeature, TimeStep } from '@/lib/data/types'
import { formatDateForLocale } from '@/lib/i18n'
import useI18n from '@/lib/i18n/useI18n'
import { useMemo } from 'react'
import EChart from './EChart'

type Props = {
  features: CrimeFeature[]
  timeStep: TimeStep
  onCategoryToggle: (name: string) => void
  onTimeBucketSelect: (start: Date, end: Date) => void
}

const ChartsPanel = ({
  features,
  timeStep,
  onCategoryToggle,
  onTimeBucketSelect
}: Props) => {
  const { lang, t } = useI18n()

  const timeSeriesData = useMemo(
    () => buildTimeSeries(features, timeStep),
    [features, timeStep]
  )
  const topCategoryData = useMemo(() => topCategories(features, 10), [features])
  const hourlyData = useMemo(() => hourDistribution(features), [features])

  const hasData = features.length > 0

  const timeSeriesOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      grid: { left: 50, right: 16, top: 28, bottom: 40 },
      tooltip: {
        trigger: 'axis',
        formatter: (params: { value: [number, number] }[]) => {
          const item = params?.[0]
          if (!item || !item.value) return ''
          return `${formatDateForLocale(new Date(item.value[0]), lang, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}<br/>${item.value[1]}`
        }
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          color: '#cbd5e1',
          formatter: (value: number) =>
            formatDateForLocale(new Date(value), lang, {
              month: 'short',
              day: 'numeric'
            })
        },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#cbd5e1' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { color: '#38bdf8', width: 2 },
          areaStyle: {
            color: 'rgba(56, 189, 248, 0.25)'
          },
          data: timeSeriesData.map((item) => [item.time.getTime(), item.count])
        }
      ]
    }),
    [timeSeriesData, lang]
  )

  const topCategoriesOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      grid: { left: 110, right: 16, top: 20, bottom: 20 },
      tooltip: { trigger: 'item' },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#cbd5e1' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      yAxis: {
        type: 'category',
        data: topCategoryData.map((item) => item.name).reverse(),
        axisLabel: {
          color: '#cbd5e1',
          overflow: 'truncate'
        }
      },
      series: [
        {
          type: 'bar',
          data: topCategoryData.map((item) => item.count).reverse(),
          itemStyle: { color: '#a855f7' },
          barWidth: 14
        }
      ]
    }),
    [topCategoryData]
  )

  const hourlyOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      grid: { left: 40, right: 10, top: 20, bottom: 30 },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: hourlyData.map((item) => item.hour),
        axisLabel: {
          color: '#cbd5e1',
          formatter: (value: number) => `${value}:00`
        },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#cbd5e1' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [
        {
          data: hourlyData.map((item) => item.count),
          type: 'bar',
          itemStyle: { color: '#22d3ee' },
          barWidth: 12
        }
      ]
    }),
    [hourlyData]
  )

  return (
    <div className="space-y-4">
      <ChartCard title={t('charts.timeSeries')}>
        {hasData ? (
          <EChart
            option={timeSeriesOption}
            onEvents={{
              click: (params: { dataIndex: number }) => {
                const idx = params.dataIndex
                const bucket = timeSeriesData[idx]
                if (bucket) onTimeBucketSelect(bucket.time, bucket.end)
              }
            }}
          />
        ) : (
          <EmptyState message={t('charts.noData')} />
        )}
      </ChartCard>

      <ChartCard title={t('charts.topCategories')}>
        {hasData ? (
          <EChart
            option={topCategoriesOption}
            onEvents={{
              click: (params: { name?: string }) => {
                const name = params.name
                if (name) onCategoryToggle(name)
              }
            }}
          />
        ) : (
          <EmptyState message={t('charts.noData')} />
        )}
      </ChartCard>

      <ChartCard title={t('charts.hourly')}>
        {hasData ? (
          <EChart option={hourlyOption} />
        ) : (
          <EmptyState message={t('charts.noData')} />
        )}
      </ChartCard>
    </div>
  )
}

const ChartCard = ({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-sm">
    <div className="text-sm font-semibold text-slate-100 mb-2">{title}</div>
    {children}
  </div>
)

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-sm text-slate-400 py-8 text-center">{message}</div>
)

export default ChartsPanel
