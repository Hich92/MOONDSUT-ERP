import { notFound }    from 'next/navigation'
import { getServerPostgRESTClient } from '@/lib/postgrest'
import { Users }      from 'lucide-react'
import { PageDetail } from '@/components/modules/PageDetail'
import { RelatedList } from '@/components/modules/RelatedList'
import { getLocale }  from '@/lib/get-locale'
import { getT }       from '@/lib/i18n'

const PARTNER_TYPES = [
  { value: 'contact',     label: 'Contact'     },
  { value: 'prospect',    label: 'Prospect'    },
  { value: 'client',      label: 'Client'      },
  { value: 'ex-client',   label: 'Ex-client'   },
  { value: 'fournisseur', label: 'Fournisseur' },
  { value: 'partenaire',  label: 'Partenaire'  },
]

const LEGAL_FORMS = ['SAS','SARL','SA','SCI','EURL','EI','SASU','GIE','Association','Autre']

export default async function PartnerDetailPage({ params }: { params: { id: string } }) {
  const t  = getT(getLocale())
  const id = Number(params.id)
  const client = await getServerPostgRESTClient()
  const record = await client.get('partners', id)
  if (!record) notFound()

  const isCompany = Boolean(record.is_company)

  const [parent, contacts, contracts, opportunities] = await Promise.all([
    record.parent_id
      ? client.get<{ id: number; name: string }>('partners', Number(record.parent_id)).catch(() => null)
      : null,
    isCompany
      ? client.list<Record<string, unknown>>('partners', { parent_id: String(id) }).catch(() => [])
      : [],
    client.list<Record<string, unknown>>('contracts',    { partner_id: String(id) }).catch(() => []),
    client.list<Record<string, unknown>>('opportunities', { partner_id: String(id) }).catch(() => []),
  ])

  // Fields communs
  const commonFields = [
    {
      key: 'type', label: t('field.type'),
      renderAs: 'partnerType' as const,
      editType: 'select' as const,
      editOptions: PARTNER_TYPES,
      tooltip: t('field.type_tip'),
    },
    { key: 'email',  label: t('field.email'),  editType: 'email' as const, tooltip: t('field.email_tip')  },
    { key: 'phone',  label: t('field.phone'),  editType: 'text' as const,  tooltip: t('field.phone_tip')  },
    { key: 'mobile', label: t('field.mobile'), editType: 'text' as const,  tooltip: t('field.mobile_tip') },
    { key: 'address',label: t('field.address'),editType: 'text' as const, span: true, tooltip: t('field.address_tip') },
    { key: 'city',   label: t('field.city'),   editType: 'text' as const,  tooltip: t('field.city_tip')   },
    { key: 'zip',    label: t('field.zip'),    editType: 'text' as const,  tooltip: t('field.zip_tip')    },
    { key: 'country',label: t('field.country'),editType: 'text' as const,  tooltip: t('field.country_tip')},
    {
      key: 'payment_terms', label: t('field.payment_terms'),
      editType: 'select' as const,
      editOptions: [
        { value: '0', label: 'Immédiat'  }, { value: '15', label: '15 jours' },
        { value: '30', label: '30 jours' }, { value: '45', label: '45 jours' },
        { value: '60', label: '60 jours' }, { value: '90', label: '90 jours' },
      ],
      tooltip: t('field.payment_terms_tip'),
    },
    { key: 'notes', label: t('field.notes'), editType: 'textarea' as const, span: true, tooltip: t('field.notes_tip') },
  ]

  // Fields spécifiques société
  const companyFields = isCompany ? [
    { key: 'siren',      label: 'SIREN',              editType: 'text' as const, tooltip: t('field.siret_tip')      },
    { key: 'siret',      label: 'SIRET',              editType: 'text' as const, tooltip: t('field.siret_tip')      },
    { key: 'legal_form', label: t('field.legal_form'),editType: 'select' as const, editOptions: LEGAL_FORMS.map(f => ({ value: f, label: f })), tooltip: t('field.legal_form_tip') },
    { key: 'vat',        label: t('field.vat'),       editType: 'text' as const, tooltip: t('field.vat_tip')        },
    { key: 'code_naf',   label: 'Code NAF',           editType: 'text' as const, tooltip: 'Code APE / NAF'          },
    { key: 'website',    label: t('field.website'),   editType: 'text' as const, tooltip: t('field.website_tip')    },
  ] : [
    {
      key: 'first_name', label: t('field.first_name'), editType: 'text' as const,
      tooltip: t('field.first_name_tip'),
    },
    {
      key: 'parent_id', label: t('field.parent'),
      resolvedLabel: parent?.name,
      goToPath: '/dashboard/partners',
      editType: 'linked' as const,
      linkedTable: 'partners', linkedLabelField: 'name', linkedSubField: 'type',
      tooltip: t('field.parent_tip'),
    },
  ]

  const nameField = {
    key: 'name', label: isCompany ? 'Raison sociale' : t('field.name'),
    editType: 'text' as const, span: true, tooltip: t('field.name_tip'),
  }

  return (
    <PageDetail
      title={String(record.name ?? `#${record.id}`)}
      subtitle={isCompany ? 'Société' : 'Particulier'}
      iconNode={<Users className="w-4 h-4 text-orange-600" />}
      backHref="/dashboard/partners"
      record={record}
      relatedTable="partners"
      fields={[nameField, ...companyFields, ...commonFields]}
      tabs={
        <>
          {isCompany && contacts.length > 0 && (
            <RelatedList
              title="Contacts rattachés"
              items={contacts}
              columns={[
                { key: 'name',  label: t('related.col.name')  },
                { key: 'type',  label: t('related.col.role'), renderAs: 'partnerType' },
                { key: 'email', label: t('related.col.email') },
              ]}
              detailBasePath="/dashboard/partners"
              newHref={`/dashboard/partners/new?is_company=false&parent_id=${id}`}
              newLabel="Nouveau contact"
              emptyMessage={t('related.no_partners')}
            />
          )}
          {contracts.length > 0 && (
            <RelatedList
              title={t('contracts.title')}
              items={contracts}
              columns={[
                { key: 'title',       label: t('related.col.title')                           },
                { key: 'status',      label: t('related.col.status'), renderAs: 'contractStatus' },
                { key: 'total_value', label: t('related.col.amount'), renderAs: 'amount'         },
              ]}
              detailBasePath="/dashboard/contracts"
              newHref={`/dashboard/contracts/new?partner_id=${id}`}
              newLabel={t('contracts.new')}
              emptyMessage={t('related.no_invoices')}
            />
          )}
          {opportunities.length > 0 && (
            <RelatedList
              title={t('opportunities.title')}
              items={opportunities}
              columns={[
                { key: 'name',       label: t('related.col.title')                        },
                { key: 'stage',      label: t('related.col.stage'), renderAs: 'stage'     },
                { key: 'deal_value', label: t('related.col.value'), renderAs: 'amount'    },
              ]}
              detailBasePath="/dashboard/opportunities"
              newHref={`/dashboard/opportunities/new?partner_id=${id}`}
              newLabel={t('opportunities.new')}
              emptyMessage={t('related.no_opportunities')}
            />
          )}
        </>
      }
    />
  )
}
