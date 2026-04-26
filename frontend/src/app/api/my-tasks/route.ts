import { NextRequest, NextResponse } from 'next/server'
import { getToken, getUserId }       from '@/lib/auth'
import { getTenantIdFromRequest }    from '@/db/tenant'
import { listTasks }                 from '@/modules/projects/lib'
import { listActivities }            from '@/modules/crm/lib'
import { getServerPostgRESTClient }  from '@/lib/postgrest'

export async function GET(req: NextRequest) {
  const token = getToken()
  if (!token) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const userId   = getUserId()
  if (!userId)   return NextResponse.json({ tasks: [], count: 0 })

  const tenantId = await getTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ tasks: [], count: 0 })

  const [projectTasks, activityTodos] = await Promise.all([
    listTasks(tenantId, { assignedTo: userId } as Parameters<typeof listTasks>[1]).catch(() => []),
    listActivities(tenantId, { type: 'Action' } as Parameters<typeof listActivities>[1]).catch(() => []),
  ])

  // Enrichir les tâches projet avec leur projet parent
  const client     = await getServerPostgRESTClient()
  const projectIds = [...new Set(projectTasks.map(t => t.projectId).filter(Boolean) as number[])]
  const projectMap: Record<number, Record<string, unknown>> = {}
  await Promise.all(
    projectIds.map(async id => {
      const p = await client.get('projects', id).catch(() => null)
      if (p) projectMap[id] = p
    })
  )

  // Enrichir les activités avec leur enregistrement lié
  const ALLOWED = new Set(['opportunities', 'contracts', 'projects', 'tasks', 'invoices', 'partners'])
  const relatedMap: Record<string, Record<string, unknown>> = {}
  await Promise.all(
    activityTodos
      .filter(a => a.relatedTable && a.relatedId && ALLOWED.has(a.relatedTable))
      .map(async a => {
        const key = `${a.relatedTable}:${a.relatedId}`
        if (relatedMap[key]) return
        const rec = await client.get(a.relatedTable!, a.relatedId!).catch(() => null)
        if (rec) relatedMap[key] = rec
      })
  )

  const unified: Record<string, unknown>[] = [
    ...projectTasks.map(t => ({
      ...t,
      _taskType: 'project',
      _project:  t.projectId ? projectMap[t.projectId] ?? null : null,
    })),
    ...activityTodos.map(a => ({
      ...a,
      _taskType: 'activity',
      _related:  a.relatedTable && a.relatedId
        ? relatedMap[`${a.relatedTable}:${a.relatedId}`] ?? null
        : null,
    })),
  ]

  const now = new Date().toISOString().slice(0, 10)
  unified.sort((a, b) => {
    const aDate = String(a.due_date ?? a.dueDate ?? '')
    const bDate = String(b.due_date ?? b.dueDate ?? '')
    const aDone = a.status === 'done'
    const bDone = b.status === 'done'
    if (aDone && !bDone) return 1
    if (!aDone && bDone) return -1
    const aOver = aDate && aDate < now
    const bOver = bDate && bDate < now
    if (aOver && !bOver) return -1
    if (!aOver && bOver) return 1
    if (aDate && bDate) return aDate.localeCompare(bDate)
    if (aDate) return -1
    if (bDate) return 1
    return 0
  })

  return NextResponse.json({ tasks: unified, count: unified.filter(t => t.status !== 'done').length })
}
