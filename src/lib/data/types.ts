export type CrimeFeature = {
  id: string
  coordinates: [number, number]
  properties: Record<string, unknown>
  timestamp: Date
  offenseType: string
  sheet: string
}

export type TimeExtent = {
  start: Date
  end: Date
}

export type CrimeDataset = {
  features: CrimeFeature[]
  extent: TimeExtent
  categories: string[]
  sheets: string[]
  geojsonUrl: string
}

export type ExtentBounds = {
  xmin: number
  xmax: number
  ymin: number
  ymax: number
}

export type TimeStep = 'day' | 'week' | 'month' | 'year'
