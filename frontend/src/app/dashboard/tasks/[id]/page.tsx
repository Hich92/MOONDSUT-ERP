import { notFound }    from 'next/navigation'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { CheckSquare } from 'lucide-react'
import { PageDetail } from '@/components/modules/PageDetail'
import { StatusBar, type Stage } from '@/components/modules/StatusBar'
import { getLocale }  from '@/lib/get-locale'
import { getT }       from '@/lib/i18n'

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const t = getT(getLocale())

  const STAGES: Stage[] = [
    { key: 'todo',        label: t('opt.todo')        },
    { key: 'in_progress', label: t('opt.in_progress') },
    { key: 'review',      label: t('opt.review')      },
    { key: 'done',        label: t('opt.done')        },
  ]
  const client = await getServerPostgRESTClient()
  const record = await client.get('tasks', Number(params.id))
  if (!record) notFound()

  const [project, assignedUser] = await Promise.all([
    record.project_id
      ? client.get<{ id: number; name: string }>('projects', Number(record.project_id)).catch(() => null)
      : null,
    record.assigned_to
      ? client.get<{ id: number; email: string }>('users', Number(record.assigned_to)).catch(() => null)
      : null,
  ])

  return (
    <PageDetail
      title={String(record.title ?? `#${record.id}`)}
      iconNode={<CheckSquare className="w-4 h-4 text-cyan-600" />}
      backHref="/dashboard/tasks"
      record={record}
      relatedTable="tasks"
      statusBar={<StatusBar stages={STAGES} current={String(record.status ?? 'todo')} />}
      fields={[
        {
          key: 'title', label: t('field.task_title'), editType: 'text', span: true,
          tooltip: t('field.task_title_tip'),
        },
        {
          key: 'project_id', label: t('field.project'),
          resolvedLabel: project?.name,
          goToPath: '/dashboard/projects',
          editType: 'linked',
          linkedTable: 'projects', linkedLabelField: 'name', linkedSubField: 'status',
          tooltip: t('field.project_tip'),
        },
        {
          key: 'assigned_to', label: t('field.assigned_to'),
          resolvedLabel: assignedUser?.email,
          editType: 'number',
          tooltip: t('field.assigned_to_tip'),
        },
        {
          key: 'status', label: t('field.status'),
          renderAs: 'taskStatus',
          editType: 'select',
          editOptions: STAGES.map(s => ({ value: s.key, label: s.label })),
          tooltip: t('field.status_tip'),
        },
        {
          key: 'est_hours', label: t('field.est_hours'),
          editType: 'number', tooltip: t('field.est_hours_tip'),
        },
        {
          key: 'act_hours', label: t('field.act_hours'),
          editType: 'number', tooltip: t('field.act_hours_tip'),
        },
        {
          key: 'hourly_cost', label: t('field.hourly_cost'),
          renderAs: 'amount', editType: 'number',
          tooltip: t('field.hourly_cost_tip'),
        },
      ]}
    />
  )
}
