'use client'

import { useEffect, useMemo, useState } from 'react'
import Joyride, {
  CallBackProps,
  STATUS,
  Step,
  TooltipRenderProps
} from 'react-joyride'

const useTourSteps = (): Step[] =>
  useMemo(
    () => [
      {
        target: '#tour-header',
        title: 'Welcome',
        content:
          'Start here to switch languages or open the guide. Use this tour to learn the main areas of the dashboard.',
        disableBeacon: true
      },
      {
        target: '#tour-map',
        title: 'Map view',
        content:
          'Pan, zoom, and click to explore incident locations. Switch the basemap from the control inside the map.',
        spotlightPadding: 8
      },
      {
        target: '#tour-time-slider',
        title: 'Time slider',
        content:
          'Drag the handles to set the date range and use the chips to change the time step (day/week/month/year). Charts and counts update instantly.',
        spotlightPadding: 10
      },
      {
        target: '#tour-filters',
        title: 'Filters',
        content:
          'Filter by category, data sheet, or current map view. Use Reset to clear everything and start fresh.',
        spotlightPadding: 8
      },
      {
        target: '#tour-kpis',
        title: 'Key numbers',
        content:
          'At-a-glance totals help you understand scale before diving into trends. These update with your filters.',
        spotlightPadding: 8
      },
      {
        target: '#tour-charts',
        title: 'Timeline & charts',
        content:
          'Change the time window and granularity to see spikes or trends. Click a series to toggle it as a filter.',
        spotlightPadding: 8
      }
    ],
    []
  )

type CustomTooltipProps = TooltipRenderProps & {
  dontShowAgain: boolean
  onToggleDontShow: (value: boolean) => void
}

const CustomTooltip = ({
  continuous,
  index,
  size,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  dontShowAgain,
  onToggleDontShow
}: CustomTooltipProps) => {
  return (
    <div
      {...tooltipProps}
      className="rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl text-slate-100"
    >
      <div className="text-xs uppercase tracking-wide text-slate-400">
        Step {index + 1} of {size}
      </div>
      {step.title && (
        <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
      )}
      {step.content && (
        <p className="mt-2 text-sm text-slate-200">{step.content}</p>
      )}

      <label className="mt-3 flex items-center gap-2 text-xs text-slate-200">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-500 bg-slate-800"
          checked={dontShowAgain}
          onChange={(e) => onToggleDontShow(e.target.checked)}
        />
        <span>Do not show this tour again</span>
      </label>

      <div className="mt-4 flex items-center gap-2">
        {index > 0 && (
          <button
            {...backProps}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/20"
          >
            Back
          </button>
        )}
        <button
          {...primaryProps}
          className="rounded-full border border-green-400/60 bg-green-400/15 px-3 py-1 text-xs font-semibold text-green-100 transition hover:bg-green-400/25"
        >
          {continuous && index + 1 < size ? 'Next' : 'Done'}
        </button>
        <button
          {...skipProps}
          className="ml-auto text-xs font-semibold text-slate-300 underline-offset-4 hover:underline"
        >
          Skip
        </button>
      </div>
    </div>
  )
}

const InteractiveTour = () => {
  const steps = useTourSteps()
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = window.localStorage.getItem('tour:dismissed')
    if (!dismissed) {
      setRun(true)
      setStepIndex(0)
    }
  }, [])

  const handleCallback = (data: CallBackProps) => {
    const { status, index, type, action } = data
    // @ts-expect-error tesetsting
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false)
      setStepIndex(0)
      if (dontShowAgain && typeof window !== 'undefined') {
        window.localStorage.setItem('tour:dismissed', 'true')
      }
      return
    }
    if (type === 'step:after' || type === 'target:notFound') {
      const delta = action === 'prev' ? -1 : 1
      setStepIndex(Math.max(0, Math.min(index + delta, steps.length - 1)))
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRun(true)
          setStepIndex(0)
        }}
        className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
      >
        Start tour
      </button>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showSkipButton
        disableOverlayClose
        disableCloseOnEsc={false}
        scrollToFirstStep
        styles={{
          options: {
            primaryColor: '#22c55e',
            backgroundColor: '#0f172a',
            textColor: '#e2e8f0',
            beaconSize: 28,
            overlayColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 20_000
          },
          tooltip: {
            borderRadius: 16,
            padding: 16
          },
          buttonClose: {
            display: 'none'
          }
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Done',
          next: 'Next',
          skip: 'Skip'
        }}
        callback={handleCallback}
        tooltipComponent={(props) => (
          <CustomTooltip
            {...props}
            dontShowAgain={dontShowAgain}
            onToggleDontShow={setDontShowAgain}
          />
        )}
      />
    </>
  )
}

export default InteractiveTour
