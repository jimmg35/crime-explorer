'use client'

import * as echarts from 'echarts'
import { useEffect, useRef } from 'react'

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
    if (!containerRef.current) return
    chartRef.current = echarts.init(containerRef.current, undefined, {
      renderer: 'canvas'
    })
    const resize = () => chartRef.current?.resize()
    window.addEventListener('resize', resize)
    const chart = chartRef.current
    if (clickHandler) {
      chart?.on('click', clickHandler)
    }
    return () => {
      window.removeEventListener('resize', resize)
      if (clickHandler) {
        chart?.off('click', clickHandler)
      }
      chart?.dispose()
    }
  }, [clickHandler])

  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.setOption(option, true)
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
