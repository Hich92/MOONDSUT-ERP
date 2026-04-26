import { db } from '@/db'
import { projects, tasks } from '@/db/schema/projects'
import { eq, and, desc } from 'drizzle-orm'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

export type Project = InferSelectModel<typeof projects>
export type Task    = InferSelectModel<typeof tasks>
export type NewProject = InferInsertModel<typeof projects>
export type NewTask    = InferInsertModel<typeof tasks>

export async function listProjects(
  tenantId: number,
  filters?: { contractId?: number; status?: string }
): Promise<Project[]> {
  const conditions = [eq(projects.tenantId, tenantId)]
  if (filters?.contractId) conditions.push(eq(projects.contractId, filters.contractId))
  if (filters?.status)     conditions.push(eq(projects.status, filters.status))
  return db.select().from(projects).where(and(...conditions)).orderBy(desc(projects.id))
}

export async function getProject(tenantId: number, id: number): Promise<Project | null> {
  const [row] = await db.select().from(projects)
    .where(and(eq(projects.tenantId, tenantId), eq(projects.id, id)))
  return row ?? null
}

export async function createProject(data: NewProject): Promise<number> {
  const [row] = await db.insert(projects).values(data).returning({ id: projects.id })
  return row.id
}

export async function updateProject(
  tenantId: number, id: number, data: Partial<NewProject>
): Promise<void> {
  await db.update(projects).set(data)
    .where(and(eq(projects.tenantId, tenantId), eq(projects.id, id)))
}

export async function listTasks(
  tenantId: number,
  filters?: { projectId?: number; status?: string }
): Promise<Task[]> {
  const conditions = [eq(tasks.tenantId, tenantId)]
  if (filters?.projectId) conditions.push(eq(tasks.projectId, filters.projectId))
  if (filters?.status)    conditions.push(eq(tasks.status, filters.status))
  return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.id))
}

export async function getTask(tenantId: number, id: number): Promise<Task | null> {
  const [row] = await db.select().from(tasks)
    .where(and(eq(tasks.tenantId, tenantId), eq(tasks.id, id)))
  return row ?? null
}

export async function createTask(data: NewTask): Promise<number> {
  const [row] = await db.insert(tasks).values(data).returning({ id: tasks.id })
  return row.id
}

export async function updateTask(
  tenantId: number, id: number, data: Partial<NewTask>
): Promise<void> {
  await db.update(tasks).set(data)
    .where(and(eq(tasks.tenantId, tenantId), eq(tasks.id, id)))
}
