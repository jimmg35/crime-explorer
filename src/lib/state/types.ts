import { TimeExtent, TimeStep } from '../data/types'

export type FilterState = {
  categories: string[]
  sheets: string[]
  extentMode: 'all' | 'view'
}

export type AppState = {
  lang: 'en' | 'es'
  basemap: string
  timeExtent: TimeExtent
  timeStep: TimeStep
  filters: FilterState
}
