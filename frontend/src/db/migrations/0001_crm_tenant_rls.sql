-- Migration CRM : ajout tenant_id + nettoyage FKs legacy + RLS
-- Idempotent

-- ── 1. Enums ──────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE partner_type AS ENUM(
    'contact','prospect','client','ex-client','fournisseur','partenaire'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE opportunity_stage AS ENUM(
    'lead','qualification','proposition','negotiation','won','lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. partners — ajout tenant_id ────────────────────────────────
ALTER TABLE partners ADD COLUMN IF NOT EXISTS tenant_id INTEGER;

-- Assigner habhab (id=2) à tous les records existants
UPDATE partners SET tenant_id = 2 WHERE tenant_id IS NULL;

ALTER TABLE partners ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE partners DROP CONSTRAINT IF EXISTS partners_tenant_id_fk;
ALTER TABLE partners ADD CONSTRAINT partners_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;

-- ── 3. opportunities — ajout tenant_id + nettoyage FKs ───────────
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS tenant_id INTEGER;

UPDATE opportunities SET tenant_id = 2 WHERE tenant_id IS NULL;

ALTER TABLE opportunities ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_tenant_id_fk;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;

-- Supprimer les FK legacy (companies/contacts sont des reliques Saltcorn)
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_company_id_fkey;
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_contact_id_fkey;
-- Conserver les colonnes pour la rétrocompatibilité (nullable, sans FK)

-- ── 4. activities — ajout tenant_id ──────────────────────────────
ALTER TABLE activities ADD COLUMN IF NOT EXISTS tenant_id INTEGER;

UPDATE activities SET tenant_id = 2 WHERE tenant_id IS NULL;

ALTER TABLE activities ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_tenant_id_fk;
ALTER TABLE activities ADD CONSTRAINT activities_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;

-- Supprimer les FK legacy users (Saltcorn gère ses propres users)
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_assigned_to_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_created_by_fkey;

-- ── 5. RLS ────────────────────────────────────────────────────────
ALTER TABLE partners      ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities    ENABLE ROW LEVEL SECURITY;

-- Politique commune : tenant_id doit correspondre au contexte de session
-- ou bypass si app.tenant_id non défini (connexion admin directe)
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS integer AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::integer;
$$ LANGUAGE sql STABLE;

DROP POLICY IF EXISTS tenant_isolation ON partners;
CREATE POLICY tenant_isolation ON partners
  USING (tenant_id = COALESCE(current_tenant_id(), tenant_id));

DROP POLICY IF EXISTS tenant_insert ON partners;
CREATE POLICY tenant_insert ON partners FOR INSERT
  WITH CHECK (tenant_id = COALESCE(current_tenant_id(), tenant_id));

DROP POLICY IF EXISTS tenant_isolation ON opportunities;
CREATE POLICY tenant_isolation ON opportunities
  USING (tenant_id = COALESCE(current_tenant_id(), tenant_id));

DROP POLICY IF EXISTS tenant_insert ON opportunities;
CREATE POLICY tenant_insert ON opportunities FOR INSERT
  WITH CHECK (tenant_id = COALESCE(current_tenant_id(), tenant_id));

DROP POLICY IF EXISTS tenant_isolation ON activities;
CREATE POLICY tenant_isolation ON activities
  USING (tenant_id = COALESCE(current_tenant_id(), tenant_id));

DROP POLICY IF EXISTS tenant_insert ON activities;
CREATE POLICY tenant_insert ON activities FOR INSERT
  WITH CHECK (tenant_id = COALESCE(current_tenant_id(), tenant_id));
