import { FilterState } from '../state/types'
import { CrimeFeature, ExtentBounds, TimeExtent, TimeStep } from './types'

const startOfUnit = (date: Date, step: TimeStep): Date => {
  const d = new Date(date)
  if (step === 'day') {
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (step === 'week') {
    // start of week (Monday)
    const day = d.getDay()
    const diff = (day + 6) % 7
    d.setDate(d.getDate() - diff)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (step === 'month') {
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }
  // year
  return new Date(d.getFullYear(), 0, 1)
}

const addStep = (date: Date, step: TimeStep): Date => {
  const d = new Date(date)
  if (step === 'day') {
    d.setDate(d.getDate() + 1)
  } else if (step === 'week') {
    d.setDate(d.getDate() + 7)
  } else if (step === 'month') {
    d.setMonth(d.getMonth() + 1)
  } else {
    d.setFullYear(d.getFullYear() + 1)
  }
  return d
}

export const filterFeatures = (
  features: CrimeFeature[],
  filters: FilterState,
  timeExtent: TimeExtent,
  extentBounds?: ExtentBounds | null
): CrimeFeature[] => {
  const start = timeExtent.start.valueOf()
  const end = timeExtent.end.valueOf()
  return features.filter((feature) => {
    const t = feature.timestamp.valueOf()
    if (t < start || t > end) return false
    if (
      filters.categories.length &&
      !filters.categories.includes(feature.offenseType)
    ) {
      return false
    }
    if (filters.sheets.length && !filters.sheets.includes(feature.sheet)) {
      return false
    }
    if (filters.extentMode === 'view' && extentBounds) {
      const [x, y] = feature.coordinates
      if (
        x < extentBounds.xmin ||
        x > extentBounds.xmax ||
        y < extentBounds.ymin ||
        y > extentBounds.ymax
      ) {
        return false
      }
    }
    return true
  })
}

export const timeSeries = (
  features: CrimeFeature[],
  step: TimeStep
): Array<{ time: Date; count: number; end: Date }> => {
  const buckets = new Map<number, number>()
  features.forEach((feature) => {
    const bucketStart = startOfUnit(feature.timestamp, step).valueOf()
    buckets.set(bucketStart, (buckets.get(bucketStart) ?? 0) + 1)
  })

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([start, count]) => ({
      time: new Date(start),
      end: addStep(new Date(start), step),
      count
    }))
}

export const topCategories = (
  features: CrimeFeature[],
  limit = 8
): Array<{ name: string; count: number }> => {
  const counts = new Map<string, number>()
  features.forEach((feature) => {
    counts.set(feature.offenseType, (counts.get(feature.offenseType) ?? 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
}

export const hourDistribution = (
  features: CrimeFeature[]
): Array<{ hour: number; count: number }> => {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0
  }))
  features.forEach((feature) => {
    const hour = feature.timestamp.getHours()
    buckets[hour].count += 1
  })
  return buckets
}
