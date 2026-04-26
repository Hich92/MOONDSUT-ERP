-- Migration : erp_users — table propre avec migration des users Saltcorn
-- Idempotent

CREATE TABLE IF NOT EXISTS erp_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT,
  password_hash TEXT NOT NULL,
  role_id       INTEGER NOT NULL DEFAULT 80,
  tenant_id     INTEGER REFERENCES erp_tenants(id) ON DELETE CASCADE,
  disabled      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Migration des users Saltcorn existants ────────────────────────
-- Les mots de passe Saltcorn sont bcrypt — réutilisables directement.
-- Superadmin (role_id=1) → tenant_id NULL (accès global)
-- Staff (role_id=80)     → tenant_id = 2 (habhab, tenant principal)

INSERT INTO erp_users (email, password_hash, role_id, tenant_id, disabled, created_at)
SELECT
  lower(email),
  COALESCE(password, '$2b$10$invalid_hash_placeholder_change_me_xxxxxxxxxxxxxxxxxx'),
  role_id,
  CASE WHEN role_id = 1 THEN NULL ELSE 2 END,
  disabled,
  NOW()
FROM users
WHERE password IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE erp_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON erp_users;
CREATE POLICY tenant_isolation ON erp_users
  USING (
    tenant_id IS NULL  -- superadmins visibles partout
    OR tenant_id = COALESCE(current_tenant_id(), tenant_id)
  );

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON erp_users TO postgrest_auth;
GRANT USAGE, SELECT ON SEQUENCE erp_users_id_seq TO postgrest_auth;
