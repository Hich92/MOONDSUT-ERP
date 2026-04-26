import { FolderKanban } from 'lucide-react'
import { PageList }     from '@/components/modules/PageList'
import { getLocale }    from '@/lib/get-locale'
import { getT }         from '@/lib/i18n'
import { listProjects }           from '@/modules/projects/lib'
import { getTenantIdFromRequest } from '@/db/tenant'

export default async function ProjectsPage() {
  const t = getT(getLocale())
  let data: Record<string, unknown>[] = []
  let error: string | null = null

  try {
    const tenantId = await getTenantIdFromRequest()
    if (tenantId) data = (await listProjects(tenantId)) as unknown as Record<string, unknown>[]
  } catch (e: unknown) { error = e instanceof Error ? e.message : String(e) }

  return (
    <PageList
      title={t('projects.title')}
      subtitle={t('projects.subtitle')}
      icon={FolderKanban}
      newHref="/dashboard/projects/new"
      newLabel={t('projects.new')}
      detailBasePath="/dashboard/projects"
      apiTable="projects"
      data={data} error={error}
      columns={[
        { key: 'name',     label: t('projects.col.name')                                },
        { key: 'status',   label: t('projects.col.status'),   renderAs: 'projectStatus' },
        { key: 'progress', label: t('projects.col.progress'), renderAs: 'percent'       },
      ]}
    />
  )
}
