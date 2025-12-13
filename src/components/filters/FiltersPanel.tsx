'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import useI18n from '@/lib/i18n/useI18n'
import { FilterState } from '@/lib/state/types'

type Props = {
  categories: string[]
  selectedCategories: string[]
  extentMode: FilterState['extentMode']
  onCategoriesChange: (value: string[]) => void
  onExtentModeChange: (mode: FilterState['extentMode']) => void
  onReset: () => void
}

const FiltersPanel = ({
  categories,
  selectedCategories,
  extentMode,
  onCategoriesChange,
  onExtentModeChange,
  onReset
}: Props) => {
  const { t } = useI18n()

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.localeCompare(b)),
    [categories]
  )

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-100">
          {t('filters.reset')}
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full"
          onClick={onReset}
        >
          {t('actions.reset')}
        </button>
      </div>

      <FilterBlock title={t('filters.categories')}>
        <MultiSelect
          options={sortedCategories}
          selected={selectedCategories}
          onChange={onCategoriesChange}
          placeholder={t('filters.categories')}
          emptyLabel={t('filters.noOptions')}
        />
      </FilterBlock>

      <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900/60 border border-white/5 px-3 py-2">
        <div className="text-sm text-slate-100">{t('filters.extent')}</div>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={extentMode === 'view'}
            onChange={(e) =>
              onExtentModeChange(e.target.checked ? 'view' : 'all')
            }
          />
          <span className="w-10 h-5 bg-slate-600 rounded-full relative after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:bg-white after:rounded-full after:transition peer-checked:bg-cyan-400 peer-checked:after:translate-x-5"></span>
        </label>
      </div>
    </div>
  )
}

const FilterBlock = ({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) => (
  <div className="mb-4 last:mb-0">
    <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
      {title}
    </div>
    <div className="rounded-xl border border-white/5 bg-slate-900/60 px-3 py-2">
      {children}
    </div>
  </div>
)

const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder,
  emptyLabel
}: {
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
  placeholder: string
  emptyLabel: string
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    return options.filter((opt) =>
      opt.toLowerCase().includes(search.trim().toLowerCase())
    )
  }, [options, search])

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((prev) => !prev)
          }
        }}
        className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-left text-sm text-slate-100 flex flex-wrap gap-2 min-h-12 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
      >
        {selected.length ? (
          selected.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-400/60 px-2 py-1 text-xs text-cyan-100"
            >
              {value}
              <span
                role="button"
                tabIndex={0}
                className="text-cyan-100 hover:text-white cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleValue(value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleValue(value)
                  }
                }}
                aria-label={`Remove ${value}`}
              >
                ×
              </span>
            </span>
          ))
        ) : (
          <span className="text-slate-500">{placeholder}</span>
        )}
      </div>

      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-white/10 bg-slate-900/95 shadow-xl max-h-72 overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter types..."
              className="w-full rounded-md bg-slate-800/80 border border-white/10 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {!filteredOptions.length ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                {emptyLabel}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-100 hover:bg-white/5 cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-500 text-cyan-400 bg-slate-900/60"
                    checked={selected.includes(option)}
                    onChange={() => toggleValue(option)}
                  />
                  <span className="truncate" title={option}>
                    {option}
                  </span>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-2 px-3 py-2 border-t border-white/10 bg-slate-900/90">
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-xs px-2 py-1 rounded-md bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs px-2 py-1 rounded-md bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FiltersPanel
