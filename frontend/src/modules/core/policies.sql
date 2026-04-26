-- RLS — Core module
-- À exécuter une fois sur la DB (idempotent via IF NOT EXISTS)

-- erp_tenants (pas d'isolation par tenant — table racine)
ALTER TABLE erp_tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS superadmin_only ON erp_tenants
  USING (current_setting('app.is_superadmin', true)::boolean IS TRUE);

-- erp_groups
ALTER TABLE erp_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation ON erp_groups
  USING (tenant_id = current_setting('app.tenant_id', true)::int);
CREATE POLICY IF NOT EXISTS tenant_insert ON erp_groups FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);

-- erp_group_permissions (isolation via group → tenant)
ALTER TABLE erp_group_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation ON erp_group_permissions
  USING (
    group_id IN (
      SELECT id FROM erp_groups
      WHERE tenant_id = current_setting('app.tenant_id', true)::int
    )
  );

-- erp_user_groups
ALTER TABLE erp_user_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS tenant_isolation ON erp_user_groups
  USING (tenant_id = current_setting('app.tenant_id', true)::int);
CREATE POLICY IF NOT EXISTS tenant_insert ON erp_user_groups FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);
