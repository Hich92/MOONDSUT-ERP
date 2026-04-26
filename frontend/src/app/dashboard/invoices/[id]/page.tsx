import { notFound }    from 'next/navigation'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { Receipt }    from 'lucide-react'
import { PageDetail } from '@/components/modules/PageDetail'
import { StatusBar, type Stage } from '@/components/modules/StatusBar'
import { getLocale }  from '@/lib/get-locale'
import { getT }       from '@/lib/i18n'

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const t = getT(getLocale())

  const STAGES: Stage[] = [
    { key: 'draft',   label: t('opt.draft')   },
    { key: 'sent',    label: t('opt.sent')    },
    { key: 'paid',    label: t('opt.paid')    },
    { key: 'overdue', label: t('opt.overdue') },
  ]
  const client = await getServerPostgRESTClient()
  const record = await client.get('invoices', Number(params.id))
  if (!record) notFound()

  const contract = record.contract_id
    ? await client.get<{ id: number; title: string; status: string }>('contracts', Number(record.contract_id)).catch(() => null)
    : null

  return (
    <PageDetail
      title={String(record.invoice_number ?? `#${record.id}`)}
      iconNode={<Receipt className="w-4 h-4 text-slate-600" />}
      backHref="/dashboard/invoices"
      record={record}
      relatedTable="invoices"
      statusBar={<StatusBar stages={STAGES} current={record.is_paid ? 'paid' : 'draft'} />}
      fields={[
        {
          key: 'invoice_number', label: t('field.invoice_number'), editType: 'text',
          tooltip: t('field.invoice_number_tip'),
        },
        {
          key: 'contract_id', label: t('field.contract'),
          resolvedLabel: contract ? (contract.title || `#${contract.id}`) : undefined,
          goToPath: '/dashboard/contracts',
          editType: 'linked',
          linkedTable: 'contracts', linkedLabelField: 'title', linkedSubField: 'status',
          tooltip: t('field.contract_tip'),
        },
        {
          key: 'amount_ht', label: t('field.amount_ht'),
          renderAs: 'amount', editType: 'number',
          tooltip: t('field.amount_ht_tip'),
        },
        {
          key: 'issue_date', label: t('field.issue_date'),
          renderAs: 'date', editType: 'date',
          tooltip: t('field.issue_date_tip'),
        },
        {
          key: 'is_paid', label: t('field.is_paid'),
          renderAs: 'bool', editType: 'checkbox',
          tooltip: t('field.is_paid_tip'),
        },
      ]}
    />
  )
}
