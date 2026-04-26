import { notFound }     from 'next/navigation'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { ShoppingCart } from 'lucide-react'
import { PageDetail }  from '@/components/modules/PageDetail'
import { StatusBar, type Stage } from '@/components/modules/StatusBar'
import { RelatedList } from '@/components/modules/RelatedList'
import { getLocale }   from '@/lib/get-locale'
import { getT }        from '@/lib/i18n'

export default async function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const t = getT(getLocale())
  const id = Number(params.id)

  const STAGES: Stage[] = [
    { key: 'draft',              label: t('opt.draft')              },
    { key: 'sent',               label: t('opt.sent')               },
    { key: 'confirmed',          label: t('opt.confirmed')          },
    { key: 'partially_received', label: t('opt.partially_received') },
    { key: 'received',           label: t('opt.received')           },
  ]
  const client = await getServerPostgRESTClient()
  const record = await client.get('purchase_orders', id)
  if (!record) notFound()

  const [supplier, supplierContract, supplierInvoices] = await Promise.all([
    record.partner_id
      ? client.get<{ id: number; name: string }>('partners', Number(record.partner_id)).catch(() => null)
      : null,
    record.supplier_contract_id
      ? client.get<{ id: number; title: string }>('supplier_contracts', Number(record.supplier_contract_id)).catch(() => null)
      : null,
    client.list<Record<string, unknown>>('supplier_invoices', { purchase_order_id: String(id) }).catch(() => []),
  ])

  return (
    <PageDetail
      title={String(record.reference ?? `#${record.id}`)}
      iconNode={<ShoppingCart className="w-4 h-4 text-emerald-600" />}
      backHref="/dashboard/purchase-orders"
      record={record}
      relatedTable="purchase_orders"
      statusBar={<StatusBar stages={STAGES} current={String(record.status ?? 'draft')} />}
      fields={[
        {
          key: 'reference', label: t('field.po_reference'), editType: 'text', span: true,
          tooltip: t('field.po_reference_tip'),
        },
        {
          key: 'partner_id', label: t('field.supplier'),
          resolvedLabel: supplier?.name,
          goToPath: '/dashboard/partners',
          editType: 'linked',
          linkedTable: 'partners', linkedLabelField: 'name', linkedSubField: 'type',
          tooltip: t('field.supplier_tip'),
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
          renderAs: 'purchaseOrderStatus',
          editType: 'select',
          editOptions: [
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
          key: 'amount_ht', label: t('field.amount_ht'),
          renderAs: 'amount', editType: 'number',
          tooltip: t('field.amount_ht_tip'),
        },
        {
          key: 'tva_rate', label: t('field.tva_rate'), editType: 'number',
          tooltip: t('field.tva_rate_tip'),
        },
        {
          key: 'order_date', label: t('field.order_date'),
          renderAs: 'date', editType: 'date',
          tooltip: t('field.order_date_tip'),
        },
        {
          key: 'expected_date', label: t('field.expected_date'),
          renderAs: 'date', editType: 'date',
          tooltip: t('field.expected_date_tip'),
        },
        {
          key: 'received_date', label: t('field.received_date'),
          renderAs: 'date', editType: 'date',
          tooltip: t('field.received_date_tip'),
        },
        {
          key: 'description', label: t('field.description'), editType: 'textarea', span: true,
          tooltip: t('field.description_tip'),
        },
      ]}
      tabs={
        <RelatedList
          title={t('supplier_invoices.title')}
          items={supplierInvoices}
          columns={[
            { key: 'invoice_number', label: t('related.col.number')                                     },
            { key: 'status',         label: t('related.col.status'), renderAs: 'supplierInvoiceStatus'  },
            { key: 'amount_ht',      label: t('related.col.amount'), renderAs: 'amount'                 },
            { key: 'due_date',       label: t('supplier_invoices.col.due_date'), renderAs: 'date'       },
          ]}
          detailBasePath="/dashboard/supplier-invoices"
          newHref={`/dashboard/supplier-invoices/new?purchase_order_id=${id}`}
          newLabel={t('supplier_invoices.new')}
          emptyMessage={t('related.no_supplier_invoices')}
        />
      }
    />
  )
}
