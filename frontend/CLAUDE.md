# Frontend Next.js — Conventions · 2026-04-22

## Stack

Next.js 14 App Router · TypeScript strict · Tailwind CSS · shadcn/ui · Lucide icons

## Structure

```
src/
  app/
    dashboard/        # Routes protégées (require auth)
      admin/          # Page administration tenant (role=1 uniquement)
    api/
      auth/           # login, logout, profile
      records/        # Proxy CRUD Saltcorn (GET/POST/PATCH/DELETE)
      tenant-admin/   # Gestion users du tenant courant (me, users, users/[id])
      tenants/        # Création et vérification de disponibilité des tenants
      search/         # Autocomplete FK (LinkedRecordSearch)
      activities/     # Activités polymorphes
      sirene/         # Proxy SIRENE (INSEE)
      legifrance/     # Proxy Légifrance (PISTE OAuth2)
      xkcd/           # Widget XKCD
    signup/           # Inscription + création d'espace de travail optionnelle
  components/
    layout/           # AppSidebar, DashboardShell (Sidebar.tsx supprimé — remplacé par AppSidebar)
    modules/          # PageList, PageDetail, FormPage, PartnerForm, StatusBar...
    ui/               # Composants shadcn/ui (ne pas modifier)
  lib/
    saltcorn.ts       # SaltcornClient + authClient + adminClient + serverFetch
    auth.ts           # Cookies sc_session, sc_user_id, sc_user_role
    admin-session.ts  # Session admin cross-tenant (cache 6 jours)
    tenant.ts         # getTenantSlug() depuis Host header
    i18n.ts           # Traductions EN/FR
  hooks/
    use-translation.ts
```

## Clients Saltcorn — lequel utiliser ?

```typescript
// Tenant principal (portal.moondust.cloud) — utilise SALTCORN_API_TOKEN
adminClient(tenant?: string | null)

// Tout tenant (secondaire ou principal) — utilise la session du user courant
// OBLIGATOIRE pour les tenants secondaires (override Host via http Node.js natif)
authClient(token: string, tenant?: string | null)
```

**Règle** : pour les opérations liées à un tenant secondaire, toujours utiliser `authClient`.
`adminClient` avec `SALTCORN_API_TOKEN` renverra 401 sur un tenant secondaire.

Pattern `resolveClient()` utilisé dans les routes records et tenant-admin :

```typescript
function resolveCtx(req: NextRequest) {
  const tenant = getTenantSlug(req)
  const role   = getUserRole()
  const token  = getToken()
  if (!tenant || role !== 1 || !token) return null
  return authClient(token, tenant)
}
```

## Cookies de session

| Cookie | httpOnly | Contenu |
|--------|----------|---------|
| `sc_session` | oui | `connect.sid` Saltcorn |
| `sc_user_id` | non | ID utilisateur (pour client-side) |
| `sc_user_role` | non | role_id Saltcorn (1/40/80/100) |

Les 3 cookies sont posés au login. `sc_user_role` permet la gestion des accès côté client sans aller-retour serveur.

## Page d'administration tenant

`/dashboard/admin` — visible dans la sidebar uniquement si :
- Le domaine est un tenant secondaire (`hostname !== "portal.moondust.cloud"`)
- L'utilisateur a `sc_user_role = 1` (admin)

Utilise les routes `/api/tenant-admin/*` qui s'appuient sur `authClient` avec Host override.

## Règles Server vs Client Component

- Les pages `dashboard/*` sont Server Components → peuvent appeler `saltcorn` directement
- Ajouter `'use client'` uniquement si le composant utilise `useState`, `useEffect`, ou hooks React
- `FormPage` et `PageDetail` sont Client Components (gestion de l'état formulaire)
- Ne jamais appeler Saltcorn directement depuis un Client Component → passer par `/api/*`

## Protection des routes

`src/middleware.ts` redirige vers `/login` si `sc_session` absent.
Routes publiques : `/`, `/login`, `/signup`, `/api/auth/*`.

## Internationalisation

- Toujours ajouter EN + FR dans `src/lib/i18n.ts`
- Côté server : `getT(getLocale())` — côté client : `useTranslation()`
- Langue stockée dans cookie `lang` (`'fr'` | `'en'`)

## Ajouter un module complet

1. `src/app/dashboard/[module]/page.tsx` — liste (Server Component)
2. `src/app/dashboard/[module]/[id]/page.tsx` — détail (utilise `PageDetail`)
3. `src/app/dashboard/[module]/new/page.tsx` — formulaire (utilise `FormPage`)
4. Ajouter dans `AppSidebar.tsx` → `NAV_MODULES`
5. Ajouter les clés i18n dans `src/lib/i18n.ts` (EN + FR)
6. Ajouter le label breadcrumb dans `MODULE_KEYS` (PageDetail + FormPage)

## Rebuild obligatoire

```bash
cd /opt/erp
docker compose build nextjs && docker compose up -d nextjs
```
