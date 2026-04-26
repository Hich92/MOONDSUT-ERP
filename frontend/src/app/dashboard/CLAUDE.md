# dashboard/ — Pages métier

## Pattern d'une page de liste

```tsx
// Server Component — appel direct à saltcorn (token admin)
import { saltcorn } from '@/lib/saltcorn'

export default async function ProjectsPage() {
  const items = await saltcorn.list('projects').catch(() => [])
  // Rendre avec PageList ou DataTable
}
```

Toujours utiliser `.catch(() => [])` sur les appels Saltcorn dans les pages de liste.
Si Saltcorn est down, la page doit s'afficher vide plutôt que crasher.

## Pattern d'une page de détail

```tsx
// Server Component
import { notFound } from 'next/navigation'
import { saltcorn } from '@/lib/saltcorn'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  let record: Record<string, unknown>
  try { record = await saltcorn.get('projects', id) }
  catch { notFound() }  // Retourne 404 si l'enregistrement n'existe pas

  // Récupérer les données liées en parallèle
  const [contract, tasks] = await Promise.all([
    record.contract_id ? saltcorn.get('contracts', Number(record.contract_id)).catch(() => null) : null,
    saltcorn.list('tasks', { project_id: String(id) }).catch(() => []),
  ])
  // ...
}
```

## Pages statiques (sans Saltcorn)

Les pages sans données dynamiques (ex: `informations/`, `profile/preferences/`) :
- Sont des Server Components ou Client Components selon besoin
- N'importent pas `saltcorn` du tout
- Ne passent pas de props `record` à `PageDetail`

## Protection

Toutes les routes sous `dashboard/` sont protégées par :
1. Le middleware (`src/middleware.ts`) qui redirige si `sc_session` absent
2. Le layout `dashboard/layout.tsx` qui re-vérifie via `getToken()` et redirige

Ne pas ajouter de vérification d'auth supplémentaire dans les pages individuelles.

## Modules existants

| Route | Table Saltcorn | Particularités |
|-------|---------------|----------------|
| `companies/` | `companies` | — |
| `contacts/` | `contacts` | FK vers `companies` |
| `opportunities/` | `opportunities` | FK vers `companies`, pipeline CRM |
| `contracts/` | `contracts` | FK vers `opportunities` + `contacts` |
| `projects/` | `projects` | FK vers `contracts`, liste les `tasks` |
| `tasks/` | `tasks` | FK vers `projects`, assignation utilisateur |
| `invoices/` | `invoices` | FK vers `contracts` |
| `wiki/` | `WikiPages` | Contenu écrit dans Saltcorn admin, lecture seule ici |
| `my-tasks/` | `tasks` | Vue personnelle filtrée par `assigned_to` |
| `legal/referentiel/` | — | Client Component, proxy vers PISTE/Légifrance via `/api/legifrance/*` |
| `informations/` | — | Page statique, aucun appel Saltcorn |
| `profile/preferences/` | — | Page statique, préférences locales (localStorage) |

## Homepage dashboard (`dashboard/page.tsx`)

Server Component. Fait 7 appels Saltcorn en parallèle (`Promise.allSettled`) + 1 fetch XKCD.
Layout : Quick Actions (buttons colorés) → Navigation modules (cards) → Sidebar stats + XKCD.

**Règle de distinction card cliquable vs informative :**
- Cards navigables = `<Link>` avec fond `bg-card`, hover visible, flèche `→`
- Bloc stats = fond `bg-muted/30`, pas de `<Link>`, pas de hover
- Boutons Quick Actions = fond coloré plein (`bg-indigo-600`…), explicitement "Créer"
- Jamais de `<Link>` imbriqué dans un autre `<Link>` (HTML invalide + erreur Next.js)
