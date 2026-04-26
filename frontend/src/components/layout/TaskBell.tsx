'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TaskBell() {
  const [count, setCount]     = useState(0)
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res  = await fetch('/api/my-tasks', { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled) {
          setCount(data.count ?? 0)
          setLoaded(true)
        }
      } catch { /* ignore */ }
    }

    load()
    const id = setInterval(load, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  return (
    <Link
      href="/dashboard/my-tasks"
      className={cn(
        'relative flex items-center justify-center w-8 h-8 rounded-md',
        'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
      )}
      title="My Tasks"
    >
      <Bell className="w-4 h-4" />
      {loaded && count > 0 && (
        <span className={cn(
          'absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full',
          'bg-destructive text-destructive-foreground text-[9px] font-bold',
          'flex items-center justify-center px-1 leading-none'
        )}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
