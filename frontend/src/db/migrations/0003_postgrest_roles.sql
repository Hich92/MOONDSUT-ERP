-- Migration : PostgREST — rôles PostgreSQL + grants + pre-request
-- Idempotent

-- ── 1. Rôles ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE ROLE postgrest_anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE ROLE postgrest_auth NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Rôle de connexion PostgREST (switch ensuite vers postgrest_auth)
DO $$ BEGIN
  CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'postgrest_pwd_change_me';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT postgrest_anon TO authenticator;
GRANT postgrest_auth TO authenticator;

-- ── 2. Grants tables métier → postgrest_auth ──────────────────────
GRANT USAGE ON SCHEMA public TO postgrest_auth, postgrest_anon;

-- Toutes les tables actuelles
GRANT SELECT, INSERT, UPDATE, DELETE ON
  partners, opportunities, activities,
  contracts, invoices,
  projects, tasks,
  supplier_contracts, purchase_orders, supplier_invoices,
  erp_tenants, erp_groups, erp_group_permissions, erp_user_groups
TO postgrest_auth;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgrest_auth;

-- Lecture seule pour anon (aucune table pour l'instant)
GRANT USAGE ON SCHEMA public TO postgrest_anon;

-- ── 3. Fonction pre-request ───────────────────────────────────────
-- Appelée par PostgREST avant chaque requête — injecte app.tenant_id
-- depuis les claims JWT pour activer le RLS tenant.
CREATE OR REPLACE FUNCTION set_tenant_context() RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  claims json;
  t_id   int;
BEGIN
  claims := current_setting('request.jwt.claims', true)::json;
  t_id   := (claims->>'tenant_id')::int;
  IF t_id IS NOT NULL THEN
    PERFORM set_config('app.tenant_id', t_id::text, true);
  END IF;
END;
$$;

-- Permettre à postgrest_auth d'exécuter la fonction
GRANT EXECUTE ON FUNCTION set_tenant_context() TO postgrest_auth;
