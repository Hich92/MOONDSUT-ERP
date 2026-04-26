import { CheckSquare } from 'lucide-react'
import { FormPage, type FieldConfig } from '@/components/modules/FormPage'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'

export default async function NewTaskPage({
  searchParams,
}: { searchParams: { project_id?: string } }) {
  const t = getT(getLocale())

  // La gestion des utilisateurs sera migrée lors du sprint Auth
  // En attendant, le champ assigned_to est un input numérique libre
  const fields: FieldConfig[] = [
    {
      name: 'project_id', label: t('field.project'), type: 'linked', required: true,
      defaultValue: searchParams.project_id ? Number(searchParams.project_id) : undefined,
      linkedTable: 'projects', linkedLabelField: 'name', linkedSubField: 'status',
      tooltip: t('field.project_tip'),
    },
    {
      name: 'assigned_to', label: t('field.assigned_to'), type: 'number',
      tooltip: t('field.assigned_to_tip'),
    },
    {
      name: 'title', label: t('field.task_title'), type: 'text',
      required: true, span: true, placeholder: 'API connector development',
      tooltip: t('field.task_title_tip'),
    },
    {
      name: 'status', label: t('field.status'), type: 'select', required: true, defaultValue: 'todo',
      options: [
        { value: 'todo',        label: t('opt.todo')        },
        { value: 'in_progress', label: t('opt.in_progress') },
        { value: 'review',      label: t('opt.review')      },
        { value: 'done',        label: t('opt.done')        },
      ],
      tooltip: t('field.status_tip'),
    },
    {
      name: 'est_hours', label: t('field.est_hours'), type: 'number',
      placeholder: '0', tooltip: t('field.est_hours_tip'),
    },
    {
      name: 'act_hours', label: t('field.act_hours'), type: 'number',
      placeholder: '0', tooltip: t('field.act_hours_tip'),
    },
    {
      name: 'hourly_cost', label: t('field.hourly_cost'), type: 'number',
      placeholder: '0', tooltip: t('field.hourly_cost_tip'),
    },
  ]

  return (
    <FormPage
      title={t('tasks.new')}
      iconNode={<CheckSquare className="w-4 h-4" />}
      fields={fields}
      apiTable="tasks"
      backHref="/dashboard/tasks"
    />
  )
}
