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

// ── 1. Facturé cette année vs reste à facturer ────────────────────────────

const invoicesCfg = {
  paid:   { label: 'Facturé',           color: 'hsl(142 71% 45%)' },
  unpaid: { label: 'Reste à facturer',  color: 'hsl(38 92% 50%)'  },
} satisfies ChartConfig

export function InvoicesChart({
  paid,
  unpaid,
}: {
  paid: number
  unpaid: number
}) {
  const data = [
    { name: 'Facturé',          value: paid,   key: 'paid' },
    { name: 'Reste à facturer', value: unpaid, key: 'unpaid' },
  ]
  const total = paid + unpaid

  return (
    <ChartContainer config={invoicesCfg} className="aspect-auto h-[180px]">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          paddingAngle={4}
          startAngle={90}
          endAngle={-270}
        >
          <Cell fill="hsl(142 71% 45%)" />
          <Cell fill="hsl(38 92% 50%)" />
        </Pie>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              className="min-w-[160px]"
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  )
}

// ── 2. Contrats courants par statut ───────────────────────────────────────

const CONTRACT_COLORS: Record<string, string> = {
  actif:     'hsl(221 83% 53%)',
  active:    'hsl(221 83% 53%)',
  draft:     'hsl(215 16% 60%)',
  brouillon: 'hsl(215 16% 60%)',
  expire:    'hsl(38 92% 50%)',
  expired:   'hsl(38 92% 50%)',
  clos:      'hsl(0 84% 60%)',
  closed:    'hsl(0 84% 60%)',
}

const CONTRACT_LABELS: Record<string, string> = {
  actif:     'Actif',
  active:    'Actif',
  draft:     'Brouillon',
  brouillon: 'Brouillon',
  expire:    'Expiré',
  expired:   'Expiré',
  clos:      'Clôturé',
  closed:    'Clôturé',
}

export function ContractsStatusChart({
  data,
}: {
  data: { status: string; count: number }[]
}) {
  const filled = data.length ? data : [{ status: 'Aucun contrat', count: 0 }]
  const config = Object.fromEntries(
    filled.map(d => [
      d.status,
      {
        label: CONTRACT_LABELS[d.status] ?? d.status,
        color: CONTRACT_COLORS[d.status] ?? 'hsl(215 16% 47%)',
      },
    ])
  ) satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-[180px]">
      <BarChart data={filled} barSize={40}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="status"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v: string) => CONTRACT_LABELS[v] ?? v}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          allowDecimals={false}
          width={24}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {filled.map((entry) => (
            <Cell
              key={entry.status}
              fill={CONTRACT_COLORS[entry.status] ?? 'hsl(215 16% 47%)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
