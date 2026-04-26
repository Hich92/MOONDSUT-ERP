# MoonDust ERP — Roadmap

> Vision technique : une plateforme ERP/CRM composée de services indépendants,
> communicant exclusivement par API REST ou événements Activepieces,
> sans aucune dépendance à Saltcorn.

---

## Vision finale

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet                               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (Caddy)
                  ┌────────▼────────┐
                  │  Gateway UI     │  Next.js — UI only, no business logic
                  │  nextjs:3000    │  Auth · Session · Routing
                  └────────┬────────┘
                           │ REST (Bearer JWT)
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼──────┐  ┌────────▼──────┐  ┌───────▼──────────┐
│  svc-crm     │  │  svc-sales    │  │  svc-projects    │
│  :3101       │  │  :3102        │  │  :3103           │
└──────────────┘  └───────────────┘  └──────────────────┘
┌──────────────────────────────────────────────────────────┐
│              svc-procurement  :3104                      │
└──────────────────────────────────────────────────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │ SQL (RLS par tenant)
                  ┌────────▼────────┐
                  │  PostgreSQL 16  │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Activepieces   │  Bus d'événements async
                  │  :80            │  Intégrations externes (Groq, SIRENE…)
                  └─────────────────┘
```

**Règles immuables :**
1. Les services ne s'appellent jamais directement entre eux.
2. Communication sync → REST via le gateway.
3. Communication async → Events Activepieces (`emitEvent()`).
4. Chaque service est déployable et versionnable indépendamment.
5. Zéro Saltcorn dans le code actif.

---

## État actuel

### ✅ v0.1.2 — Alpha, 2ème itération *(livré 2026-04-26)*

| Milestone | Livré |
|-----------|-------|
| M1 — Saltcorn supprimé | `erp_attachments` Drizzle, 0 référence SC |
| M2 — Contrats de communication | `contracts/` TypeScript typé, 6 events AP câblés |
| M3 — Services Docker autonomes | 4 services Express, health checks, 54 tests |
| M4 — CI par module + tags Git | GitHub Actions par module, tags `crm@v0.1.2`… |

---

## Roadmap

### v0.1.3 — Gateway proxy + module Core

**Objectif :** Le gateway Next.js délègue aux services métier au lieu d'appeler PostgREST directement.

- [ ] Proxy `/api/records/[table]` → service correspondant (header `Authorization: Bearer <jwt>`)
- [ ] Retirer PostgREST du docker-compose (plus nécessaire une fois les services en place)
- [ ] Créer `svc-core` (port 3100) : auth, tenants, users, groupes
- [ ] Migrer `/api/auth/*` et `/api/tenants/*` vers `svc-core`
- [ ] Tests : vérifier que tous les Playwright passent après bascule

---

### v0.1.4 — Observabilité + tracing

**Objectif :** Savoir exactement ce qui se passe dans le système en production.

- [ ] Structurer les logs JSON dans chaque service (`pino` ou `winston`)
- [ ] Ajouter `X-Request-ID` tracé de gateway → service → DB
- [ ] Intégrer Sentry dans chaque service (configurer `SENTRY_DSN`)
- [ ] Dashboard Activepieces : alertes sur flow failures
- [ ] Health check agrégé : `/api/health` gateway qui interroge tous les services

---

### v0.2.0 — Multi-tenant strict + RBAC par service

**Objectif :** Chaque service applique son propre RBAC, indépendamment du gateway.

- [ ] Encoder `tenant_id` + `role` dans le JWT (éviter la résolution par slug à chaque requête)
- [ ] RLS PostgreSQL activé sur toutes les tables métier
- [ ] Chaque service vérifie les permissions de façon autonome
- [ ] API de provisioning tenant : `svc-core` crée le tenant + schéma + rôles PG
- [ ] Isolation réseau Docker renforcée : services sur réseau `services` isolé du `frontend`

---

### v0.2.1 — Modules additionnels

**Objectif :** Couvrir les besoins RH et financiers de base.

- [ ] `svc-hr` (port 3105) : employés, contrats de travail, congés
- [ ] `svc-accounting` (port 3106) : plan comptable, écritures, balance
- [ ] Contrats de communication dans `contracts/hr.contract.ts` et `contracts/accounting.contract.ts`
- [ ] Events : `EMPLOYEE_HIRED`, `PAYSLIP_GENERATED`, `INVOICE_BOOKED`

---

### v0.3.0 — Package manager de modules

**Objectif :** Activer/désactiver des modules sans rebuilder le système.

- [ ] Table `erp_modules` : liste des modules actifs par tenant
- [ ] Gateway : routes proxiées uniquement si le module est actif pour le tenant
- [ ] Interface admin : toggle modules par tenant
- [ ] Chaque service annonce ses capacités via `GET /manifest` (version, routes, events)

---

### v1.0.0 — Production ready

**Objectif :** Stable, documenté, opérable sans l'auteur.

- [ ] `.env.example` complet avec documentation de chaque variable
- [ ] Script de migration de base (idempotent, `npm run migrate`)
- [ ] Runbook opérationnel (comment déployer, rollback, débugger)
- [ ] Backup automatique PostgreSQL vers S3/Cloudflare R2
- [ ] CI/CD deploy automatique sur push `main` (webhook → rebuild + `docker compose up -d`)
- [ ] Suppression du container Saltcorn du `docker-compose.yml`

---

## Suppression de Saltcorn — Chemin de migration

Saltcorn est conservé uniquement pour sa compatibilité descendante avec les données existantes.
Il sera supprimé progressivement :

| Version | Action |
|---------|--------|
| ✅ v0.1.2 | Code Next.js 100% free de Saltcorn (attachments migrés, admin-session supprimé) |
| v0.1.3 | PostgREST remplace Saltcorn comme couche d'accès aux tables métier legacy |
| v0.1.4 | Toutes les tables métier migrées vers schémas Drizzle natifs |
| v0.2.0 | `erp-saltcorn-1` retiré du `docker-compose.yml` |
| v1.0.0 | Dossier `saltcorn/` supprimé du repo |

---

## Principes de conception

- **Un service = une responsabilité** — jamais de logique cross-module dans un service.
- **Les contrats d'abord** — tout changement d'API commence par `contracts/`.
- **Tests avant merge** — chaque service a ses tests unitaires ; Playwright valide le golden path.
- **Event-driven par défaut** — si deux modules doivent réagir l'un à l'autre, c'est un event AP.
- **Drizzle = source de vérité** — le schéma TypeScript est le schéma DB.

---

*© 2025-2026 Haloweenlife co. — Tous droits réservés.*
