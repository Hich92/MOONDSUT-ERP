# CLAUDE.md — ERP MoonDust · v0.1.2 · 2026-04-26

> Contexte persistant du projet. Lu en premier à chaque session.

---

## 1 — Infrastructure

| Composant | Détail |
|-----------|--------|
| Stack | Docker Compose — `/opt/erp/` |
| DB | PostgreSQL 16 (`erp-db-1`) user: erp / db: erp |
| ORM | Drizzle ORM — schéma dans `frontend/src/db/schema/`, migrations dans `frontend/src/db/migrations/` |
| Gateway UI | Next.js 14 App Router (`erp-nextjs-1`) — TypeScript strict |
| Services | Express 4 — `erp-svc-{crm,sales,projects,procurement}-1` |
| Admin DB | pgAdmin (`erp-pgadmin-1`) |
| Reverse proxy | Caddy (`erp-caddy-1`) |
| Automatisation | Activepieces CE v0.82 (`erp-activepieces-1`) |
| Queue | Redis 7 (`erp-redis-1`) |
| Tests unitaires | Vitest — `npm test` dans `frontend/` et `services/<name>/` |
| Tests E2E | Playwright (`erp-playwright-1`) — Chromium headless, HTTP API :3001 |
| Monitoring | Sentry — configurer `SENTRY_DSN` dans `.env` |
| CI | GitHub Actions — `.github/workflows/ci.yml` |
| **Saltcorn** | **SUPPRIMÉ en v0.1.2** — aucune référence dans le code actif |

**Accès :**
| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | https://portal.moondust.cloud | hadi@hadi.com / hadi@hadi.com |
| pgAdmin | https://pgadmin.moondust.cloud | hadi@hadi.com / MoonDust2025! |
| Activepieces | https://automate.moondust.cloud | haloweenlife@gmail.com / Moondust2025! |

**Commandes essentielles :**
```bash
cd /opt/erp
docker compose build nextjs && docker compose up -d nextjs        # rebuild gateway
docker compose build svc-crm && docker compose up -d svc-crm     # rebuild un service
docker compose exec db psql -U erp erp                            # accès DB
docker compose logs svc-crm -f                                    # logs service
npm --prefix frontend test                                         # Vitest frontend (33 tests)
npm --prefix services/crm test                                     # Vitest service CRM
npm --prefix frontend run db:generate                              # générer migration Drizzle
```

---

## 2 — Architecture

```
Internet
  ├─ portal.moondust.cloud ──► Caddy ──► nextjs:3000       (Gateway UI)
  └─ automate.moondust.cloud ─────────► activepieces:80

Services métier (réseau Docker backend) :
  svc-crm:3101         partners, opportunities, activities
  svc-sales:3102       contracts, invoices
  svc-projects:3103    projects, tasks
  svc-procurement:3104 supplier_contracts, purchase_orders, supplier_invoices

nextjs:3000 ──► PostgREST:3001    (tables legacy, lecture/écriture via JWT RLS)
nextjs:3000 ──► activepieces:80   (callFlow : Groq, SIRENE ; emitEvent : events métier)
nextjs:3000 ──► playwright:3001   (tests UI headless)
activepieces ──► APIs externes    (Groq, SIRENE, futurs)
```

**Principes :**
- **Next.js** = Gateway : UI + auth + proxy. Ne contient pas de logique métier.
- **Services Express** = Logique métier : chaque module est autonome et versionnable.
- **Activepieces** = Bus d'intégration : toutes les APIs externes + events async inter-modules.
- Les services **ne s'appellent jamais directement** — sync via gateway REST, async via AP events.

**Contrats de communication :** `contracts/` à la racine — source de vérité pour les APIs et events.

---

## 3 — Services (v0.1.2)

| Service | Port | Image | Health |
|---------|------|-------|--------|
| `svc-crm` | 3101 | `erp-svc-crm:0.1.2` | `GET /health` |
| `svc-sales` | 3102 | `erp-svc-sales:0.1.2` | `GET /health` |
| `svc-projects` | 3103 | `erp-svc-projects:0.1.2` | `GET /health` |
| `svc-procurement` | 3104 | `erp-svc-procurement:0.1.2` | `GET /health` |

**Auth services :** JWT HS256 — `Authorization: Bearer <token>` — secret = `NEXTAUTH_SECRET`.
**Tenant isolation :** slug JWT → `erp_tenants.id` (cache mémoire par process).
**Réponse standard :** `{ success: true, data: T }` ou `{ error: string }`.

---

## 4 — Schéma DB

### Tables natives Drizzle (`erp_*`)

| Table | Rôle |
|-------|------|
| `erp_tenants` | Tenants SaaS |
| `erp_users` | Utilisateurs + hash bcrypt |
| `erp_groups` | Groupes de permissions |
| `erp_group_permissions` | Permissions par groupe/ressource |
| `erp_user_groups` | Appartenance utilisateur ↔ groupe |
| `erp_attachments` | Pièces jointes (stockage filesystem `/app/uploads`) |

### Tables métier (legacy Saltcorn, accédées via PostgREST)

| Table | Module |
|-------|--------|
| `partners` | CRM |
| `opportunities` | CRM |
| `activities` | CRM |
| `contracts` | Sales |
| `invoices` | Sales |
| `projects` | Projects |
| `tasks` | Projects |
| `supplier_contracts` | Procurement |
| `purchase_orders` | Procurement |
| `supplier_invoices` | Procurement |
| `WikiPages` | Wiki |
| `sirene_ref` | 29,4M sièges SIRENE — index pg_trgm |

### Relations

