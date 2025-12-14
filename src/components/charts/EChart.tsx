'use client'

import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

type Props = {
  option: echarts.EChartsCoreOption
  height?: number
  className?: string
  onEvents?: {
    click?: (params: echarts.ECElementEvent) => void
  }
}

const EChart = ({ option, height = 260, className, onEvents }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.EChartsType | null>(null)
  const clickHandler = onEvents?.click

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return

    const chart = echarts.init(containerRef.current, undefined, {
      renderer: 'canvas'
    })
    chartRef.current = chart

    const resize = () => chart.resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      chart.dispose()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    if (clickHandler) {
      chart.on('click', clickHandler)
    }

    return () => {
      if (clickHandler) {
        chart.off('click', clickHandler)
      }
    }
  }, [clickHandler])

  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.setOption(option, true)
    chartRef.current.resize()
  }, [option])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height }}
      aria-hidden="true"
    />
  )
}

export default EChart
