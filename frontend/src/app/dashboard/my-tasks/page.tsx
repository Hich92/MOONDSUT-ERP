import { Bell }      from 'lucide-react'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'
import { TaskInbox } from './TaskInbox'

export default function MyTasksPage() {
  const t = getT(getLocale())

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden">
      {/* Page header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b flex-shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15">
          <Bell className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">{t('inbox.title')}</h1>
          <p className="text-xs text-muted-foreground">{t('inbox.subtitle')}</p>
        </div>
      </div>

      {/* Main inbox — client component handles its own data */}
      <TaskInbox />
    </div>
  )
}
