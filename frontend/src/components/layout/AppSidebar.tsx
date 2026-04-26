'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronRight,
  Zap,
  LayoutDashboard,
  Target,
  FolderKanban,
  CheckSquare,
  FileText,
  Receipt,
  UserCircle,
  SlidersHorizontal,
  Info,
  LogOut,
  Building2,
  Users,
  BookOpen,
  Truck,
  ScrollText,
  ShoppingCart,
  FileInput,
  Shield,
  FlaskConical,
} from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useTranslation } from '@/hooks/use-translation'
import type { TKey } from '@/hooks/use-translation'

// ── Navigation tree structure ────────────────────────────────────

type NavChild = {
  labelKey: TKey
  icon:     React.ElementType
  href:     string
  resource?: string   // permission resource key (undefined = always visible)
}

type NavItem = {
  labelKey:    TKey
  icon:        React.ElementType
  href?:       string
  collapsible: boolean
  children?:   NavChild[]
  resource?:   string
}

const NAV_MODULES: NavItem[] = [
  {
    labelKey:    'nav.dashboard',
    icon:        LayoutDashboard,
    href:        '/dashboard',
    collapsible: false,
  },
  {
    labelKey:    'nav.partners',
    icon:        Users,
    href:        '/dashboard/partners',
    collapsible: false,
    resource:    'partners',
  },
  {
    labelKey:    'nav.crm',
    icon:        Building2,
    collapsible: true,
    children: [
      { labelKey: 'nav.opportunities', icon: Target, href: '/dashboard/opportunities', resource: 'opportunities' },
    ],
  },
  {
    labelKey:    'nav.operations',
    icon:        FolderKanban,
    collapsible: true,
    children: [
      { labelKey: 'nav.projects', icon: FolderKanban, href: '/dashboard/projects', resource: 'projects' },
      { labelKey: 'nav.tasks',    icon: CheckSquare,  href: '/dashboard/tasks',    resource: 'tasks'    },
    ],
  },
  {
    labelKey:    'nav.finance',
    icon:        FileText,
    collapsible: true,
    children: [
      { labelKey: 'nav.contracts', icon: FileText, href: '/dashboard/contracts', resource: 'contracts' },
      { labelKey: 'nav.invoices',  icon: Receipt,  href: '/dashboard/invoices',  resource: 'invoices'  },
    ],
  },
]

const NAV_PROCUREMENT: NavItem[] = [
  {
    labelKey:    'nav.procurement',
    icon:        Truck,
    collapsible: true,
    children: [
      { labelKey: 'nav.supplier_contracts', icon: ScrollText,   href: '/dashboard/supplier-contracts', resource: 'supplier_contracts' },
      { labelKey: 'nav.purchase_orders',    icon: ShoppingCart, href: '/dashboard/purchase-orders',    resource: 'purchase_orders'    },
      { labelKey: 'nav.supplier_invoices',  icon: FileInput,    href: '/dashboard/supplier-invoices',  resource: 'supplier_invoices'  },
    ],
  },
]

const NAV_KNOWLEDGE: NavItem[] = [
  {
    labelKey:    'nav.wiki',
    icon:        BookOpen,
    href:        '/dashboard/wiki',
    collapsible: false,
    resource:    'wiki',
  },
  {
    labelKey:    'nav.smoke_test',
    icon:        FlaskConical,
    href:        '/dashboard/smoke-test',
    collapsible: false,
  },
  {
    labelKey:    'nav.about',
    icon:        Info,
    href:        '/dashboard/informations',
    collapsible: false,
  },
]

const NAV_SETTINGS: NavItem[] = [
  {
    labelKey:    'nav.profile',
    icon:        UserCircle,
    collapsible: true,
    children: [
      { labelKey: 'nav.preferences', icon: SlidersHorizontal, href: '/dashboard/profile/preferences' },
    ],
  },
]

// ── NavItemComp ───────────────────────────────────────────────────

