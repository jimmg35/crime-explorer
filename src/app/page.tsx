'use client'

import CrimeDashboard from '@/components/CrimeDashboard'
import { loadCrimeData } from '@/lib/data/loadCrimeData'
import { CrimeDataset } from '@/lib/data/types'
import { type Lang, SUPPORTED_LANGS, translate } from '@/lib/i18n'
import { AppStateProvider } from '@/lib/state/AppStateContext'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const HomeContent = () => {
  const [data, setData] = useState<CrimeDataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const lang = useMemo<Lang>(() => {
    const param = searchParams.get('lang') as Lang | null
    if (param && SUPPORTED_LANGS.includes(param)) return param
    return 'en'
  }, [searchParams])

  useEffect(() => {
    let mounted = true
    loadCrimeData()
      .then((result) => {
        if (!mounted) return
        setData(result)
      })
      .catch((err) => {
        console.error(err)
        if (mounted) setError(err.message)
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (data) {
        URL.revokeObjectURL(data.geojsonUrl)
      }
    }
  }, [data])

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-950 text-red-200">
        {translate(lang, 'errors.load')} {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-950 text-slate-200">
        {translate(lang, 'map.loading')}
      </div>
    )
  }

  return (
    <AppStateProvider fullTimeExtent={data.extent}>
      <CrimeDashboard data={data} />
    </AppStateProvider>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-slate-950 text-slate-200">
          Loading...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
