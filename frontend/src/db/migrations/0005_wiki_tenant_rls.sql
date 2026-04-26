-- Migration : WikiPages — tenant_id + RLS + PostgREST grants
-- Idempotent

ALTER TABLE "WikiPages" ADD COLUMN IF NOT EXISTS tenant_id INTEGER;

-- Assigner habhab (id=2) aux pages existantes
UPDATE "WikiPages" SET tenant_id = 2 WHERE tenant_id IS NULL;

ALTER TABLE "WikiPages" ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE "WikiPages" DROP CONSTRAINT IF EXISTS wikipages_tenant_id_fk;
ALTER TABLE "WikiPages" ADD CONSTRAINT wikipages_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;

ALTER TABLE "WikiPages" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON "WikiPages";
CREATE POLICY tenant_isolation ON "WikiPages"
  USING (tenant_id = COALESCE(current_tenant_id(), tenant_id));

DROP POLICY IF EXISTS tenant_insert ON "WikiPages";
CREATE POLICY tenant_insert ON "WikiPages" FOR INSERT
  WITH CHECK (tenant_id = COALESCE(current_tenant_id(), tenant_id));

-- Grants PostgREST
GRANT SELECT, INSERT, UPDATE, DELETE ON "WikiPages" TO postgrest_auth;
GRANT USAGE, SELECT ON SEQUENCE "WikiPages_id_seq" TO postgrest_auth;
