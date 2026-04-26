import { notFound }     from 'next/navigation'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { FolderKanban } from 'lucide-react'
import { PageDetail }  from '@/components/modules/PageDetail'
import { StatusBar, type Stage } from '@/components/modules/StatusBar'
import { RelatedList } from '@/components/modules/RelatedList'
import { getLocale }   from '@/lib/get-locale'
import { getT }        from '@/lib/i18n'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const t = getT(getLocale())
  const id = Number(params.id)

  const STAGES: Stage[] = [
    { key: 'planned',     label: t('opt.planned')     },
    { key: 'in_progress', label: t('opt.in_progress') },
    { key: 'on_hold',     label: t('opt.on_hold')     },
    { key: 'delivered',   label: t('opt.delivered')   },
    { key: 'cancelled',   label: t('opt.cancelled')   },
  ]
  const client = await getServerPostgRESTClient()
  const record = await client.get('projects', id)
  if (!record) notFound()

  const [contract, tasks] = await Promise.all([
    record.contract_id
      ? client.get<{ id: number; title: string; status: string }>('contracts', Number(record.contract_id)).catch(() => null)
      : null,
    client.list<Record<string, unknown>>('tasks', { project_id: String(id) }).catch(() => []),
  ])

  return (
    <PageDetail
      title={String(record.name ?? `#${record.id}`)}
      iconNode={<FolderKanban className="w-4 h-4 text-violet-600" />}
      backHref="/dashboard/projects"
      record={record}
      relatedTable="projects"
      statusBar={<StatusBar stages={STAGES} current={String(record.status ?? 'planned')} />}
      fields={[
        {
          key: 'name', label: t('field.project_name'), editType: 'text', span: true,
          tooltip: t('field.project_name_tip'),
        },
        {
          key: 'contract_id', label: t('field.contract'),
          resolvedLabel: contract ? (contract.title || `#${contract.id}`) : undefined,
          goToPath: '/dashboard/contracts',
          editType: 'linked',
          linkedTable: 'contracts', linkedLabelField: 'title', linkedSubField: 'status',
          tooltip: t('field.contract_tip'),
        },
        {
          key: 'status', label: t('field.status'),
          renderAs: 'projectStatus',
          editType: 'select',
          editOptions: STAGES.map(s => ({ value: s.key, label: s.label })),
          tooltip: t('field.status_tip'),
        },
        {
          key: 'progress', label: t('field.progress'),
          renderAs: 'percent', editType: 'number',
          tooltip: t('field.progress_tip'),
        },
      ]}
      tabs={
        <RelatedList
          title={t('tasks.title')}
          items={tasks}
          columns={[
            { key: 'title',     label: t('related.col.title')                                 },
            { key: 'status',    label: t('related.col.status'),  renderAs: 'taskStatus'       },
            { key: 'est_hours', label: t('related.col.est_hours')                             },
            { key: 'act_hours', label: t('related.col.act_hours')                             },
          ]}
          detailBasePath="/dashboard/tasks"
          newHref={`/dashboard/tasks/new?project_id=${id}`}
          newLabel={t('tasks.new')}
          emptyMessage={t('related.no_tasks')}
        />
      }
    />
  )
}
