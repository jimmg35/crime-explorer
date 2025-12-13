'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const steps = [
  {
    title: 'Map view',
    body:
      'Pan, zoom, and click features to see where incidents cluster. Switch basemaps with the control inside the map.',
    tips: [
      'Use the mouse wheel or trackpad to zoom.',
      'Draw attention to a neighborhood by zooming and using the "Current view" filter mode.'
    ]
  },
  {
    title: 'Filters',
    body:
      'Focus on topics by selecting categories or data sheets. Combine multiple filters to narrow the results.',
    tips: ['Click a chip to toggle it on/off.', 'Reset returns all data and clears the map filter.']
  },
  {
    title: 'Timeline',
    body:
      'Adjust the time window to explore trends. Pick the granularity (month, week, etc.) to change how charts bucket the data.',
    tips: ['Drag the handles to change the time range.', 'Use smaller steps for short-term events.']
  },
  {
    title: 'Charts',
    body:
      'Use the charts to compare categories and see when activity spikes. Clicking a category toggles it as a filter.',
    tips: ['Hover bars/lines to see exact values.', 'Click a legend item to include/exclude it.']
  }
]

const GuidedTour = () => {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'ArrowRight') setStep((prev) => Math.min(prev + 1, steps.length - 1))
      if (event.key === 'ArrowLeft') setStep((prev) => Math.max(prev - 1, 0))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  const close = () => setOpen(false)
  const goNext = () => setStep((prev) => Math.min(prev + 1, steps.length - 1))
  const goPrev = () => setStep((prev) => Math.max(prev - 1, 0))

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStep(0)
          setOpen(true)
        }}
        className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
      >
        Quick tips
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Step {step + 1} of {steps.length}
                  </div>
                  <h2 className="text-xl font-semibold text-white">{steps[step].title}</h2>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                  aria-label="Close tour"
                >
                  Esc
                </button>
              </div>

              <p className="mt-3 text-sm text-slate-200">{steps[step].body}</p>
              <ul className="mt-3 space-y-1 text-sm text-slate-300">
                {steps[step].tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-green-400"></span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={step === 0}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      step === 0
                        ? 'cursor-not-allowed bg-white/5 text-slate-500'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={step === steps.length - 1}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      step === steps.length - 1
                        ? 'cursor-not-allowed bg-white/5 text-slate-500'
                        : 'bg-green-500 text-slate-900 hover:bg-green-400'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="text-sm font-semibold text-slate-300 underline-offset-4 hover:underline"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default GuidedTour
