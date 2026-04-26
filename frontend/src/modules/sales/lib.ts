import { db } from '@/db'
import { contracts, invoices } from '@/db/schema/sales'
import { eq, and, desc } from 'drizzle-orm'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

export type Contract = InferSelectModel<typeof contracts>
export type Invoice  = InferSelectModel<typeof invoices>
export type NewContract = InferInsertModel<typeof contracts>
export type NewInvoice  = InferInsertModel<typeof invoices>

export async function listContracts(
  tenantId: number,
  filters?: { partnerId?: number; status?: string }
): Promise<Contract[]> {
  const conditions = [eq(contracts.tenantId, tenantId)]
  if (filters?.partnerId) conditions.push(eq(contracts.partnerId, filters.partnerId))
  if (filters?.status)    conditions.push(eq(contracts.status, filters.status))
  return db.select().from(contracts).where(and(...conditions)).orderBy(desc(contracts.id))
}

export async function getContract(tenantId: number, id: number): Promise<Contract | null> {
  const [row] = await db.select().from(contracts)
    .where(and(eq(contracts.tenantId, tenantId), eq(contracts.id, id)))
  return row ?? null
}

export async function createContract(data: NewContract): Promise<number> {
  const [row] = await db.insert(contracts).values(data).returning({ id: contracts.id })
  return row.id
}

export async function updateContract(
  tenantId: number, id: number, data: Partial<NewContract>
): Promise<void> {
  await db.update(contracts).set(data)
    .where(and(eq(contracts.tenantId, tenantId), eq(contracts.id, id)))
}

export async function listInvoices(
  tenantId: number,
  filters?: { contractId?: number; isPaid?: boolean }
): Promise<Invoice[]> {
  const conditions = [eq(invoices.tenantId, tenantId)]
  if (filters?.contractId !== undefined) conditions.push(eq(invoices.contractId, filters.contractId))
  if (filters?.isPaid !== undefined)     conditions.push(eq(invoices.isPaid, filters.isPaid))
  return db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.id))
}

export async function getInvoice(tenantId: number, id: number): Promise<Invoice | null> {
  const [row] = await db.select().from(invoices)
    .where(and(eq(invoices.tenantId, tenantId), eq(invoices.id, id)))
  return row ?? null
}

export async function createInvoice(data: NewInvoice): Promise<number> {
  const [row] = await db.insert(invoices).values(data).returning({ id: invoices.id })
  return row.id
}
