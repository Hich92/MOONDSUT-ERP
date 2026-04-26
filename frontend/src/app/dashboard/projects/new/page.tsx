import { FolderKanban } from 'lucide-react'
import { FormPage, type FieldConfig } from '@/components/modules/FormPage'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'

export default async function NewProjectPage({
  searchParams,
}: { searchParams: { contract_id?: string } }) {
  const t = getT(getLocale())

  const fields: FieldConfig[] = [
    {
      name: 'contract_id', label: t('field.contract'), type: 'linked', required: true,
      defaultValue: searchParams.contract_id ? Number(searchParams.contract_id) : undefined,
      linkedTable: 'contracts', linkedLabelField: 'title', linkedSubField: 'status',
      tooltip: t('field.contract_tip'),
    },
    {
      name: 'name', label: t('field.project_name'), type: 'text',
      required: true, span: true, placeholder: 'ERP Migration — Phase 1',
      tooltip: t('field.project_name_tip'),
    },
    {
      name: 'status', label: t('field.status'), type: 'select', required: true, defaultValue: 'planned',
      options: [
        { value: 'planned',     label: t('opt.planned')     },
        { value: 'in_progress', label: t('opt.in_progress') },
        { value: 'on_hold',     label: t('opt.on_hold')     },
        { value: 'delivered',   label: t('opt.delivered')   },
        { value: 'cancelled',   label: t('opt.cancelled')   },
      ],
      tooltip: t('field.status_tip'),
    },
    {
      name: 'progress', label: t('field.progress'), type: 'number',
      placeholder: '0', defaultValue: 0,
      tooltip: t('field.progress_tip'),
    },
  ]

  return (
    <FormPage
      title={t('projects.new')}
      iconNode={<FolderKanban className="w-4 h-4" />}
      fields={fields}
      apiTable="projects"
      backHref="/dashboard/projects"
    />
  )
}
