import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface Stage {
  key:   string
  label: string
}

interface StatusBarProps {
  stages:  Stage[]
  current: string
  variant?: 'pipeline' | 'status'
}

const TERMINAL_POSITIVE = ['won', 'active', 'delivered', 'done', 'paid']
const TERMINAL_NEGATIVE = ['lost', 'cancelled', 'expired']

export function StatusBar({ stages, current, variant = 'pipeline' }: StatusBarProps) {
  const currentIndex = stages.findIndex(s => s.key === current)
  const isTerminalNeg = TERMINAL_NEGATIVE.includes(current)
  const isTerminalPos = TERMINAL_POSITIVE.includes(current)

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {stages.map((stage, i) => {
        const isActive  = stage.key === current
        const isPast    = i < currentIndex
        const isFuture  = i > currentIndex

        return (
          <div key={stage.key} className="flex items-center min-w-0">
            <div
              className={cn(
                'relative flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium whitespace-nowrap',
                'first:rounded-l-full last:rounded-r-full',
                'border-y border-r border-l first:border-l',
                isActive && isTerminalPos && 'bg-emerald-500 text-white border-emerald-500',
                isActive && isTerminalNeg && 'bg-destructive text-destructive-foreground border-destructive',
                isActive && !isTerminalPos && !isTerminalNeg && 'bg-primary text-primary-foreground border-primary',
                isPast && 'bg-muted text-muted-foreground border-border',
                isFuture && 'bg-background text-muted-foreground border-border',
              )}
            >
              {isPast && <Check className="w-3 h-3" />}
              {stage.label}
            </div>
            {i < stages.length - 1 && (
              <div className={cn(
                'w-0 h-0 z-10 -ml-px',
                'border-y-[14px] border-y-transparent border-l-[8px]',
                isPast ? 'border-l-border' : 'border-l-border',
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
