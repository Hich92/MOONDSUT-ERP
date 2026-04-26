# MoonDust ERP — Architecture globale · 2026-04-22

## Stack & services

| Service    | Image/Source        | URL interne      | URL publique                    | Rôle |
|------------|---------------------|-----------------|----------------------------------|------|
| `db`       | postgres:16-alpine  | `db:5432`       | —                                | Base de données |
| `saltcorn` | build local         | `saltcorn:3000` | `https://api.moondust.cloud`     | Backend métier + API REST |
| `nextjs`   | build local         | `nextjs:3000`   | `https://portal.moondust.cloud`  | Interface utilisateur |
| `payroll`  | build local         | `payroll:8001`  | —                                | Service ETL Python (indépendant) |
| `caddy`    | build local         | —               | reverse proxy TLS wildcard       | Reverse proxy + TLS auto |

## Règle d'or

**Saltcorn est la source de vérité.** Next.js affiche et envoie. Saltcorn valide et stocke.
Ne jamais réimplémenter une validation métier côté Next.js.
Si Saltcorn refuse → Next.js affiche l'erreur telle quelle.

## Multi-tenancy

- Chaque tenant = 1 schéma PostgreSQL distinct, routé via l'en-tête `Host`
- Registre centralisé : `public._sc_tenants` (colonne `subdomain`)
- `domain_sanitize` Saltcorn : supprime tout sauf `[a-z0-9_]` (les tirets sont supprimés)
  - Exemple : `acme-corp` → `acmecorp`
- Tenant principal : `portal.moondust.cloud` → schéma `public`
- Tenants secondaires : `{slug}.moondust.cloud` → schéma `{slug}`
- Wildcard DNS Cloudflare : `*.moondust.cloud` → Caddy → saltcorn:3000

### Tenant actuel en production

| Subdomain | Email admin    | Rôle |
|-----------|---------------|------|
| `habhab`  | hadi@hadi.fr  | admin (role_id=1) |

## Sessions cross-tenant (architecture clé)

Next.js utilise **deux types de clients** selon le contexte :

1. **`authClient(token, tenant)`** — session utilisateur + module `http` Node.js
   - Obligatoire pour les tenants secondaires (override de l'en-tête `Host`)
   - La fonction native `fetch()` de Node.js/undici ignore les overrides de `Host`
   - Utilisée pour : records CRUD, admin tenant users

2. **`adminClient(tenant)`** — token API admin (`SALTCORN_API_TOKEN`)
   - Valide **uniquement** pour le tenant principal (`api.moondust.cloud`)
   - Renverra 401 si utilisé contre un tenant secondaire

3. **Session admin cross-tenant** (`admin-session.ts`)
   - Module-level cache (TTL 6 jours) du `connect.sid` admin
   - Permet à Next.js de gérer les users dans n'importe quel tenant sans exposer Saltcorn
   - Utilisée lors du login tenant pour récupérer `id` + `role_id`

## Volumes Docker (données persistantes)

- `erp_postgres_data` — données PostgreSQL (schémas métier + Saltcorn)
- `erp_saltcorn_data` — config Saltcorn (`/home/node/.config/`)
- `erp_uploads_data`  — fichiers uploadés (`/app/uploads` dans Next.js)
- `erp_caddy_data`    — certificats TLS

Ces volumes **ne sont pas dans `/opt/erp`**. Un `git pull` ou `tar` du dossier projet ne les inclut pas.

## Commandes essentielles

```bash
cd /opt/erp

# Rebuild + redéployer Next.js
docker compose build nextjs && docker compose up -d nextjs

# Vider le cache route Saltcorn (obligatoire après ajout de table)
docker compose restart saltcorn

# Accès DB
docker compose exec db psql -U erp erp

# Logs
docker compose logs nextjs -f
docker compose logs saltcorn -f
```

## Variables d'environnement

Toutes dans `/opt/erp/.env`. Ne jamais committer ce fichier. Variables critiques :

| Variable | Usage |
|----------|-------|
| `SALTCORN_API_TOKEN` | Token admin pour Next.js server-side (tenant principal uniquement) |
| `SESSION_SECRET` / `NEXTAUTH_SECRET` | Secrets de session |
| `POSTGRES_*` | Credentials PostgreSQL |
| `PISTE_CLIENT_ID` / `PISTE_CLIENT_SECRET` | OAuth2 app PISTE/Légifrance |
| `PISTE_ENV` | `sandbox` ou `production` (actuellement `production`) |

## Réseau Docker

- Réseau `backend` : db ↔ saltcorn (PostgreSQL jamais exposé au frontend)
- Réseau `frontend` : saltcorn ↔ nextjs ↔ caddy
- Next.js → Saltcorn server-side : `http://saltcorn:3000`
- Next.js → Saltcorn client-side : `https://api.moondust.cloud`

## Saltcorn — Gotchas

1. **Nouvelle table** → `docker compose restart saltcorn` obligatoire (cache routes en mémoire)
2. **GET un enregistrement** → `GET /api/<table>?id=X` (pas `GET /api/<table>/:id`)
3. **Auth API** → `Authorization: Bearer <SALTCORN_API_TOKEN>` (token dans `.env`)
4. **Rôles** → 1=admin, 40=staff, 80=user, 100=public
