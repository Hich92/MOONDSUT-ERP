import { notFound }     from 'next/navigation'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { FileText }    from 'lucide-react'
import { PageDetail }  from '@/components/modules/PageDetail'
import { StatusBar, type Stage } from '@/components/modules/StatusBar'
import { RelatedList } from '@/components/modules/RelatedList'
import { getLocale }   from '@/lib/get-locale'
import { getT }        from '@/lib/i18n'

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const t = getT(getLocale())
  const id = Number(params.id)

  const STAGES: Stage[] = [
    { key: 'draft',   label: t('opt.draft')   },
    { key: 'active',  label: t('opt.active')  },
    { key: 'expired', label: t('opt.expired') },
    { key: 'closed',  label: t('opt.closed')  },
  ]
  const client = await getServerPostgRESTClient()
  const record = await client.get('contracts', id)
  if (!record) notFound()

  const [opportunity, partner, invoices] = await Promise.all([
    record.opportunity_id
      ? client.get<{ id: number; name: string }>('opportunities', Number(record.opportunity_id)).catch(() => null)
      : null,
    record.partner_id
      ? client.get<{ id: number; name: string }>('partners', Number(record.partner_id)).catch(() => null)
      : null,
    client.list<Record<string, unknown>>('invoices', { contract_id: String(id) }).catch(() => []),
  ])

  return (
    <PageDetail
      title={String(record.title ?? `#${record.id}`)}
      iconNode={<FileText className="w-4 h-4 text-blue-600" />}
      backHref="/dashboard/contracts"
      record={record}
      relatedTable="contracts"
      statusBar={<StatusBar stages={STAGES} current={String(record.status ?? 'draft')} />}
      fields={[
        {
          key: 'title', label: t('field.title'), editType: 'text', span: true,
          tooltip: t('field.title_tip'),
        },
        {
          key: 'partner_id', label: t('field.partner'),
          resolvedLabel: partner?.name,
          goToPath: '/dashboard/partners',
          editType: 'linked',
          linkedTable: 'partners', linkedLabelField: 'name', linkedSubField: 'type',
          tooltip: t('field.partner_tip'),
        },
        {
          key: 'opportunity_id', label: t('field.opportunity'),
          resolvedLabel: opportunity?.name,
          goToPath: '/dashboard/opportunities',
          editType: 'linked',
          linkedTable: 'opportunities', linkedLabelField: 'name', linkedSubField: 'stage',
          tooltip: t('field.opportunity_tip'),
        },
        {
          key: 'status', label: t('field.status'),
          renderAs: 'contractStatus',
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
      ]}
      tabs={
        <RelatedList
          title={t('invoices.title')}
          items={invoices}
          columns={[
            { key: 'invoice_number', label: t('related.col.number')                           },
            { key: 'amount_ht',      label: t('related.col.amount'), renderAs: 'amount'       },
            { key: 'is_paid',        label: t('related.col.paid'),   renderAs: 'bool'         },
            { key: 'issue_date',     label: t('related.col.issued'), renderAs: 'date'         },
          ]}
          detailBasePath="/dashboard/invoices"
          newHref={`/dashboard/invoices/new?contract_id=${id}`}
          newLabel={t('invoices.new')}
          emptyMessage={t('related.no_invoices')}
        />
      }
    />
  )
}
