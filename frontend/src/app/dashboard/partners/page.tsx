import Link          from 'next/link'
import { Users }     from 'lucide-react'
import { PageList }  from '@/components/modules/PageList'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'
import { cn }        from '@/lib/utils'
import { listPartners }           from '@/modules/crm/lib'
import { getTenantIdFromRequest } from '@/db/tenant'

// ── Filter tabs ───────────────────────────────────────────────────

const TYPE_TABS = [
  { key: '',            label: 'Tous'         },
  { key: 'prospect',    label: 'Prospects'    },
  { key: 'client',      label: 'Clients'      },
  { key: 'ex-client',   label: 'Ex-clients'   },
  { key: 'fournisseur', label: 'Fournisseurs' },
  { key: 'partenaire',  label: 'Partenaires'  },
  { key: 'contact',     label: 'Contacts'     },
]

const KIND_TABS = [
  { key: '',    label: 'Tous'        },
  { key: 'co',  label: 'Sociétés'   },
  { key: 'per', label: 'Particuliers'},
]

function FilterBar({ activeType, activeKind }: { activeType: string; activeKind: string }) {
  function href(type: string, kind: string) {
    const p = new URLSearchParams()
    if (type) p.set('type', type)
    if (kind) p.set('kind', kind)
    const qs = p.toString()
    return `/dashboard/partners${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 flex-wrap">
        {TYPE_TABS.map(({ key, label }) => (
          <Link
            key={key}
            href={href(key, activeKind)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
              activeType === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex gap-1.5">
        {KIND_TABS.map(({ key, label }) => (
          <Link
            key={key}
            href={href(activeType, key)}
            className={cn(
              'px-3 py-1 rounded-full text-xs border transition-colors',
              activeKind === key
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────

export default async function PartnersPage({
  searchParams,
}: { searchParams: { type?: string; kind?: string } }) {
  const t          = getT(getLocale())
  const activeType = searchParams.type ?? ''
  const activeKind = searchParams.kind ?? ''

  let data: Record<string, unknown>[] = []
  let error: string | null = null

  try {
    const tenantId = await getTenantIdFromRequest()
    if (tenantId) {
      const rows = await listPartners(tenantId, {
        type:      activeType || undefined,
        isCompany: activeKind === 'co' ? true : activeKind === 'per' ? false : undefined,
      })
      data = rows as unknown as Record<string, unknown>[]
    }
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : String(e)
  }

  const newHref = activeKind === 'co'
    ? '/dashboard/partners/new?is_company=true'
    : activeKind === 'per'
    ? '/dashboard/partners/new?is_company=false'
    : '/dashboard/partners/new'

  return (
    <PageList
      title={t('partners.title')}
      subtitle={t('partners.subtitle')}
      icon={Users}
      newHref={newHref}
      newLabel={t('partners.new')}
      detailBasePath="/dashboard/partners"
      apiTable="partners"
      data={data} error={error}
      topSlot={<FilterBar activeType={activeType} activeKind={activeKind} />}
      columns={[
        { key: 'name',       label: t('partners.col.name')                           },
        { key: 'type',       label: t('partners.col.type'), renderAs: 'partnerType'  },
        { key: 'city',       label: t('partners.col.city')                           },
        { key: 'email',      label: t('partners.col.email')                          },
        { key: 'phone',      label: t('partners.col.phone')                          },
      ]}
    />
  )
}
