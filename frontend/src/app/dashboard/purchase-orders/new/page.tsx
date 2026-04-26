import { ShoppingCart } from 'lucide-react'
import { FormPage, type FieldConfig } from '@/components/modules/FormPage'
import { getLocale }   from '@/lib/get-locale'
import { getT }        from '@/lib/i18n'

export default async function NewPurchaseOrderPage({
  searchParams,
}: { searchParams: { partner_id?: string; supplier_contract_id?: string } }) {
  const t = getT(getLocale())

  const fields: FieldConfig[] = [
    {
      name: 'reference', label: t('field.po_reference'), type: 'text',
      required: true, span: true, placeholder: 'BC-2025-001',
      tooltip: t('field.po_reference_tip'),
    },
    {
      name: 'partner_id', label: t('field.supplier'), type: 'linked', required: true,
      defaultValue: searchParams.partner_id ? Number(searchParams.partner_id) : undefined,
      linkedTable: 'partners', linkedLabelField: 'name', linkedSubField: 'type',
      tooltip: t('field.supplier_tip'),
    },
    {
      name: 'supplier_contract_id', label: t('field.supplier_contract'), type: 'linked',
      defaultValue: searchParams.supplier_contract_id ? Number(searchParams.supplier_contract_id) : undefined,
      linkedTable: 'supplier_contracts', linkedLabelField: 'title', linkedSubField: 'status',
      tooltip: t('field.supplier_contract_tip'),
    },
    {
      name: 'status', label: t('field.status'), type: 'select', required: true, defaultValue: 'draft',
      options: [
        { value: 'draft',              label: t('opt.draft')              },
        { value: 'sent',               label: t('opt.sent')               },
        { value: 'confirmed',          label: t('opt.confirmed')          },
        { value: 'partially_received', label: t('opt.partially_received') },
        { value: 'received',           label: t('opt.received')           },
        { value: 'cancelled',          label: t('opt.cancelled')          },
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
      name: 'order_date', label: t('field.order_date'), type: 'date', required: true,
      tooltip: t('field.order_date_tip'),
    },
    {
      name: 'expected_date', label: t('field.expected_date'), type: 'date',
      tooltip: t('field.expected_date_tip'),
    },
    {
      name: 'description', label: t('field.description'), type: 'textarea', span: true,
      tooltip: t('field.description_tip'),
    },
  ]

  return (
    <FormPage
      title={t('purchase_orders.new')}
      iconNode={<ShoppingCart className="w-4 h-4" />}
      fields={fields}
      apiTable="purchase_orders"
      backHref="/dashboard/purchase-orders"
    />
  )
}
