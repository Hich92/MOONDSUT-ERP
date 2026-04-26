import { FileText }  from 'lucide-react'
import { PageList }  from '@/components/modules/PageList'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'
import { listContracts }          from '@/modules/sales/lib'
import { getTenantIdFromRequest } from '@/db/tenant'

export default async function ContractsPage() {
  const t = getT(getLocale())
  let data: Record<string, unknown>[] = []
  let error: string | null = null

  try {
    const tenantId = await getTenantIdFromRequest()
    if (tenantId) data = (await listContracts(tenantId)) as unknown as Record<string, unknown>[]
  } catch (e: unknown) { error = e instanceof Error ? e.message : String(e) }

  return (
    <PageList
      title={t('contracts.title')}
      subtitle={t('contracts.subtitle')}
      icon={FileText}
      newHref="/dashboard/contracts/new"
      newLabel={t('contracts.new')}
      detailBasePath="/dashboard/contracts"
      apiTable="contracts"
      data={data} error={error}
      columns={[
        { key: 'id',          label: t('contracts.col.id')                                    },
        { key: 'status',      label: t('contracts.col.status'),      renderAs: 'contractStatus' },
        { key: 'total_value', label: t('contracts.col.total_value'), renderAs: 'amount'         },
        { key: 'start_date',  label: t('contracts.col.start_date'),  renderAs: 'date'           },
        { key: 'end_date',    label: t('contracts.col.end_date'),    renderAs: 'date'           },
      ]}
    />
  )
}
