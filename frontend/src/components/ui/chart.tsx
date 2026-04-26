'use client'

import * as React from 'react'
import { Legend, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────

export type ChartConfig = {
  [key: string]: {
    label?: string
    color?: string
    icon?: React.ComponentType
  }
}

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error('useChart must be used within <ChartContainer>')
  return ctx
}

// ── ChartContainer ────────────────────────────────────────────────────────

export function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<typeof ResponsiveContainer>['children']
}) {
  const uid = React.useId()
  const chartId = `chart-${id || uid.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn('flex aspect-video justify-center text-xs', className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

// ── CSS variables injection ───────────────────────────────────────────────

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const vars = Object.entries(config)
    .filter(([, v]) => v.color)
    .map(([k, v]) => `--color-${k}: ${v.color}`)
    .join(';')
  if (!vars) return null
  return <style>{`[data-chart="${id}"] { ${vars} }`}</style>
}

// ── ChartTooltip re-export ────────────────────────────────────────────────

export const ChartTooltip = Tooltip

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  className,
}: {
  active?: boolean
  payload?: { name: string; value: number; fill?: string; color?: string }[]
  label?: string
  hideLabel?: boolean
  className?: string
}) {
  const { config } = useChart()
  if (!active || !payload?.length) return null
  return (
    <div className={cn('rounded-lg border bg-background px-3 py-2 shadow-md text-xs', className)}>
      {!hideLabel && label && (
        <p className="mb-1.5 font-medium text-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((item) => {
          const cfg = config[item.name]
          const color = item.fill || item.color || cfg?.color
          const lbl = cfg?.label ?? item.name
          return (
            <div key={item.name} className="flex items-center gap-2">
              {color && (
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color }} />
              )}
              <span className="text-muted-foreground">{lbl}</span>
              <span className="ml-auto font-medium tabular-nums">{item.value.toLocaleString('fr-FR')}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── ChartLegend re-export ─────────────────────────────────────────────────

export const ChartLegend = Legend

export function ChartLegendContent({
  payload,
  className,
}: {
  payload?: { value: string; color: string }[]
  className?: string
}) {
  const { config } = useChart()
  if (!payload?.length) return null
  return (
    <div className={cn('flex flex-wrap justify-center gap-3', className)}>
      {payload.map((item) => {
        const cfg = config[item.value]
        return (
          <div key={item.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: item.color }} />
            {cfg?.label ?? item.value}
          </div>
        )
      })}
    </div>
  )
}
