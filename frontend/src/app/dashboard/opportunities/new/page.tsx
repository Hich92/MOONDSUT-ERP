import { Target }   from 'lucide-react'
import { FormPage, type FieldConfig } from '@/components/modules/FormPage'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'

export default async function NewOpportunityPage({
  searchParams,
}: { searchParams: { partner_id?: string } }) {
  const t = getT(getLocale())

  const fields: FieldConfig[] = [
    {
      name: 'name', label: t('field.opp_name'), type: 'text',
      required: true, span: true, placeholder: 'ERP Migration Client X',
      tooltip: t('field.opp_name_tip'),
    },
    {
      name: 'partner_id', label: t('field.partner'), type: 'linked',
      defaultValue: searchParams.partner_id ? Number(searchParams.partner_id) : undefined,
      linkedTable: 'partners', linkedLabelField: 'name', linkedSubField: 'type',
      tooltip: t('field.partner_tip'),
    },
    {
      name: 'stage', label: t('field.stage'), type: 'select',
      required: true, defaultValue: 'lead',
      options: [
        { value: 'lead',          label: t('opt.lead')          },
        { value: 'qualification', label: t('opt.qualification') },
        { value: 'proposition',   label: t('opt.proposition')   },
        { value: 'negotiation',   label: t('opt.negotiation')   },
        { value: 'won',           label: t('opt.won')           },
        { value: 'lost',          label: t('opt.lost')          },
      ],
      tooltip: t('field.stage_tip'),
    },
    {
      name: 'probability', label: t('field.probability'), type: 'number',
      placeholder: '0–100', defaultValue: 10,
      tooltip: t('field.probability_tip'),
    },
    {
      name: 'deal_value', label: t('field.value'), type: 'number',
      placeholder: '0', tooltip: t('field.deal_value_tip'),
    },
    {
      name: 'deal_type', label: t('field.deal_type'), type: 'text',
      placeholder: 'Integration, License…', tooltip: t('field.deal_type_tip'),
    },
    {
      name: 'submission_date', label: t('field.submission_date'), type: 'date',
      tooltip: t('field.submission_date_tip'),
    },
    {
      name: 'closing_date', label: t('field.close_date'), type: 'date',
      tooltip: t('field.close_date_tip'),
    },
    {
      name: 'tender_type', label: t('field.tender_type'), type: 'text',
      placeholder: 'Public, Private…', tooltip: t('field.tender_type_tip'),
    },
    {
      name: 'has_negotiation', label: t('field.has_negotiation'), type: 'checkbox',
      defaultValue: false, tooltip: t('field.has_negotiation_tip'),
    },
    {
      name: 'has_demo', label: t('field.has_demo'), type: 'checkbox',
      defaultValue: false, tooltip: t('field.has_demo_tip'),
    },
    {
      name: 'has_migration', label: t('field.has_migration'), type: 'checkbox',
      defaultValue: false, tooltip: t('field.has_migration_tip'),
    },
  ]

  return (
    <FormPage
      title={t('opportunities.new')}
      iconNode={<Target className="w-4 h-4" />}
      fields={fields}
      apiTable="opportunities"
      backHref="/dashboard/opportunities"
    />
  )
}
