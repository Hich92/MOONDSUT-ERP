import { FileText }  from 'lucide-react'
import { FormPage, type FieldConfig } from '@/components/modules/FormPage'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'

export default async function NewContractPage({
  searchParams,
}: { searchParams: { partner_id?: string; opportunity_id?: string } }) {
  const t = getT(getLocale())

  const fields: FieldConfig[] = [
    {
      name: 'title', label: t('field.title'), type: 'text',
      required: true, span: true, placeholder: 'Service contract — ERP migration',
      tooltip: t('field.title_tip'),
    },
    {
      name: 'partner_id', label: t('field.partner'), type: 'linked',
      defaultValue: searchParams.partner_id ? Number(searchParams.partner_id) : undefined,
      linkedTable: 'partners', linkedLabelField: 'name', linkedSubField: 'type',
      tooltip: t('field.partner_tip'),
    },
    {
      name: 'opportunity_id', label: t('field.opportunity'), type: 'linked',
      defaultValue: searchParams.opportunity_id ? Number(searchParams.opportunity_id) : undefined,
      linkedTable: 'opportunities', linkedLabelField: 'name', linkedSubField: 'stage',
      tooltip: t('field.opportunity_tip'),
    },
    {
      name: 'status', label: t('field.status'), type: 'select', required: true, defaultValue: 'draft',
      options: [
        { value: 'draft',   label: t('opt.draft')   },
        { value: 'active',  label: t('opt.active')  },
        { value: 'expired', label: t('opt.expired') },
        { value: 'closed',  label: t('opt.closed')  },
      ],
      tooltip: t('field.status_tip'),
    },
    {
      name: 'total_value', label: t('field.total_value'), type: 'number',
      required: true, placeholder: '0',
      tooltip: t('field.total_value_tip'),
    },
    {
      name: 'start_date', label: t('field.start_date'), type: 'date', required: true,
      tooltip: t('field.start_date_tip'),
    },
    {
      name: 'end_date', label: t('field.end_date'), type: 'date',
      tooltip: t('field.end_date_tip'),
    },
  ]

  return (
    <FormPage
      title={t('contracts.new')}
      iconNode={<FileText className="w-4 h-4" />}
      fields={fields}
      apiTable="contracts"
      backHref="/dashboard/contracts"
    />
  )
}
