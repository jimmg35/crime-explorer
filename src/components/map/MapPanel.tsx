'use client'

import {
  CATEGORY_FIELD,
  DEFAULT_BASEMAP,
  SHEET_FIELD,
  TIMESTAMP_FIELD
} from '@/lib/data/config'
import { CrimeDataset, ExtentBounds } from '@/lib/data/types'
import useI18n from '@/lib/i18n/useI18n'
import { useAppState } from '@/lib/state/AppStateContext'
import { layers16 } from '@esri/calcite-ui-icons/js/layers16.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map from '@arcgis/core/Map.js'
import PopupTemplate from '@arcgis/core/PopupTemplate.js'
import ArcGISTimeExtent from '@arcgis/core/TimeExtent.js'
import '@arcgis/core/assets/esri/themes/dark/main.css'
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils.js'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer.js'
import FeatureReductionCluster from '@arcgis/core/layers/support/FeatureReductionCluster.js'
import UniqueValueRenderer from '@arcgis/core/renderers/UniqueValueRenderer.js'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol.js'
import MapView from '@arcgis/core/views/MapView.js'
import TimeSlider from '@arcgis/core/widgets/TimeSlider.js'

type Props = {
  data: CrimeDataset
  onExtentChange: (bounds: ExtentBounds) => void
}

const basemaps = [
  { id: 'gray-vector', label: 'Gray' },
  { id: 'streets-vector', label: 'Streets' },
  { id: 'dark-gray-vector', label: 'Dark Gray' },
  { id: 'satellite', label: 'Imagery' }
]

const palette = [
  '#22d3ee',
  '#f97316',
  '#a855f7',
  '#22c55e',
  '#eab308',
  '#38bdf8',
  '#ef4444',
  '#6366f1',
  '#14b8a6',
  '#f43f5e'
]

const buildCategoryRenderer = (categories: string[]) => {
  const infos = categories.map((name, idx) => ({
    value: name,
    label: name,
    symbol: new SimpleMarkerSymbol({
      color: palette[idx % palette.length],
      size: 6,
      outline: { color: '#0f172a', width: 0.75 }
    })
  }))

  return new UniqueValueRenderer({
    field: CATEGORY_FIELD,
    defaultSymbol: new SimpleMarkerSymbol({
      color: '#94a3b8',
      size: 6,
      outline: { color: '#0f172a', width: 0.75 }
    }),
    uniqueValueInfos: infos
  })
}

const buildClusterReduction = (): FeatureReductionCluster => {
  const popupTemplate = new PopupTemplate({
    title: '{cluster_count} incidents',
    content: [
      {
        type: 'text',
        text: 'This cluster represents {cluster_count} incidents in this area.'
      }
    ]
  })

  return new FeatureReductionCluster({
    clusterRadius: 60,
    popupEnabled: true,
    popupTemplate,
    labelsVisible: true,
    symbol: new SimpleMarkerSymbol({
      color: '#ef4444',
      size: 26,
      outline: { color: '#0b1220', width: 1.5 }
    }),
    labelingInfo: [
      {
        deconflictionStrategy: 'none',
        labelExpressionInfo: {
          expression: "Text($feature.cluster_count, '#,###')"
        },
        symbol: {
          type: 'text',
          color: '#f8fafc',
          font: { size: 12, weight: 'bold' },
          haloColor: '#0b1220',
          haloSize: 1.2
        }
      }
    ]
  })
}

const sanitizeSqlList = (values: string[]) =>
  values.map((v) => `'${v.replace(/'/g, "''")}'`).join(',')

const timeUnit = (step: ReturnType<typeof useAppState>['state']['timeStep']) =>
  step === 'day'
    ? 'days'
    : step === 'week'
      ? 'weeks'
      : step === 'month'
        ? 'months'
        : 'years'

