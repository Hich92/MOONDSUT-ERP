#!/usr/bin/env bash
# reset-dev.sh — Vide toutes les données entre deux versions (dev uniquement).
# Usage  : ./scripts/reset-dev.sh
# Effet  : TRUNCATE CASCADE de toutes les tables métier + core.
#          Les schémas, migrations et volumes Docker sont conservés.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "⚠️  MoonDust ERP — reset dev"
echo "    Toutes les données tenant, users et données métier seront supprimées."
read -rp "    Continuer ? [y/N] " confirm
[[ "${confirm,,}" == "y" ]] || { echo "Annulé."; exit 0; }

docker compose exec -T db psql -U erp erp <<'SQL'
-- Données métier (CASCADE gère les contraintes FK automatiquement)
TRUNCATE TABLE
  tasks,
  activities,
  supplier_invoices,
  purchase_orders,
  invoices,
  projects,
  supplier_contracts,
  opportunities,
  contracts,
  partners,
  erp_attachments
CASCADE;

-- Données core tenant
TRUNCATE TABLE
  erp_user_groups,
  erp_group_permissions,
  erp_users,
  erp_tenants
CASCADE;

SELECT 'Reset terminé — base vide.' AS status;
SQL

echo "✓ Terminé. Relancez le stack normalement."
