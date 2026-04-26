-- Migration : Sales + Projects + Procurement — tenant_id + RLS
-- Idempotent

-- ══════════════════════════════════════════════════════════════════
-- SALES
-- ══════════════════════════════════════════════════════════════════

-- contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE contracts SET tenant_id = 2 WHERE tenant_id IS NULL;
ALTER TABLE contracts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_tenant_id_fk;
ALTER TABLE contracts ADD CONSTRAINT contracts_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;

-- Supprimer FKs legacy (companies / contacts)
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_company_id_fkey;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_contact_id_fkey;

-- invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE invoices SET tenant_id = 2 WHERE tenant_id IS NULL;
ALTER TABLE invoices ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_tenant_id_fk;
ALTER TABLE invoices ADD CONSTRAINT invoices_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;

-- ══════════════════════════════════════════════════════════════════
-- PROJECTS
-- ══════════════════════════════════════════════════════════════════

-- projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE projects SET tenant_id = 2 WHERE tenant_id IS NULL;
ALTER TABLE projects ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_tenant_id_fk;
ALTER TABLE projects ADD CONSTRAINT projects_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;

-- tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
-- Dériver tenant_id depuis le projet parent
UPDATE tasks t
SET tenant_id = p.tenant_id
FROM projects p
WHERE p.id = t.project_id AND t.tenant_id IS NULL;
-- Fallback pour tâches orphelines
UPDATE tasks SET tenant_id = 2 WHERE tenant_id IS NULL;
ALTER TABLE tasks ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_tenant_id_fk;
ALTER TABLE tasks ADD CONSTRAINT tasks_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;

-- Supprimer FK Saltcorn users
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- ══════════════════════════════════════════════════════════════════
-- PROCUREMENT
-- ══════════════════════════════════════════════════════════════════

-- supplier_contracts
ALTER TABLE supplier_contracts ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE supplier_contracts SET tenant_id = 2 WHERE tenant_id IS NULL;
ALTER TABLE supplier_contracts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE supplier_contracts DROP CONSTRAINT IF EXISTS supplier_contracts_tenant_id_fk;
ALTER TABLE supplier_contracts ADD CONSTRAINT supplier_contracts_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;
ALTER TABLE supplier_contracts DROP CONSTRAINT IF EXISTS supplier_contracts_supplier_id_fkey;

-- purchase_orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE purchase_orders SET tenant_id = 2 WHERE tenant_id IS NULL;
ALTER TABLE purchase_orders ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_tenant_id_fk;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_supplier_id_fkey;

-- supplier_invoices
ALTER TABLE supplier_invoices ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
UPDATE supplier_invoices SET tenant_id = 2 WHERE tenant_id IS NULL;
ALTER TABLE supplier_invoices ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE supplier_invoices DROP CONSTRAINT IF EXISTS supplier_invoices_tenant_id_fk;
ALTER TABLE supplier_invoices ADD CONSTRAINT supplier_invoices_tenant_id_fk
  FOREIGN KEY (tenant_id) REFERENCES erp_tenants(id) ON DELETE CASCADE;
ALTER TABLE supplier_invoices DROP CONSTRAINT IF EXISTS supplier_invoices_supplier_id_fkey;

-- ══════════════════════════════════════════════════════════════════
-- RLS — toutes les tables
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE contracts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_invoices  ENABLE ROW LEVEL SECURITY;

-- Politique générique : COALESCE → bypass si app.tenant_id non défini (admin)
DO $$ DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'contracts','invoices','projects','tasks',
    'supplier_contracts','purchase_orders','supplier_invoices'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (tenant_id = COALESCE(current_tenant_id(), tenant_id))',
      t
    );
    EXECUTE format('DROP POLICY IF EXISTS tenant_insert ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_insert ON %I FOR INSERT
         WITH CHECK (tenant_id = COALESCE(current_tenant_id(), tenant_id))',
      t
    );
  END LOOP;
END $$;
