-- Migration Core Bootstrap
-- Transition : tenant TEXT (Saltcorn subdomain) → tenant_id INTEGER (FK erp_tenants)
-- Idempotent via IF NOT EXISTS / DO $$ blocks

-- ── 1. Types ENUM ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE tenant_plan AS ENUM('trial','starter','pro','enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tenant_status AS ENUM('active','suspended','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE access_level AS ENUM('none','read','edit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Table erp_tenants ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp_tenants (
  id         SERIAL PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  plan       tenant_plan   NOT NULL DEFAULT 'trial',
  status     tenant_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 3. Peupler erp_tenants depuis les slugs existants ────────────
INSERT INTO erp_tenants (slug, name)
SELECT DISTINCT tenant, initcap(tenant)
FROM erp_groups
WHERE tenant != ''
ON CONFLICT (slug) DO NOTHING;

-- ── 4. Ajouter tenant_id sur erp_groups ──────────────────────────
ALTER TABLE erp_groups ADD COLUMN IF NOT EXISTS tenant_id INTEGER;

UPDATE erp_groups g
SET tenant_id = t.id
FROM erp_tenants t
WHERE t.slug = g.tenant AND g.tenant_id IS NULL;

-- Rendre NOT NULL une fois rempli
ALTER TABLE erp_groups ALTER COLUMN tenant_id SET NOT NULL;

-- Remplacer la contrainte unique (tenant, name) → (tenant_id, name)
ALTER TABLE erp_groups DROP CONSTRAINT IF EXISTS erp_groups_tenant_name_key;
ALTER TABLE erp_groups ADD CONSTRAINT erp_groups_tenant_id_name_key
  UNIQUE (tenant_id, name);

-- Ajouter FK
ALTER TABLE erp_groups DROP CONSTRAINT IF EXISTS erp_groups_tenant_id_fk;
ALTER TABLE erp_groups ADD CONSTRAINT erp_groups_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;

-- Supprimer l'ancienne colonne texte
ALTER TABLE erp_groups DROP COLUMN IF EXISTS tenant;

-- ── 5. Ajouter tenant_id sur erp_user_groups ─────────────────────
ALTER TABLE erp_user_groups ADD COLUMN IF NOT EXISTS tenant_id INTEGER;

UPDATE erp_user_groups ug
SET tenant_id = g.tenant_id
FROM erp_groups g
WHERE g.id = ug.group_id AND ug.tenant_id IS NULL;

ALTER TABLE erp_user_groups ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE erp_user_groups DROP CONSTRAINT IF EXISTS erp_user_groups_tenant_id_fk;
ALTER TABLE erp_user_groups ADD CONSTRAINT erp_user_groups_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;

-- Supprimer l'ancienne colonne texte si elle existe encore
ALTER TABLE erp_user_groups DROP COLUMN IF EXISTS tenant;

-- ── 6. Colonne access_level sur erp_group_permissions ────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'erp_group_permissions'
      AND column_name = 'access_level'
      AND data_type = 'USER-DEFINED'
  ) THEN
    -- Convertir TEXT → ENUM
    ALTER TABLE erp_group_permissions
      ALTER COLUMN access_level TYPE access_level
      USING access_level::access_level;
  END IF;
END $$;

-- ── 7. RLS ────────────────────────────────────────────────────────
ALTER TABLE erp_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_group_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_user_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON erp_groups;
CREATE POLICY tenant_isolation ON erp_groups
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::int, tenant_id));

DROP POLICY IF EXISTS tenant_isolation ON erp_user_groups;
CREATE POLICY tenant_isolation ON erp_user_groups
  USING (tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::int, tenant_id));

DROP POLICY IF EXISTS tenant_isolation ON erp_group_permissions;
CREATE POLICY tenant_isolation ON erp_group_permissions
  USING (
    group_id IN (
      SELECT id FROM erp_groups
      WHERE tenant_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), '')::int, tenant_id)
    )
  );