function NavItemComp({
  item, pathname, t, permMap,
}: {
  item:     NavItem
  pathname: string
  t:        (key: TKey) => string
  permMap:  PermMap | null
}) {
  const label         = t(item.labelKey)
  const isChildActive = item.collapsible && item.children?.some(c => pathname.startsWith(c.href))

  if (!item.collapsible) {
    if (!isVisible(permMap, item.resource)) return null
    const isActive = pathname === item.href
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
          <Link href={item.href!}>
            <item.icon />
            <span>{label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const visibleChildren = item.children?.filter(c => isVisible(permMap, c.resource)) ?? []
  if (item.children && visibleChildren.length === 0) return null

  return (
    <Collapsible asChild defaultOpen={isChildActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={label}>
            <item.icon />
            <span>{label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {visibleChildren.map(child => {
              const childLabel = t(child.labelKey)
              const isActive   = pathname.startsWith(child.href)
              return (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton asChild isActive={isActive}>
                    <Link href={child.href}>
                      <child.icon />
                      <span>{childLabel}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

// ── AppSidebar ────────────────────────────────────────────────────

type PermMap = Record<string, { access_level: string; own_only: boolean }>

function isVisible(permMap: PermMap | null, resource?: string): boolean {
  if (!permMap || !resource) return true  // null = loading, show all; no resource = always visible
  return (permMap[resource]?.access_level ?? 'none') !== 'none'
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router   = useRouter()
  const t        = useTranslation()

  const [isAdmin,   setIsAdmin]   = React.useState(false)
  const [isTenant,  setIsTenant]  = React.useState(false)
  const [permMap,   setPermMap]   = React.useState<PermMap | null>(null)

  React.useEffect(() => {
    const host = window.location.hostname
    const isSecondary = host.endsWith('.moondust.cloud') &&
      host !== 'portal.moondust.cloud' && host !== 'api.moondust.cloud'
    setIsTenant(isSecondary)

    fetch('/api/tenant-admin/me')
      .then(r => r.json())
      .then((data: { role_id?: number }) => { setIsAdmin(data.role_id === 1) })
      .catch(() => {})

    fetch('/api/my-permissions')
      .then(r => r.json())
      .then((data: PermMap) => setPermMap(data))
      .catch(() => setPermMap({}))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon" {...props}>

      {/* ── Logo */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="MoonDust ERP">
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Zap className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sidebar-accent-foreground">MoonDust</span>
                  <span className="text-[10px] text-sidebar-foreground">{t('nav.erp_platform')}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Navigation */}
      <SidebarContent>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.modules')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_MODULES.map(item => (
                <NavItemComp key={item.labelKey} item={item} pathname={pathname} t={t} permMap={permMap} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.procurement')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_PROCUREMENT.map(item => (
                <NavItemComp key={item.labelKey} item={item} pathname={pathname} t={t} permMap={permMap} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Connaissance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_KNOWLEDGE.map(item => (
                <NavItemComp key={item.labelKey} item={item} pathname={pathname} t={t} permMap={permMap} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.settings')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_SETTINGS.map(item => (
                <NavItemComp key={item.labelKey} item={item} pathname={pathname} t={t} permMap={permMap} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ── Section Administration (tenants admins uniquement) */}
        {isTenant && isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Espace de travail</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/dashboard/admin'}
                    tooltip="Administration"
                  >
                    <Link href="/dashboard/admin">
                      <Shield />
                      <span>Administration</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/dashboard/admin/tenant-tests')}
                    tooltip="Tests Tenants"
                  >
                    <Link href="/dashboard/admin/tenant-tests">
                      <FlaskConical />
                      <span>Tests Tenants</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>

      {/* ── Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t('nav.logout')}
              onClick={handleLogout}
              className="text-sidebar-foreground hover:bg-red-500/15 hover:text-red-400"
            >
              <LogOut />
              <span>{t('nav.logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
