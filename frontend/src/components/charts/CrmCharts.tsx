'use client'

import {
  Bar, BarChart, Cell, Pie, PieChart,
  XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ── 1. Sociétés par type ─────────────────────────────────────────────────

const COMPANY_COLORS: Record<string, string> = {
  client:    'hsl(221 83% 53%)',   // indigo-500
  prospect:  'hsl(221 83% 73%)',   // indigo-300
  partenaire:'hsl(262 83% 58%)',   // violet-500
  fournisseur:'hsl(142 71% 45%)',  // green-500
  other:     'hsl(215 16% 47%)',   // slate-500
}

export function CompanyTypeChart({ data }: { data: { type: string; count: number }[] }) {
  const filled = data.length ? data : [{ type: 'Aucune donnée', count: 1 }]
  const config = Object.fromEntries(
    filled.map(d => [d.type, { label: d.type, color: COMPANY_COLORS[d.type] ?? 'hsl(215 16% 47%)' }])
  ) satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-[180px]">
      <PieChart>
        <Pie
          data={filled}
          dataKey="count"
          nameKey="type"
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          paddingAngle={3}
        >
          {filled.map((entry) => (
            <Cell
              key={entry.type}
              fill={COMPANY_COLORS[entry.type] ?? 'hsl(215 16% 47%)'}
            />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  )
}

// ── 2. Contacts cette semaine ─────────────────────────────────────────────

const contactsCfg = {
  count: { label: 'Contacts', color: 'hsl(221 83% 53%)' },
} satisfies ChartConfig

export function ContactsWeekChart({ data }: { data: { day: string; count: number }[] }) {
  return (
    <ChartContainer config={contactsCfg} className="aspect-auto h-[180px]">
      <BarChart data={data} barSize={28}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          allowDecimals={false}
          width={24}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

// ── 3. Valeur des opportunités en cours ──────────────────────────────────

const oppCfg = {
  value: { label: 'Valeur (€)', color: 'hsl(142 71% 45%)' },
} satisfies ChartConfig

export function OpportunitiesValueChart({ data }: { data: { stage: string; value: number }[] }) {
  const filled = data.length ? data : [{ stage: 'Aucune donnée', value: 0 }]
  return (
    <ChartContainer config={oppCfg} className="aspect-auto h-[180px]">
      <BarChart data={filled} barSize={32}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="stage"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          width={36}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="min-w-[140px]"
            />
          }
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
