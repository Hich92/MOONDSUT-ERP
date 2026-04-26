import { FileInput }  from 'lucide-react'
import { FormPage, type FieldConfig } from '@/components/modules/FormPage'
import { getLocale }  from '@/lib/get-locale'
import { getT }       from '@/lib/i18n'

export default async function NewSupplierInvoicePage({
  searchParams,
}: { searchParams: { supplier_id?: string; purchase_order_id?: string; supplier_contract_id?: string } }) {
  const t = getT(getLocale())

  const fields: FieldConfig[] = [
    {
      name: 'invoice_number', label: t('field.invoice_number'), type: 'text',
      required: true, span: true, placeholder: 'FOUR-2025-001',
      tooltip: t('field.invoice_number_tip'),
    },
    {
      name: 'supplier_id', label: t('field.supplier'), type: 'linked', required: true,
      defaultValue: searchParams.supplier_id ? Number(searchParams.supplier_id) : undefined,
      linkedTable: 'suppliers', linkedLabelField: 'name', linkedSubField: 'type',
      tooltip: t('field.supplier_tip'),
    },
    {
      name: 'purchase_order_id', label: t('field.purchase_order'), type: 'linked',
      defaultValue: searchParams.purchase_order_id ? Number(searchParams.purchase_order_id) : undefined,
      linkedTable: 'purchase_orders', linkedLabelField: 'reference', linkedSubField: 'status',
      tooltip: t('field.purchase_order_tip'),
    },
    {
      name: 'supplier_contract_id', label: t('field.supplier_contract'), type: 'linked',
      defaultValue: searchParams.supplier_contract_id ? Number(searchParams.supplier_contract_id) : undefined,
      linkedTable: 'supplier_contracts', linkedLabelField: 'title', linkedSubField: 'status',
      tooltip: t('field.supplier_contract_tip'),
    },
    {
      name: 'status', label: t('field.status'), type: 'select', required: true, defaultValue: 'received',
      options: [
        { value: 'draft',    label: t('opt.draft')    },
        { value: 'received', label: t('opt.received') },
        { value: 'to_pay',   label: t('opt.to_pay')   },
        { value: 'paid',     label: t('opt.paid')     },
        { value: 'disputed', label: t('opt.disputed') },
      ],
      tooltip: t('field.status_tip'),
    },
    {
      name: 'amount_ht', label: t('field.amount_ht'), type: 'number',
      required: true, placeholder: '0',
      tooltip: t('field.amount_ht_tip'),
    },
    {
      name: 'tva_rate', label: t('field.tva_rate'), type: 'number',
      defaultValue: 20, placeholder: '20',
      tooltip: t('field.tva_rate_tip'),
    },
    {
      name: 'invoice_date', label: t('field.invoice_date'), type: 'date', required: true,
      tooltip: t('field.invoice_date_tip'),
    },
    {
      name: 'due_date', label: t('field.due_date'), type: 'date',
      tooltip: t('field.due_date_tip'),
    },
    {
      name: 'notes', label: t('field.notes'), type: 'textarea', span: true,
      tooltip: t('field.notes_tip'),
    },
  ]

  return (
    <FormPage
      title={t('supplier_invoices.new')}
      iconNode={<FileInput className="w-4 h-4" />}
      fields={fields}
      apiTable="supplier_invoices"
      backHref="/dashboard/supplier-invoices"
    />
  )
}
