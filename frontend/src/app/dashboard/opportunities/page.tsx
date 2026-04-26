import { Target }    from 'lucide-react'
import { PageList }  from '@/components/modules/PageList'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'
import { listOpportunities }      from '@/modules/crm/lib'
import { getTenantIdFromRequest } from '@/db/tenant'

export default async function OpportunitiesPage() {
  const t = getT(getLocale())
  let data: Record<string, unknown>[] = []
  let error: string | null = null

  try {
    const tenantId = await getTenantIdFromRequest()
    if (tenantId) {
      const rows = await listOpportunities(tenantId)
      data = rows as unknown as Record<string, unknown>[]
    }
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e)
  }

  return (
    <PageList
      title={t('opportunities.title')}
      subtitle={t('opportunities.subtitle')}
      icon={Target}
      newHref="/dashboard/opportunities/new"
      newLabel={t('opportunities.new')}
      detailBasePath="/dashboard/opportunities"
      apiTable="opportunities"
      data={data} error={error}
      columns={[
        { key: 'name',         label: t('opportunities.col.name')                          },
        { key: 'stage',        label: t('opportunities.col.stage'),        renderAs: 'stage'  },
        { key: 'deal_value',   label: t('opportunities.col.deal_value'),   renderAs: 'amount' },
        { key: 'probability',  label: t('opportunities.col.probability'),  renderAs: 'percent'},
        { key: 'closing_date', label: t('opportunities.col.closing_date'), renderAs: 'date'   },
      ]}
    />
  )
}
