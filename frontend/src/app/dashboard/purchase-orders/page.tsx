import { ShoppingCart }  from 'lucide-react'
import { PageList }      from '@/components/modules/PageList'
import { getLocale }     from '@/lib/get-locale'
import { getT }          from '@/lib/i18n'
import { listPurchaseOrders }     from '@/modules/procurement/lib'
import { getTenantIdFromRequest } from '@/db/tenant'

export default async function PurchaseOrdersPage() {
  const t = getT(getLocale())
  let data: Record<string, unknown>[] = []
  let error: string | null = null

  try {
    const tenantId = await getTenantIdFromRequest()
    if (tenantId) data = (await listPurchaseOrders(tenantId)) as unknown as Record<string, unknown>[]
  } catch (e: unknown) { error = e instanceof Error ? e.message : String(e) }

  return (
    <PageList
      title={t('purchase_orders.title')}
      subtitle={t('purchase_orders.subtitle')}
      icon={ShoppingCart}
      newHref="/dashboard/purchase-orders/new"
      newLabel={t('purchase_orders.new')}
      detailBasePath="/dashboard/purchase-orders"
      apiTable="purchase_orders"
      data={data} error={error}
      columns={[
        { key: 'reference',     label: t('purchase_orders.col.reference')                                    },
        { key: 'status',        label: t('purchase_orders.col.status'),       renderAs: 'purchaseOrderStatus' },
        { key: 'amount_ht',     label: t('purchase_orders.col.amount_ht'),    renderAs: 'amount'              },
        { key: 'order_date',    label: t('purchase_orders.col.order_date'),   renderAs: 'date'                },
        { key: 'expected_date', label: t('purchase_orders.col.expected_date'), renderAs: 'date'               },
      ]}
    />
  )
}
