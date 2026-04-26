# API Routes Next.js — Inventaire · 2026-04-22

Les API routes sont des proxies vers Saltcorn ou des handlers propres à Next.js (upload, auth).
Pas de logique métier ici — si Saltcorn refuse, on renvoie l'erreur telle quelle.

## Clients Saltcorn à utiliser

```typescript
// Tenant secondaire ou opération au nom de l'utilisateur
import { authClient } from '@/lib/saltcorn'
const sc = authClient(getToken()!, getTenantSlug(req))

// Tenant principal uniquement (SALTCORN_API_TOKEN)
import { adminClient } from '@/lib/saltcorn'
const sc = adminClient()
```

`adminClient` avec `SALTCORN_API_TOKEN` retourne 401 sur un tenant secondaire — toujours utiliser `authClient` dans ce cas.

## Auth

| Route | Méthode | Description |
|-------|---------|-------------|
| `auth/login` | POST | Login → pose `sc_session`, `sc_user_id`, `sc_user_role` |
| `auth/logout` | DELETE | Supprime les cookies de session |
| `auth/signup` | POST | Inscription sur le tenant principal |
| `auth/profile` | POST | Mise à jour nom + mot de passe |

**Login tenant secondaire** : appelle `getTenantUserByEmail()` (admin cross-tenant via `admin-session.ts`)
pour récupérer `id` et `role_id` — infos non renvoyées par Saltcorn dans la réponse login.

## Records (Proxy CRUD Saltcorn)

| Route | Méthodes | Description |
|-------|----------|-------------|
| `records/[table]` | GET, POST | Liste/création — `resolveClient()` choisit le bon client |
| `records/[table]/[id]` | PATCH, DELETE | Mise à jour/suppression |

`resolveClient()` : `authClient(token, tenant)` pour les tenants secondaires (respecte les droits Saltcorn),
`adminClient` pour le tenant principal.

## Administration tenant

Toutes ces routes requièrent `sc_user_role = 1` (admin), sinon 403.
Utilisent `authClient(token, tenant)` + Host override via `http` Node.js natif.

| Route | Méthodes | Description |
|-------|----------|-------------|
| `tenant-admin/me` | GET | Retourne `{ id, role_id }` depuis les cookies |
| `tenant-admin/users` | GET | Liste les users du tenant courant |
| `tenant-admin/users/[id]` | PATCH | Change le rôle d'un user (`role_id` dans `[1,40,80]`) |
| `tenant-admin/users/[id]` | DELETE | Supprime un user |

## Tenants (multi-tenancy)

| Route | Méthode | Description |
|-------|---------|-------------|
| `tenants/check` | GET | Vérifie disponibilité d'un slug (`?slug=monslug`) |
| `tenants/create` | POST | Crée tenant + user admin dans ce tenant |

`tenants/check` : valide regex `[a-z0-9]{3,32}`, liste RESERVED, unicité `_sc_tenants`.
`tenants/create` : sanitize slug (Saltcorn `domain_sanitize` → supprime tout sauf `[a-z0-9_]`),
crée le tenant via CSRF Saltcorn, inscrit l'user, le promeut admin (role_id=1).

## Données métier

| Route | Description |
|-------|-------------|
| `activities` / `activities/[id]` | CRUD activités polymorphes (related_table + related_id) |
| `attachments` / `attachments/[id]` | CRUD pièces jointes (stockage `/app/uploads/`, métadonnées Saltcorn) |
| `attachments/[id]/file` | Téléchargement de fichier |
| `history/[table]/[id]` | Historique des modifications |
| `my-tasks` | Tâches assignées à l'utilisateur courant |
| `users` | Lookup utilisateurs (assign, mention) |
| `wiki` / `wiki/[id]` | Pages wiki |

**Attachments** : fichiers dans `/app/uploads/` (volume `erp_uploads_data`). Ne jamais supprimer
le volume sans purger les entrées `attachments` dans Saltcorn.

## APIs externes (proxies)

| Route | Source | Notes |
|-------|--------|-------|
| `search/[table]` | Saltcorn | Autocomplete FK, 3 chars min, debounce 320ms |
| `sirene` | api.entreprises.data.gouv.fr | Public, sans auth, CORS *, cache 60s |
| `legifrance/search` | api.piste.gouv.fr (PISTE OAuth2) | État (2026-04-22) : 500/503 côté DILA |
| `legifrance/codes` | idem | Cache 1h |
| `xkcd` | xkcd.com | Cache 1h sauf `?random=1` |
