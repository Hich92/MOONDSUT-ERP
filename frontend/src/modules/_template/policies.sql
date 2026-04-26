-- Template RLS — remplacer `module_records` par le nom de la table
-- Appliquer après chaque migration Drizzle

ALTER TABLE module_records ENABLE ROW LEVEL SECURITY;

-- Isolation stricte par tenant
CREATE POLICY tenant_isolation ON module_records
  USING (tenant_id = current_setting('app.tenant_id', true)::int);

-- Permettre INSERT avec le bon tenant_id
CREATE POLICY tenant_insert ON module_records
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);
