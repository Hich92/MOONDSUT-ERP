import { db } from '@/db'
import { partners, opportunities, activities } from '@/db/schema/crm'
import { eq, and, asc, desc, ilike, or } from 'drizzle-orm'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

export type Partner     = InferSelectModel<typeof partners>
export type Opportunity = InferSelectModel<typeof opportunities>
export type Activity    = InferSelectModel<typeof activities>

export type NewPartner     = InferInsertModel<typeof partners>
export type NewOpportunity = InferInsertModel<typeof opportunities>
export type NewActivity    = InferInsertModel<typeof activities>

// ── Partners ──────────────────────────────────────────────────────

export async function listPartners(
  tenantId: number,
  filters?: { type?: string; isCompany?: boolean; q?: string }
): Promise<Partner[]> {
  const conditions = [eq(partners.tenantId, tenantId)]

  if (filters?.type)                conditions.push(eq(partners.type, filters.type))
  if (filters?.isCompany !== undefined) conditions.push(eq(partners.isCompany, filters.isCompany))
  if (filters?.q) {
    const term = `%${filters.q}%`
    conditions.push(or(ilike(partners.name, term), ilike(partners.email, term))!)
  }

  return db.select().from(partners)
    .where(and(...conditions))
    .orderBy(asc(partners.name))
}

export async function getPartner(tenantId: number, id: number): Promise<Partner | null> {
  const [row] = await db.select().from(partners)
    .where(and(eq(partners.tenantId, tenantId), eq(partners.id, id)))
  return row ?? null
}

export async function createPartner(data: NewPartner): Promise<number> {
  const [row] = await db.insert(partners).values(data).returning({ id: partners.id })
  return row.id
}

export async function updatePartner(
  tenantId: number, id: number, data: Partial<NewPartner>
): Promise<void> {
  await db.update(partners)
    .set(data)
    .where(and(eq(partners.tenantId, tenantId), eq(partners.id, id)))
}

export async function deletePartner(tenantId: number, id: number): Promise<void> {
  await db.delete(partners)
    .where(and(eq(partners.tenantId, tenantId), eq(partners.id, id)))
}

// ── Opportunities ─────────────────────────────────────────────────

export async function listOpportunities(
  tenantId: number,
  filters?: { stage?: string; partnerId?: number }
): Promise<Opportunity[]> {
  const conditions = [eq(opportunities.tenantId, tenantId)]

  if (filters?.stage)     conditions.push(eq(opportunities.stage, filters.stage))
  if (filters?.partnerId) conditions.push(eq(opportunities.partnerId, filters.partnerId))

  return db.select().from(opportunities)
    .where(and(...conditions))
    .orderBy(desc(opportunities.id))
}

export async function getOpportunity(tenantId: number, id: number): Promise<Opportunity | null> {
  const [row] = await db.select().from(opportunities)
    .where(and(eq(opportunities.tenantId, tenantId), eq(opportunities.id, id)))
  return row ?? null
}

export async function createOpportunity(data: NewOpportunity): Promise<number> {
  const [row] = await db.insert(opportunities).values(data).returning({ id: opportunities.id })
  return row.id
}

export async function updateOpportunity(
  tenantId: number, id: number, data: Partial<NewOpportunity>
): Promise<void> {
  await db.update(opportunities)
    .set(data)
    .where(and(eq(opportunities.tenantId, tenantId), eq(opportunities.id, id)))
}

// ── Activities ────────────────────────────────────────────────────

export async function listActivities(
  tenantId: number,
  filters?: { relatedTable?: string; relatedId?: number }
): Promise<Activity[]> {
  const conditions = [eq(activities.tenantId, tenantId)]

  if (filters?.relatedTable) conditions.push(eq(activities.relatedTable, filters.relatedTable))
  if (filters?.relatedId)    conditions.push(eq(activities.relatedId, filters.relatedId))

  return db.select().from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.createdAt))
}

export async function createActivity(data: NewActivity): Promise<number> {
  const [row] = await db.insert(activities).values(data).returning({ id: activities.id })
  return row.id
}