const MapPanel = ({ data, onExtentChange }: Props) => {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const timeSliderRef = useRef<HTMLDivElement | null>(null)
  const mapObjRef = useRef<Map | null>(null)
  const viewRef = useRef<MapView | null>(null)
  const layerRef = useRef<GeoJSONLayer | null>(null)
  const layerViewRef = useRef<__esri.GeoJSONLayerView | null>(null)
  const sliderRef = useRef<TimeSlider | null>(null)
  const extentFrame = useRef<number | null>(null)
  const initializedZoom = useRef(false)
  const { state, setBasemap, setTimeExtent, setTimeStep } = useAppState()
  const { t } = useI18n()

  const [clusters, setClusters] = useState(true)

  const popupTemplate = useMemo(
    () =>
      new PopupTemplate({
        title: `{${CATEGORY_FIELD}}`,
        content: [
          {
            type: 'fields',
            fieldInfos: [
              { fieldName: CATEGORY_FIELD, label: t('map.popup.offense') },
              { fieldName: TIMESTAMP_FIELD, label: t('map.popup.time') },
              { fieldName: SHEET_FIELD, label: t('map.popup.sheet') },
              { fieldName: 'Address', label: t('map.popup.address') }
            ]
          }
        ]
      }),
    [t]
  )

  const applyLayerFilter = useCallback(() => {
    if (!layerViewRef.current || !viewRef.current) return
    const where: string[] = []
    if (state.filters.categories.length) {
      where.push(
        `${CATEGORY_FIELD} IN (${sanitizeSqlList(state.filters.categories)})`
      )
    }
    if (state.filters.sheets.length) {
      where.push(`${SHEET_FIELD} IN (${sanitizeSqlList(state.filters.sheets)})`)
    }
    const geometry =
      state.filters.extentMode === 'view' ? viewRef.current.extent : undefined

    layerViewRef.current.filter = {
      timeExtent: new ArcGISTimeExtent({
        start: state.timeExtent.start,
        end: state.timeExtent.end
      }),
      where: where.length ? where.join(' AND ') : undefined,
      geometry
    }
  }, [state.filters, state.timeExtent])

  useEffect(() => {
    if (!mapRef.current) return

    const map = new Map({
      basemap: state.basemap || DEFAULT_BASEMAP
    })
    const layer = new GeoJSONLayer({
      url: data.geojsonUrl,
      title: 'Tallahassee crime incidents',
      popupEnabled: true,
      outFields: ['*'],
      renderer: buildCategoryRenderer(data.categories),
      featureReduction: clusters ? buildClusterReduction() : undefined,
      popupTemplate,
      timeInfo: { startField: TIMESTAMP_FIELD }
    })

    map.add(layer)

    const view = new MapView({
      map,
      container: mapRef.current,
      center: [-84.2807, 30.4383],
      zoom: 12,
      highlightOptions: { color: '#38bdf8' }
    })
    view.ui.components = ['attribution']

    const updateExtent = () => {
      const extent = view.extent
      if (!extent) return
      const geoExtent = extent.spatialReference?.isGeographic
        ? extent
        : (webMercatorUtils.webMercatorToGeographic(
            extent
          ) as __esri.Extent | null)
      if (!geoExtent) return
      if (extentFrame.current) cancelAnimationFrame(extentFrame.current)
      extentFrame.current = requestAnimationFrame(() => {
        onExtentChange({
          xmin: geoExtent.xmin,
          xmax: geoExtent.xmax,
          ymin: geoExtent.ymin,
          ymax: geoExtent.ymax
        })
      })
    }

    view.watch('extent', updateExtent)
    view.when(updateExtent)

    layer.when(() => {
      view.whenLayerView(layer).then((lv) => {
        layerViewRef.current = lv
        applyLayerFilter()
        if (!initializedZoom.current && layer.fullExtent) {
          initializedZoom.current = true
          view.goTo(layer.fullExtent.expand(1.2)).catch(() => {
            /* ignore goTo cancel */
          })
        }
      })
    })

    if (timeSliderRef.current) {
      const slider = new TimeSlider({
        container: timeSliderRef.current,
        view,
        mode: 'time-window',
        fullTimeExtent: new ArcGISTimeExtent({
          start: data.extent.start,
          end: data.extent.end
        }),
        values: [state.timeExtent.start, state.timeExtent.end],
        stops: {
          // @ts-expect-error tesetsting
          interval: {
            value: 1,
            unit: timeUnit(state.timeStep)
          }
        }
      })
      slider.timeExtent = new ArcGISTimeExtent({
        start: state.timeExtent.start,
        end: state.timeExtent.end
      })
      slider.watch('timeExtent', (extent: ArcGISTimeExtent | null) => {
        if (!extent?.start || !extent?.end) return
        setTimeExtent({ start: extent.start, end: extent.end })
      })
      sliderRef.current = slider
    }

    mapObjRef.current = map
    viewRef.current = view
    layerRef.current = layer

    return () => {
      sliderRef.current?.destroy()
      view.destroy()
      map.removeAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.geojsonUrl])

  useEffect(() => {
    if (!mapObjRef.current) return
    mapObjRef.current.basemap = state.basemap || DEFAULT_BASEMAP
  }, [state.basemap])

  useEffect(() => {
    if (!sliderRef.current) return
    sliderRef.current.fullTimeExtent = new ArcGISTimeExtent({
      start: data.extent.start,
      end: data.extent.end
    })
    sliderRef.current.timeExtent = new ArcGISTimeExtent({
      start: state.timeExtent.start,
      end: state.timeExtent.end
    })
    // @ts-expect-error tesetsting
    sliderRef.current.values = [state.timeExtent.start, state.timeExtent.end]

    sliderRef.current.stops = {
      // @ts-expect-error tesetsting
      interval: {
        value: 1,
        unit: timeUnit(state.timeStep)
      }
    }
  }, [state.timeExtent, state.timeStep, data.extent])

  useEffect(() => {
    if (!layerRef.current) return
    layerRef.current.renderer = buildCategoryRenderer(data.categories)
    layerRef.current.featureReduction = clusters
      ? buildClusterReduction()
      : undefined
  }, [clusters, data.categories])

  useEffect(() => {
    if (!viewRef.current) return
    const handle = viewRef.current.watch('extent', () => {
      if (state.filters.extentMode === 'view') {
        applyLayerFilter()
      }
    })
    return () => {
      handle?.remove()
    }
  }, [applyLayerFilter, state.filters.extentMode])

  useEffect(() => {
    applyLayerFilter()
  }, [applyLayerFilter])

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.popupTemplate = popupTemplate
    }
  }, [popupTemplate])

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="absolute inset-0" />

      <div className="absolute left-4 top-4 flex flex-col gap-3 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 border border-white/15 text-sm font-semibold shadow-lg">
          <Icon path={layers16} />
          <select
            className="bg-slate-900 focus:outline-none text-white"
            value={state.basemap}
            onChange={(e) => setBasemap(e.target.value)}
          >
            {basemaps.map((b) => (
              <option
                key={b.id}
                value={b.id}
                className="text-slate-100 bg-slate-800"
              >
                {b.label}
              </option>
            ))}
          </select>
        </div>

        <div className="pointer-events-auto inline-flex">
          <ToggleButton
            active={clusters}
            onClick={() => setClusters((prev) => !prev)}
            label={t('map.clusters')}
          />
        </div>
      </div>

      <div className="absolute left-4 right-4 bottom-4 pointer-events-none" id="tour-time-slider">
        <div className="pointer-events-auto rounded-2xl bg-slate-950/85 border border-white/10 shadow-lg p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {(['day', 'week', 'month', 'year'] as const).map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setTimeStep(step)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                    state.timeStep === step
                      ? 'bg-cyan-400 text-slate-900'
                      : 'bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {t(`actions.${step}`)}
                </button>
              ))}
            </div>
          </div>
          <div
            ref={timeSliderRef}
            className="w-full [&_.esri-slider__range]:bg-cyan-400 [&_.esri-slider__segment]:bg-white/20 [&_.esri-time-slider]:bg-transparent"
          ></div>
        </div>
      </div>
    </div>
  )
}

const Icon = ({ path }: { path: string }) => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16" aria-hidden="true">
    <path d={path} />
  </svg>
)

const ToggleButton = ({
  active,
  onClick,
  label
}: {
  active: boolean
  onClick: () => void
  label: string
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
      active
        ? 'bg-cyan-500 text-slate-900 border-cyan-400'
        : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/15'
    }`}
  >
    {label}
  </button>
)

export default MapPanel
