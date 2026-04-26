import { CheckSquare } from 'lucide-react'
import { PageList }    from '@/components/modules/PageList'
import { getLocale }   from '@/lib/get-locale'
import { getT }        from '@/lib/i18n'
import { listTasks }              from '@/modules/projects/lib'
import { getTenantIdFromRequest } from '@/db/tenant'

export default async function TasksPage() {
  const t = getT(getLocale())
  let data: Record<string, unknown>[] = []
  let error: string | null = null

  try {
    const tenantId = await getTenantIdFromRequest()
    if (tenantId) data = (await listTasks(tenantId)) as unknown as Record<string, unknown>[]
  } catch (e: unknown) { error = e instanceof Error ? e.message : String(e) }

  return (
    <PageList
      title={t('tasks.title')}
      subtitle={t('tasks.subtitle')}
      icon={CheckSquare}
      newHref="/dashboard/tasks/new"
      newLabel={t('tasks.new')}
      detailBasePath="/dashboard/tasks"
      apiTable="tasks"
      data={data} error={error}
      columns={[
        { key: 'title',       label: t('tasks.col.title')                              },
        { key: 'status',      label: t('tasks.col.status'),      renderAs: 'taskStatus' },
        { key: 'est_hours',   label: t('tasks.col.est_hours')                          },
        { key: 'act_hours',   label: t('tasks.col.act_hours')                          },
        { key: 'hourly_cost', label: t('tasks.col.hourly_cost')                        },
      ]}
    />
  )
}
