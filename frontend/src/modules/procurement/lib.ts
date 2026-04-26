import { db } from '@/db'
import { supplierContracts, purchaseOrders, supplierInvoices } from '@/db/schema/procurement'
import { eq, and, desc } from 'drizzle-orm'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

export type SupplierContract = InferSelectModel<typeof supplierContracts>
export type PurchaseOrder    = InferSelectModel<typeof purchaseOrders>
export type SupplierInvoice  = InferSelectModel<typeof supplierInvoices>
export type NewSupplierContract = InferInsertModel<typeof supplierContracts>
export type NewPurchaseOrder    = InferInsertModel<typeof purchaseOrders>
export type NewSupplierInvoice  = InferInsertModel<typeof supplierInvoices>

export async function listSupplierContracts(
  tenantId: number, filters?: { partnerId?: number }
): Promise<SupplierContract[]> {
  const conditions = [eq(supplierContracts.tenantId, tenantId)]
  if (filters?.partnerId) conditions.push(eq(supplierContracts.partnerId, filters.partnerId))
  return db.select().from(supplierContracts).where(and(...conditions)).orderBy(desc(supplierContracts.id))
}

export async function getSupplierContract(tenantId: number, id: number): Promise<SupplierContract | null> {
  const [row] = await db.select().from(supplierContracts)
    .where(and(eq(supplierContracts.tenantId, tenantId), eq(supplierContracts.id, id)))
  return row ?? null
}

export async function createSupplierContract(data: NewSupplierContract): Promise<number> {
  const [row] = await db.insert(supplierContracts).values(data).returning({ id: supplierContracts.id })
  return row.id
}

export async function listPurchaseOrders(
  tenantId: number, filters?: { partnerId?: number; supplierContractId?: number }
): Promise<PurchaseOrder[]> {
  const conditions = [eq(purchaseOrders.tenantId, tenantId)]
  if (filters?.partnerId)          conditions.push(eq(purchaseOrders.partnerId, filters.partnerId))
  if (filters?.supplierContractId) conditions.push(eq(purchaseOrders.supplierContractId, filters.supplierContractId))
  return db.select().from(purchaseOrders).where(and(...conditions)).orderBy(desc(purchaseOrders.id))
}

export async function createPurchaseOrder(data: NewPurchaseOrder): Promise<number> {
  const [row] = await db.insert(purchaseOrders).values(data).returning({ id: purchaseOrders.id })
  return row.id
}

export async function listSupplierInvoices(
  tenantId: number, filters?: { partnerId?: number; purchaseOrderId?: number }
): Promise<SupplierInvoice[]> {
  const conditions = [eq(supplierInvoices.tenantId, tenantId)]
  if (filters?.partnerId)      conditions.push(eq(supplierInvoices.partnerId, filters.partnerId))
  if (filters?.purchaseOrderId) conditions.push(eq(supplierInvoices.purchaseOrderId, filters.purchaseOrderId))
  return db.select().from(supplierInvoices).where(and(...conditions)).orderBy(desc(supplierInvoices.id))
}

export async function createSupplierInvoice(data: NewSupplierInvoice): Promise<number> {
  const [row] = await db.insert(supplierInvoices).values(data).returning({ id: supplierInvoices.id })
  return row.id
}
