import { notFound }    from 'next/navigation'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { Target }     from 'lucide-react'
import { PageDetail } from '@/components/modules/PageDetail'
import { StatusBar, type Stage } from '@/components/modules/StatusBar'
import { getLocale }  from '@/lib/get-locale'
import { getT }       from '@/lib/i18n'

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const t = getT(getLocale())

  const STAGES: Stage[] = [
    { key: 'lead',          label: t('opt.lead')          },
    { key: 'qualification', label: t('opt.qualification') },
    { key: 'proposition',   label: t('opt.proposition')   },
    { key: 'negotiation',   label: t('opt.negotiation')   },
    { key: 'won',           label: t('opt.won')           },
    { key: 'lost',          label: t('opt.lost')          },
  ]
  const client = await getServerPostgRESTClient()
  const record = await client.get('opportunities', Number(params.id))
  if (!record) notFound()

  const partner = record.partner_id
    ? await client.get<{ id: number; name: string }>('partners', Number(record.partner_id)).catch(() => null)
    : null

  return (
    <PageDetail
      title={String(record.name ?? 'Opportunity')}
      iconNode={<Target className="w-4 h-4 text-emerald-600" />}
      backHref="/dashboard/opportunities"
      record={record}
      relatedTable="opportunities"
      statusBar={<StatusBar stages={STAGES} current={String(record.stage ?? 'lead')} />}
      fields={[
        {
          key: 'name', label: t('field.opp_name'), editType: 'text', span: true,
          tooltip: t('field.opp_name_tip'),
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
          key: 'stage', label: t('field.stage'),
          renderAs: 'stage',
          editType: 'select',
          editOptions: STAGES.map(s => ({ value: s.key, label: s.label })),
          tooltip: t('field.stage_tip'),
        },
        {
          key: 'deal_value', label: t('field.deal_value'),
          renderAs: 'amount', editType: 'number',
          tooltip: t('field.deal_value_tip'),
        },
        {
          key: 'probability', label: t('field.probability'),
          renderAs: 'percent', editType: 'number',
          tooltip: t('field.probability_tip'),
        },
        {
          key: 'deal_type', label: t('field.deal_type'),
          editType: 'text', tooltip: t('field.deal_type_tip'),
        },
        {
          key: 'submission_date', label: t('field.submission_date'),
          renderAs: 'date', editType: 'date',
          tooltip: t('field.submission_date_tip'),
        },
        {
          key: 'closing_date', label: t('field.close_date'),
          renderAs: 'date', editType: 'date',
          tooltip: t('field.close_date_tip'),
        },
        {
          key: 'tender_type', label: t('field.tender_type'),
          editType: 'text', tooltip: t('field.tender_type_tip'),
        },
        {
          key: 'has_negotiation', label: t('field.has_negotiation'),
          renderAs: 'bool', editType: 'checkbox',
          tooltip: t('field.has_negotiation_tip'),
        },
        {
          key: 'has_demo', label: t('field.has_demo'),
          renderAs: 'bool', editType: 'checkbox',
          tooltip: t('field.has_demo_tip'),
        },
        {
          key: 'has_migration', label: t('field.has_migration'),
          renderAs: 'bool', editType: 'checkbox',
          tooltip: t('field.has_migration_tip'),
        },
      ]}
    />
  )
}
