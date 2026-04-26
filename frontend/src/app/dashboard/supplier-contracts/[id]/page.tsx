import { notFound }    from 'next/navigation'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { ScrollText } from 'lucide-react'
import { PageDetail } from '@/components/modules/PageDetail'
import { StatusBar, type Stage } from '@/components/modules/StatusBar'
import { RelatedList } from '@/components/modules/RelatedList'
import { getLocale }  from '@/lib/get-locale'
import { getT }       from '@/lib/i18n'

export default async function SupplierContractDetailPage({ params }: { params: { id: string } }) {
  const t = getT(getLocale())
  const id = Number(params.id)

  const STAGES: Stage[] = [
    { key: 'draft',   label: t('opt.draft')   },
    { key: 'active',  label: t('opt.active')  },
    { key: 'expired', label: t('opt.expired') },
    { key: 'closed',  label: t('opt.closed')  },
  ]
  const client = await getServerPostgRESTClient()
  const record = await client.get('supplier_contracts', id)
  if (!record) notFound()

  const [supplier, purchaseOrders, supplierInvoices] = await Promise.all([
    record.partner_id
      ? client.get<{ id: number; name: string }>('partners', Number(record.partner_id)).catch(() => null)
      : null,
    client.list<Record<string, unknown>>('purchase_orders',   { supplier_contract_id: String(id) }).catch(() => []),
    client.list<Record<string, unknown>>('supplier_invoices', { supplier_contract_id: String(id) }).catch(() => []),
  ])

  return (
    <PageDetail
      title={String(record.title ?? `#${record.id}`)}
      iconNode={<ScrollText className="w-4 h-4 text-blue-600" />}
      backHref="/dashboard/supplier-contracts"
      record={record}
      relatedTable="supplier_contracts"
      statusBar={<StatusBar stages={STAGES} current={String(record.status ?? 'draft')} />}
      fields={[
        {
          key: 'title', label: t('field.title'), editType: 'text', span: true,
          tooltip: t('field.title_tip'),
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
          key: 'status', label: t('field.status'),
          renderAs: 'supplierContractStatus',
          editType: 'select',
          editOptions: STAGES.map(s => ({ value: s.key, label: s.label })),
          tooltip: t('field.status_tip'),
        },
        {
          key: 'total_value', label: t('field.total_value'),
          renderAs: 'amount', editType: 'number',
          tooltip: t('field.total_value_tip'),
        },
        {
          key: 'start_date', label: t('field.start_date'),
          renderAs: 'date', editType: 'date',
          tooltip: t('field.start_date_tip'),
        },
        {
          key: 'end_date', label: t('field.end_date'),
          renderAs: 'date', editType: 'date',
          tooltip: t('field.end_date_tip'),
        },
        {
          key: 'notes', label: t('field.notes'), editType: 'textarea', span: true,
          tooltip: t('field.notes_tip'),
        },
      ]}
      tabs={
        <>
          <RelatedList
            title={t('purchase_orders.title')}
            items={purchaseOrders}
            columns={[
              { key: 'reference',  label: t('purchase_orders.col.reference')                       },
              { key: 'status',     label: t('related.col.status'), renderAs: 'purchaseOrderStatus' },
              { key: 'amount_ht',  label: t('related.col.amount'), renderAs: 'amount'              },
              { key: 'order_date', label: t('purchase_orders.col.order_date'), renderAs: 'date'    },
            ]}
            detailBasePath="/dashboard/purchase-orders"
            newHref={`/dashboard/purchase-orders/new?supplier_contract_id=${id}`}
            newLabel={t('purchase_orders.new')}
            emptyMessage={t('related.no_purchase_orders')}
          />
          <RelatedList
            title={t('supplier_invoices.title')}
            items={supplierInvoices}
            columns={[
              { key: 'invoice_number', label: t('related.col.number')                                   },
              { key: 'status',         label: t('related.col.status'), renderAs: 'supplierInvoiceStatus' },
              { key: 'amount_ht',      label: t('related.col.amount'), renderAs: 'amount'                },
              { key: 'due_date',       label: t('supplier_invoices.col.due_date'), renderAs: 'date'      },
            ]}
            detailBasePath="/dashboard/supplier-invoices"
            newHref={`/dashboard/supplier-invoices/new?supplier_contract_id=${id}`}
            newLabel={t('supplier_invoices.new')}
            emptyMessage={t('related.no_supplier_invoices')}
          />
        </>
      }
    />
  )
}
