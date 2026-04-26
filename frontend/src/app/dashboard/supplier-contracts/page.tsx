import { ScrollText } from 'lucide-react'
import { PageList }   from '@/components/modules/PageList'
import { getLocale }  from '@/lib/get-locale'
import { getT }       from '@/lib/i18n'
import { listSupplierContracts }  from '@/modules/procurement/lib'
import { getTenantIdFromRequest } from '@/db/tenant'

export default async function SupplierContractsPage() {
  const t = getT(getLocale())
  let data: Record<string, unknown>[] = []
  let error: string | null = null

  try {
    const tenantId = await getTenantIdFromRequest()
    if (tenantId) data = (await listSupplierContracts(tenantId)) as unknown as Record<string, unknown>[]
  } catch (e: unknown) { error = e instanceof Error ? e.message : String(e) }

  return (
    <PageList
      title={t('supplier_contracts.title')}
      subtitle={t('supplier_contracts.subtitle')}
      icon={ScrollText}
      newHref="/dashboard/supplier-contracts/new"
      newLabel={t('supplier_contracts.new')}
      detailBasePath="/dashboard/supplier-contracts"
      apiTable="supplier_contracts"
      data={data} error={error}
      columns={[
        { key: 'title',       label: t('supplier_contracts.col.title')                                          },
        { key: 'status',      label: t('supplier_contracts.col.status'),      renderAs: 'supplierContractStatus' },
        { key: 'total_value', label: t('supplier_contracts.col.total_value'), renderAs: 'amount'                 },
        { key: 'start_date',  label: t('supplier_contracts.col.start_date'),  renderAs: 'date'                   },
        { key: 'end_date',    label: t('supplier_contracts.col.end_date'),    renderAs: 'date'                   },
      ]}
    />
  )
}
