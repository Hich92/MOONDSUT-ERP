import { ScrollText } from 'lucide-react'
import { FormPage, type FieldConfig } from '@/components/modules/FormPage'
import { getLocale }  from '@/lib/get-locale'
import { getT }       from '@/lib/i18n'

export default async function NewSupplierContractPage({
  searchParams,
}: { searchParams: { partner_id?: string } }) {
  const t = getT(getLocale())

  const fields: FieldConfig[] = [
    {
      name: 'title', label: t('field.title'), type: 'text',
      required: true, span: true, placeholder: 'Contrat maintenance serveurs 2025',
      tooltip: t('field.title_tip'),
    },
    {
      name: 'partner_id', label: t('field.supplier'), type: 'linked',
      defaultValue: searchParams.partner_id ? Number(searchParams.partner_id) : undefined,
      linkedTable: 'partners', linkedLabelField: 'name', linkedSubField: 'type',
      tooltip: t('field.supplier_tip'),
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
    {
      name: 'notes', label: t('field.notes'), type: 'textarea', span: true,
      tooltip: t('field.notes_tip'),
    },
  ]

  return (
    <FormPage
      title={t('supplier_contracts.new')}
      iconNode={<ScrollText className="w-4 h-4" />}
      fields={fields}
      apiTable="supplier_contracts"
      backHref="/dashboard/supplier-contracts"
    />
  )
}
