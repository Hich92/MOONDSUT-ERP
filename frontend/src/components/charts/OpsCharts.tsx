'use client'

import {
  Bar, BarChart, Cell, Pie, PieChart,
  XAxis, YAxis, CartesianGrid, LabelList,
} from 'recharts'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

// ── 1. Progression des projets (hors 100%) ───────────────────────────────

const progressCfg = {
  progress: { label: 'Avancement (%)', color: 'hsl(262 83% 58%)' },
} satisfies ChartConfig

export function ProjectsProgressChart({
  data,
}: {
  data: { name: string; progress: number }[]
}) {
  const filled = data.length ? data : [{ name: 'Aucun projet', progress: 0 }]
  return (
    <ChartContainer config={progressCfg} className="aspect-auto h-[180px]">
      <BarChart data={filled} layout="vertical" barSize={18} margin={{ left: 8, right: 32 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v: number) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          width={90}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="progress" fill="var(--color-progress)" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="progress"
            position="right"
            formatter={(v: number) => `${v}%`}
            style={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

// ── 2. Tâches en retard ───────────────────────────────────────────────────

const TASK_COLORS: Record<string, string> = {
  todo:        'hsl(215 16% 60%)',
  in_progress: 'hsl(262 83% 58%)',
  done:        'hsl(142 71% 45%)',
  overdue:     'hsl(0 84% 60%)',
  late:        'hsl(0 84% 60%)',
  blocked:     'hsl(38 92% 50%)',
}

const TASK_LABELS: Record<string, string> = {
  todo:        'À faire',
  in_progress: 'En cours',
  done:        'Terminées',
  overdue:     'En retard',
  late:        'En retard',
  blocked:     'Bloquées',
}

export function TasksStatusChart({
  data,
}: {
  data: { status: string; count: number }[]
}) {
  const filled = data.length ? data : [{ status: 'Aucune tâche', count: 1 }]
  const config = Object.fromEntries(
    filled.map(d => [
      d.status,
      {
        label: TASK_LABELS[d.status] ?? d.status,
        color: TASK_COLORS[d.status] ?? 'hsl(215 16% 47%)',
      },
    ])
  ) satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-[180px]">
      <PieChart>
        <Pie
          data={filled}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          paddingAngle={3}
        >
          {filled.map((entry) => (
            <Cell
              key={entry.status}
              fill={TASK_COLORS[entry.status] ?? 'hsl(215 16% 47%)'}
            />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  )
}
