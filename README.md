# MoonDust ERP

> ERP/CRM SaaS pour PME françaises — architecture microservices, multi-tenant, self-hostable.

[![CI](https://github.com/Hich92/MOONDSUT-ERP/actions/workflows/ci.yml/badge.svg)](https://github.com/Hich92/MOONDSUT-ERP/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-0.1.2-blue)](https://github.com/Hich92/MOONDSUT-ERP/releases/tag/v0.1.2)
[![License](https://img.shields.io/badge/license-Source%20Available-orange)](./LICENSE)

---

## Vue d'ensemble

MoonDust ERP est une plateforme de gestion d'entreprise modulaire construite autour de services indépendants qui communiquent via API REST et événements Activepieces.

**Stack :** Next.js 14 · Express · PostgreSQL 16 · Drizzle ORM · Activepieces · Docker Compose · Caddy

---

## Architecture

```
Internet
  └─ portal.moondust.cloud ──► Caddy ──► nextjs:3000   (Gateway UI)
  └─ automate.moondust.cloud ─────────► activepieces:80

Services métier (réseau Docker interne) :
  svc-crm:3101         partners, opportunities, activities
  svc-sales:3102       contracts, invoices
  svc-projects:3103    projects, tasks
  svc-procurement:3104 supplier_contracts, purchase_orders, supplier_invoices

Infrastructure :
  db:5432              PostgreSQL 16
  redis:6379           Queue Activepieces
  postgrest:3001       API REST — accès tables legacy (transitoire → retiré en v0.1.3)
  pgadmin              Admin DB (pgadmin.moondust.cloud)
```

**Communication inter-modules :**
- **Sync** — REST via le gateway Next.js (jamais de direct container→container)
- **Async** — Events Activepieces (`emitEvent()`) — OPPORTUNITY_WON, CONTRACT_SIGNED, etc.

---

## Modules

| Module | Service | Version | Ressources |
|--------|---------|---------|------------|
| **CRM** | `svc-crm` | 0.1.2 | Partenaires · Opportunités · Activités |
| **Sales** | `svc-sales` | 0.1.2 | Contrats · Factures clients |
| **Projects** | `svc-projects` | 0.1.2 | Projets · Tâches |
| **Procurement** | `svc-procurement` | 0.1.2 | Contrats fourn. · BC · Factures fourn. |
| **Core** | `nextjs` (gateway) | — | Auth · Tenants · Utilisateurs · Groupes |

---

## Démarrage rapide

### Prérequis
- Docker + Docker Compose v2
- Node.js 20+ (pour les outils de développement)

### Installation

```bash
git clone https://github.com/Hich92/MOONDSUT-ERP.git
cd MOONDSUT-ERP
cp .env.example .env   # configurer les variables
docker compose up -d
```

### Vérifier les services

```bash
# Health checks
curl http://localhost:3101/health   # CRM
curl http://localhost:3102/health   # Sales
curl http://localhost:3103/health   # Projects
curl http://localhost:3104/health   # Procurement
```

### Tests

```bash
# Tous les tests unitaires
npm --prefix frontend test              # 33 tests
npm --prefix services/crm test          # 5 tests
npm --prefix services/sales test        # 4 tests
npm --prefix services/projects test     # 6 tests
npm --prefix services/procurement test  # 6 tests

# Smoke test API complet
curl -X POST https://portal.moondust.cloud/api/smoke-test \
  -H "Content-Type: application/json" \
  -d '{"token":"<SMOKE_TEST_TOKEN>"}'
```

### Rebuild un module

```bash
# Exemple : rebuild le service CRM
docker compose build svc-crm && docker compose up -d svc-crm

# Gateway Next.js
docker compose build nextjs && docker compose up -d nextjs
```

---

## Structure du projet

```
MOONDSUT-ERP/
├── contracts/               Contrats de communication inter-modules (TypeScript)
│   ├── _schema.ts           Types partagés (TenantId, ApiResult, EventEnvelope…)
│   ├── crm.contract.ts
│   ├── sales.contract.ts
│   ├── projects.contract.ts
│   └── procurement.contract.ts
│
├── frontend/                Gateway UI — Next.js 14 App Router
│   └── src/
│       ├── app/             Routes Next.js (API + pages dashboard)
│       ├── modules/         Logique métier Drizzle par module
│       ├── db/schema/       Schémas Drizzle ORM
│       └── lib/             activepieces.ts, session.ts, auth.ts…
│
├── services/                Services Express autonomes
│   ├── crm/                 Port 3101
│   ├── sales/               Port 3102
│   ├── projects/            Port 3103
│   └── procurement/         Port 3104
│
├── playwright/              Tests E2E Playwright (40 tests, Chromium headless)
├── docker-compose.yml
├── Caddyfile
└── ROADMAP.md
```

---

## Variables d'environnement clés

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | Secret JWT partagé entre gateway et services |
| `POSTGRES_*` | Connexion PostgreSQL |
| `AP_CHAT_FLOW_WEBHOOK` | Webhook Activepieces chatbot IA |
| `AP_SIRENE_FLOW_WEBHOOK` | Webhook Activepieces recherche SIRENE |
| `GROQ_API_KEY` | Clé API Groq (LLM chatbot) |
| `SMOKE_TEST_TOKEN` | Token pour déclencher les smoke tests |
| `CLOUDFLARE_API_TOKEN` | TLS wildcard DNS-01 via Caddy |

---

## Licence

Source Available — voir [LICENSE](./LICENSE).  
Consultation et usage interne autorisés. Commercialisation et redistribution interdites.  
© 2025-2026 [Haloweenlife co.](mailto:haloweenlife@gmail.com)
