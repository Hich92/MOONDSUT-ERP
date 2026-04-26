import { Receipt }  from 'lucide-react'
import { FormPage, type FieldConfig } from '@/components/modules/FormPage'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'

export default async function NewInvoicePage({
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
      name: 'invoice_number', label: t('field.invoice_number'), type: 'text',
      required: true, placeholder: 'INV-2025-001',
      tooltip: t('field.invoice_number_tip'),
    },
    {
      name: 'amount_ht', label: t('field.amount_ht'), type: 'number',
      required: true, placeholder: '0',
      tooltip: t('field.amount_ht_tip'),
    },
    {
      name: 'issue_date', label: t('field.issue_date'), type: 'date', required: true,
      tooltip: t('field.issue_date_tip'),
    },
    {
      name: 'is_paid', label: t('field.is_paid'), type: 'checkbox', defaultValue: false,
      tooltip: t('field.is_paid_tip'),
    },
  ]

  return (
    <FormPage
      title={t('invoices.new')}
      iconNode={<Receipt className="w-4 h-4" />}
      fields={fields}
      apiTable="invoices"
      backHref="/dashboard/invoices"
    />
  )
}
