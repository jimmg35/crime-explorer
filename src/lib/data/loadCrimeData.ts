import {
  CATEGORY_FIELD,
  DATA_URL,
  FALLBACK_CATEGORY_FIELDS,
  FALLBACK_TIMESTAMP_FIELDS,
  SHEET_FIELD,
  TIMESTAMP_FIELD
} from './config'
import { CrimeDataset, CrimeFeature, TimeExtent } from './types'

type FeatureCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    id?: string | number
    geometry?: {
      type: string
      coordinates?: number[]
    }
    properties?: Record<string, unknown>
  }>
}

const parseDate = (raw: unknown): Date | null => {
  if (!raw) return null
  if (raw instanceof Date && !isNaN(raw.valueOf())) return raw
  if (typeof raw === 'number') {
    const date = new Date(raw)
    return isNaN(date.valueOf()) ? null : date
  }
  if (typeof raw === 'string') {
    if (raw.toLowerCase() === 'nat') return null
    const date = new Date(raw)
    return isNaN(date.valueOf()) ? null : date
  }
  return null
}

const findTimestamp = (props: Record<string, unknown>): Date | null => {
  const candidates = [TIMESTAMP_FIELD, ...FALLBACK_TIMESTAMP_FIELDS]
  for (const field of candidates) {
    const value = props[field]
    const parsed = parseDate(value)
    if (parsed) return parsed
  }
  return null
}

const findCategory = (props: Record<string, unknown>): string => {
  const candidates = [CATEGORY_FIELD, ...FALLBACK_CATEGORY_FIELDS]
  for (const field of candidates) {
    const value = props[field]
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim()
    }
  }
  return 'Unknown'
}

const computeTimeExtent = (features: CrimeFeature[]): TimeExtent => {
  let min = features[0]?.timestamp.valueOf()
  let max = min
  for (const feature of features) {
    const time = feature.timestamp.valueOf()
    if (time < min) min = time
    if (time > max) max = time
  }
  return { start: new Date(min), end: new Date(max) }
}

export const loadCrimeData = async (): Promise<CrimeDataset> => {
  const response = await fetch(DATA_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch data (${response.status})`)
  }

  const json = (await response.json()) as FeatureCollection
  if (!json?.features?.length) {
    throw new Error('Dataset is empty')
  }

  const normalizedFeatures: CrimeFeature[] = []
  const geojsonFeatures: FeatureCollection['features'] = []

  json.features.forEach((feature, index) => {
    const geometry = feature.geometry
    const props = feature.properties ?? {}
    const coordinates =
      geometry?.type === 'Point' &&
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length >= 2
        ? ([
            Number(geometry.coordinates[0]),
            Number(geometry.coordinates[1])
          ] as [number, number])
        : null

    const timestamp = findTimestamp(props)
    const offenseType = findCategory(props)
    const sheet = props[SHEET_FIELD] ? String(props[SHEET_FIELD]) : 'Unknown'
    const id = feature.id ? String(feature.id) : `feature-${index}`

    if (!coordinates || !timestamp) return

    const enrichedProps = {
      ...props,
      [TIMESTAMP_FIELD]: timestamp.toISOString(),
      [CATEGORY_FIELD]: offenseType,
      [SHEET_FIELD]: sheet
    }

    normalizedFeatures.push({
      id,
      coordinates,
      properties: enrichedProps,
      timestamp,
      offenseType,
      sheet
    })
    geojsonFeatures.push({
      ...feature,
      id,
      geometry: { type: 'Point', coordinates },
      properties: enrichedProps
    })
  })

  if (!normalizedFeatures.length) {
    throw new Error('No features with valid timestamp and coordinates')
  }

  const extent = computeTimeExtent(normalizedFeatures)
  const categories = Array.from(
    new Set(normalizedFeatures.map((f) => f.offenseType))
  ).sort((a, b) => a.localeCompare(b))
  const sheets = Array.from(
    new Set(normalizedFeatures.map((f) => f.sheet))
  ).sort((a, b) => a.localeCompare(b))

  const blob = new Blob(
    [JSON.stringify({ ...json, features: geojsonFeatures })],
    {
      type: 'application/json'
    }
  )
  const geojsonUrl = URL.createObjectURL(blob)

  return {
    features: normalizedFeatures,
    extent,
    categories,
    sheets,
    geojsonUrl
  }
}
