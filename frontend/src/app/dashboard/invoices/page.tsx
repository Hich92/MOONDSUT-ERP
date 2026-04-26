import { Receipt }   from 'lucide-react'
import { PageList }  from '@/components/modules/PageList'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'
import { listInvoices }           from '@/modules/sales/lib'
import { getTenantIdFromRequest } from '@/db/tenant'

export default async function InvoicesPage() {
  const t = getT(getLocale())
  let data: Record<string, unknown>[] = []
  let error: string | null = null

  try {
    const tenantId = await getTenantIdFromRequest()
    if (tenantId) data = (await listInvoices(tenantId)) as unknown as Record<string, unknown>[]
  } catch (e: unknown) { error = e instanceof Error ? e.message : String(e) }

  return (
    <PageList
      title={t('invoices.title')}
      subtitle={t('invoices.subtitle')}
      icon={Receipt}
      newHref="/dashboard/invoices/new"
      newLabel={t('invoices.new')}
      detailBasePath="/dashboard/invoices"
      apiTable="invoices"
      data={data} error={error}
      columns={[
        { key: 'invoice_number', label: t('invoices.col.invoice_number')                      },
        { key: 'amount_ht',      label: t('invoices.col.amount_ht'),  renderAs: 'amount'      },
        { key: 'is_paid',        label: t('invoices.col.is_paid'),    renderAs: 'bool'        },
        { key: 'issue_date',     label: t('invoices.col.issue_date'), renderAs: 'date'        },
      ]}
    />
  )
}
