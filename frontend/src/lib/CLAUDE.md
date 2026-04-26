# lib/ — Couche d'abstraction · 2026-04-22

## saltcorn.ts — Client API Saltcorn

**Ce fichier est le seul point d'entrée vers Saltcorn. Ne jamais appeler l'API Saltcorn ailleurs.**

### serverFetch — pourquoi http Node.js natif ?

`serverFetch()` utilise le module `http` natif Node.js (pas `fetch()`) pour pouvoir
**overrider l'en-tête `Host`** dans les appels server-side. La fonction `fetch()` de Node.js/undici
ignore les overrides de `Host` et envoie `saltcorn:3000` comme Host — ce qui route toujours vers
le tenant principal. `serverFetch` avec `http` permet de cibler n'importe quel tenant via son Host.

### Deux contextes d'URL

```
Server-side (Next.js dans Docker) → http://saltcorn:3000  (SALTCORN_INTERNAL_URL)
Client-side (navigateur)          → https://api.moondust.cloud (NEXT_PUBLIC_SALTCORN_URL)
```

### Deux clients disponibles

| Fonction | Auth | Usage |
|----------|------|-------|
| `adminClient(tenant?)` | SALTCORN_API_TOKEN | Tenant principal uniquement (renverra 401 sur tenant secondaire) |
| `authClient(token, tenant?)` | connect.sid user | Tout tenant — utilise serverFetch + Host override |

```typescript
import { authClient, adminClient } from '@/lib/saltcorn'

// Pour un tenant secondaire :
const sc = authClient(getToken()!, 'habhab')
const users = await sc.list('users')

// Pour le tenant principal :
const sc = adminClient()
const partners = await sc.list('partners')
```

### Détection token → méthode auth

Le client détecte automatiquement le type de token :
- Contient `.` → connect.sid → `Cookie: connect.sid=...`
- Sans `.` (64 chars hex) → API key → `Authorization: Bearer ...`

### Quirks Saltcorn

- `GET /api/:table/:id` **n'existe pas** → `GET /api/:table?id=X`
- Updates : `POST /api/:table/:id` (pas PUT/PATCH)
- Réponse peut être `{ success: [...] }` ou `{ data: [...] }` — le client gère les deux
- Un 200 peut contenir `{ success: false, error: "..." }` → `SaltcornError` levée

## admin-session.ts — Session admin cross-tenant

Cache module-level du `connect.sid` admin (TTL 6 jours).

```typescript
import { getTenantUserByEmail } from '@/lib/admin-session'

// Récupère l'utilisateur dans un tenant via la session admin cross-tenant
const user = await getTenantUserByEmail('habhab', 'user@example.com')
// → { id: 1, email: 'user@example.com', role_id: 1 }
```

Utilisé dans `/api/auth/login` pour poser les cookies `sc_user_id` et `sc_user_role` sur les tenants secondaires.
La session admin de `api.moondust.cloud` fonctionne cross-tenant grâce à l'en-tête `Host` correct via `serverFetch`.

`invalidateAdminSid()` : vide le cache en cas de 401 (la prochaine utilisation re-login automatiquement).

## auth.ts — Cookies de session

| Fonction | Cookie | httpOnly | Contenu |
|----------|--------|----------|---------|
| `getToken()` | `sc_session` | oui | connect.sid Saltcorn |
| `getUserId()` | `sc_user_id` | non | ID utilisateur (number) |
| `getUserRole()` | `sc_user_role` | non | role_id (1=admin, 40=staff, 80=user) |

Les 3 cookies sont posés simultanément au login.

## tenant.ts — Résolution du tenant courant

```typescript
import { getTenantSlug } from '@/lib/tenant'
const tenant = getTenantSlug(req) // → "habhab" ou null si tenant principal
```

Extrait le sous-domaine depuis l'en-tête `Host` de la requête Next.js.
Retourne `null` pour `portal.moondust.cloud` (tenant principal).

## piste.ts — Client PISTE/Légifrance

Client OAuth2 `client_credentials` avec cache token in-process (expire - 30s).

```typescript
import { getPisteToken, LEGIFRANCE_BASE } from '@/lib/piste'
const token = await getPisteToken()
```

Env : `PISTE_CLIENT_ID`, `PISTE_CLIENT_SECRET`, `PISTE_ENV` (`sandbox`|`production`).
**État (2026-04-22) :** Token OK, mais moteur DILA retourne 500/503 (panne externe, hors contrôle).

## i18n.ts

Toujours ajouter EN + FR ensemble. `TKey = keyof typeof en` — TypeScript garantit la parité FR/EN.
Côté server : `getT(getLocale())` — côté client : `useTranslation()`.