```
partners ──► opportunities ──► contracts ──► invoices
                                    │
                               projects ──► tasks
partners ──► supplier_contracts ──► purchase_orders ──► supplier_invoices
activities (polymorphe : related_table + related_id)
erp_attachments (polymorphe : related_table + related_id)
```

---

## 5 — Frontend Next.js (Gateway)

### Routes dashboard

| Module | List | Detail | New |
|--------|------|--------|-----|
| Partenaires | `/dashboard/partners` | `/dashboard/partners/[id]` | `/dashboard/partners/new` |
| Opportunités | `/dashboard/opportunities` | `/dashboard/opportunities/[id]` | `/dashboard/opportunities/new` |
| Contrats | `/dashboard/contracts` | `/dashboard/contracts/[id]` | `/dashboard/contracts/new` |
| Projets | `/dashboard/projects` | `/dashboard/projects/[id]` | `/dashboard/projects/new` |
| Tâches | `/dashboard/tasks` | `/dashboard/tasks/[id]` | `/dashboard/tasks/new` |
| Factures | `/dashboard/invoices` | `/dashboard/invoices/[id]` | `/dashboard/invoices/new` |
| Contrats fourn. | `/dashboard/supplier-contracts` | `…/[id]` | `…/new` |
| Bons de commande | `/dashboard/purchase-orders` | `…/[id]` | `…/new` |
| Factures fourn. | `/dashboard/supplier-invoices` | `…/[id]` | `…/new` |

### APIs internes Next.js

| Route | Usage |
|-------|-------|
| `POST /api/auth/login` | Login → cookie JWT |
| `DELETE /api/auth/logout` | Logout |
| `GET/POST/PATCH/DELETE /api/records/[table]` | Proxy CRUD → PostgREST |
| `GET /api/activities` | Liste activités filtrées |
| `GET/POST /api/attachments` | Pièces jointes → `erp_attachments` (Drizzle) |
| `GET /api/sirene?q=...` | SIRENE — DB locale → AP flow → api.gouv.fr |
| `POST /api/chat` | Chat IA — AP flow → Groq |
| `POST /api/smoke-test` | Smoke test complet (token requis) |
| `POST /api/tenants/create` | Créer tenant + user admin (Drizzle) |

### Events Activepieces câblés (POST + PATCH `/api/records/[table]`)

| Event | Déclencheur |
|-------|-------------|
| `OPPORTUNITY_CREATED` | POST opportunities |
| `OPPORTUNITY_WON` | PATCH opportunities `stage=won` |
| `CONTRACT_SIGNED` | PATCH contracts `signed_at` set |
| `PROJECT_CREATED` | POST projects |
| `TASK_COMPLETED` | PATCH tasks `status=done` |
| `PURCHASE_ORDER_SENT` | POST/PATCH purchase_orders `status=sent` |

---

## 6 — Activepieces

### Flows configurés

| Flow | ID | Webhook env var |
|------|----|-----------------|
| MoonDust Chatbot | `kcNjgzV26nngFumzWwz0T` | `AP_CHAT_FLOW_WEBHOOK` (sync) |
| SIRENE Search | `fgztTd2DpIT0PfRTfzvrc` | `AP_SIRENE_FLOW_WEBHOOK` (sync) |
| Smoke Test | `DvPJ1Z3dwD6CNzVOqOzBI` | fire & forget |

**Pattern sync :** `callFlow<T>('CHAT', payload)` — URL avec `/sync`, `return_response` doit avoir `respond: "stop"`.
**Pattern async :** `emitEvent('OPPORTUNITY_WON', record)` — fire & forget, webhook URL dans `AP_WEBHOOK_*`.

---

## 7 — Tests

| Package | Tests | Commande |
|---------|-------|---------|
| `frontend/` | 33 | `npm --prefix frontend test` |
| `services/crm/` | 5 | `npm --prefix services/crm test` |
| `services/sales/` | 4 | `npm --prefix services/sales test` |
| `services/projects/` | 6 | `npm --prefix services/projects test` |
| `services/procurement/` | 6 | `npm --prefix services/procurement test` |
| **Total** | **54** | — |

Playwright E2E : 40 tests — `POST /api/playwright-run` ou smoke test page `/dashboard/smoke-test`.

---

## 8 — Règles & Gotchas

1. **Rebuild service** → `docker compose build svc-<name> && docker compose up -d svc-<name>`
2. **Rebuild gateway** → `docker compose build nextjs && docker compose up -d nextjs`
3. **Migration Drizzle** → `npm --prefix frontend run db:generate` puis appliquer le SQL
4. **Services auth** → Bearer JWT uniquement (pas de cookie), secret = `NEXTAUTH_SECRET`
5. **Tenant cache** → en mémoire par process service — flush au restart
6. **AP sync** → utiliser `/sync` suffix + `respond: "stop"` dans `return_response`
7. **Contrats** → tout changement d'API commence par `contracts/<module>.contract.ts`
8. **Saltcorn** → NE PAS réintroduire — supprimé en v0.1.2, voir ROADMAP pour plan de migration complet

---

## 9 — Git & Versions

- **Repo :** https://github.com/Hich92/MOONDSUT-ERP
- **Branche principale :** `main`
- **Tags courants :** `v0.1.2`, `crm@v0.1.2`, `sales@v0.1.2`, `projects@v0.1.2`, `procurement@v0.1.2`
- **Convention commits :** `feat:`, `fix:`, `refactor:` + `Co-Authored-By: Claude Sonnet 4.6`
- **Tag par module :** `<module>@v<version>` à chaque milestone

---

**© 2025-2026 Haloweenlife co. — Licence Source Available — voir LICENSE**
