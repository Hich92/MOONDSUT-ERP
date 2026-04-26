import { FileInput }  from 'lucide-react'
import { PageList }   from '@/components/modules/PageList'
import { getLocale }  from '@/lib/get-locale'
import { getT }       from '@/lib/i18n'
import { listSupplierInvoices }   from '@/modules/procurement/lib'
import { getTenantIdFromRequest } from '@/db/tenant'

export default async function SupplierInvoicesPage() {
  const t = getT(getLocale())
  let data: Record<string, unknown>[] = []
  let error: string | null = null

  try {
    const tenantId = await getTenantIdFromRequest()
    if (tenantId) data = (await listSupplierInvoices(tenantId)) as unknown as Record<string, unknown>[]
  } catch (e: unknown) { error = e instanceof Error ? e.message : String(e) }

  return (
    <PageList
      title={t('supplier_invoices.title')}
      subtitle={t('supplier_invoices.subtitle')}
      icon={FileInput}
      newHref="/dashboard/supplier-invoices/new"
      newLabel={t('supplier_invoices.new')}
      detailBasePath="/dashboard/supplier-invoices"
      apiTable="supplier_invoices"
      data={data} error={error}
      columns={[
        { key: 'invoice_number', label: t('supplier_invoices.col.invoice_number')                                },
        { key: 'status',         label: t('supplier_invoices.col.status'),       renderAs: 'supplierInvoiceStatus' },
        { key: 'amount_ht',      label: t('supplier_invoices.col.amount_ht'),    renderAs: 'amount'                },
        { key: 'invoice_date',   label: t('supplier_invoices.col.invoice_date'), renderAs: 'date'                  },
        { key: 'due_date',       label: t('supplier_invoices.col.due_date'),     renderAs: 'date'                  },
      ]}
    />
  )
}
