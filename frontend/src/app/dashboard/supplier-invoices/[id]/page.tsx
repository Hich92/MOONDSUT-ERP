import { notFound }    from 'next/navigation'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { FileInput }  from 'lucide-react'
import { PageDetail } from '@/components/modules/PageDetail'
import { StatusBar, type Stage } from '@/components/modules/StatusBar'
import { getLocale }  from '@/lib/get-locale'
import { getT }       from '@/lib/i18n'

export default async function SupplierInvoiceDetailPage({ params }: { params: { id: string } }) {
  const t = getT(getLocale())
  const id = Number(params.id)

  const STAGES: Stage[] = [
    { key: 'draft',    label: t('opt.draft')    },
    { key: 'received', label: t('opt.received') },
    { key: 'to_pay',   label: t('opt.to_pay')   },
    { key: 'paid',     label: t('opt.paid')      },
  ]
  const client = await getServerPostgRESTClient()
  const record = await client.get('supplier_invoices', id)
  if (!record) notFound()

  const [supplier, purchaseOrder, supplierContract] = await Promise.all([
    record.supplier_id
      ? client.get<{ id: number; name: string }>('suppliers', Number(record.supplier_id)).catch(() => null)
      : null,
    record.purchase_order_id
      ? client.get<{ id: number; reference: string }>('purchase_orders', Number(record.purchase_order_id)).catch(() => null)
      : null,
    record.supplier_contract_id
      ? client.get<{ id: number; title: string }>('supplier_contracts', Number(record.supplier_contract_id)).catch(() => null)
      : null,
  ])

  return (
    <PageDetail
      title={String(record.invoice_number ?? `#${record.id}`)}
      iconNode={<FileInput className="w-4 h-4 text-red-600" />}
      backHref="/dashboard/supplier-invoices"
      record={record}
      relatedTable="supplier_invoices"
      statusBar={<StatusBar stages={STAGES} current={String(record.status ?? 'received')} />}
      fields={[
        {
          key: 'invoice_number', label: t('field.invoice_number'), editType: 'text', span: true,
          tooltip: t('field.invoice_number_tip'),
        },
        {
          key: 'supplier_id', label: t('field.supplier'),
          resolvedLabel: supplier?.name,
          goToPath: '/dashboard/suppliers',
          editType: 'linked',
          linkedTable: 'suppliers', linkedLabelField: 'name', linkedSubField: 'type',
          tooltip: t('field.supplier_tip'),
        },
        {
          key: 'purchase_order_id', label: t('field.purchase_order'),
          resolvedLabel: purchaseOrder?.reference,
          goToPath: '/dashboard/purchase-orders',
          editType: 'linked',
          linkedTable: 'purchase_orders', linkedLabelField: 'reference', linkedSubField: 'status',
          tooltip: t('field.purchase_order_tip'),
        },
        {
          key: 'supplier_contract_id', label: t('field.supplier_contract'),
          resolvedLabel: supplierContract?.title,
          goToPath: '/dashboard/supplier-contracts',
          editType: 'linked',
          linkedTable: 'supplier_contracts', linkedLabelField: 'title', linkedSubField: 'status',
          tooltip: t('field.supplier_contract_tip'),
        },
        {
          key: 'status', label: t('field.status'),
          renderAs: 'supplierInvoiceStatus',
          editType: 'select',
          editOptions: [
            { value: 'draft',    label: t('opt.draft')    },
            { value: 'received', label: t('opt.received') },
            { value: 'to_pay',   label: t('opt.to_pay')   },
            { value: 'paid',     label: t('opt.paid')      },
            { value: 'disputed', label: t('opt.disputed')  },
          ],
          tooltip: t('field.status_tip'),
        },
        {
          key: 'amount_ht', label: t('field.amount_ht'),
          renderAs: 'amount', editType: 'number',
          tooltip: t('field.amount_ht_tip'),
        },
        {
          key: 'tva_rate', label: t('field.tva_rate'), editType: 'number',
          tooltip: t('field.tva_rate_tip'),
        },
        {
          key: 'invoice_date', label: t('field.invoice_date'),
          renderAs: 'date', editType: 'date',
          tooltip: t('field.invoice_date_tip'),
        },
        {
          key: 'due_date', label: t('field.due_date'),
          renderAs: 'date', editType: 'date',
          tooltip: t('field.due_date_tip'),
        },
        {
          key: 'paid_date', label: t('field.paid_date'),
          renderAs: 'date', editType: 'date',
          tooltip: t('field.paid_date_tip'),
        },
        {
          key: 'payment_ref', label: t('field.payment_ref'), editType: 'text',
          tooltip: t('field.payment_ref_tip'),
        },
        {
          key: 'notes', label: t('field.notes'), editType: 'textarea', span: true,
          tooltip: t('field.notes_tip'),
        },
      ]}
    />
  )
}
