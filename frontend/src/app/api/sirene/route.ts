import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { callFlow } from '@/lib/activepieces'

const SIRENE_BASE = 'https://recherche-entreprises.api.gouv.fr'

// ── Recherche locale sirene_ref ──────────────────────────────────

interface SireneRow {
  siret:            string
  siren:            string
  nic:              string | null
  is_siege:         boolean
  etat:             string | null
  date_creation:    string | null
  denomination:     string | null
  enseigne:         string | null
  code_naf:         string | null
  numero_voie:      string | null
  type_voie:        string | null
  libelle_voie:     string | null
  code_postal:      string | null
  commune:          string | null
  code_commune:     string | null
  tranche_effectifs: string | null
}

function rowToResult(r: SireneRow) {
  const adresseParts = [
    r.numero_voie, r.type_voie, r.libelle_voie
  ].filter(Boolean).join(' ')

  return {
    siren:           r.siren,
    siret:           r.siret,
    nom_complet:     r.denomination || r.enseigne || r.siren,
    nom_raison_sociale: r.denomination || null,
    sigle:           r.enseigne || null,
    activite_principale: r.code_naf || null,
    tranche_effectif_salarie: r.tranche_effectifs || null,
    etat_administratif: r.etat === 'A' ? 'A' : 'F',
    siege: {
      siret:        r.siret,
      code_postal:  r.code_postal || null,
      commune:      r.commune || null,
      code_commune: r.code_commune || null,
      adresse:      adresseParts || null,
      numero_voie:  r.numero_voie || null,
      type_voie:    r.type_voie || null,
      libelle_voie: r.libelle_voie || null,
    },
  }
}

async function searchLocal(q: string, limit: number) {
  // SIREN exact (9 chiffres)
  if (/^\d{9}$/.test(q)) {
    const rows = await query<SireneRow>(
      `SELECT * FROM sirene_ref WHERE siren = $1 AND is_siege = true LIMIT $2`,
      [q, limit]
    )
    return rows.map(rowToResult)
  }

  // SIRET exact (14 chiffres)
  if (/^\d{14}$/.test(q)) {
    const rows = await query<SireneRow>(
      `SELECT * FROM sirene_ref WHERE siret = $1 LIMIT 1`,
      [q]
    )
    return rows.map(rowToResult)
  }

  // Recherche textuelle (trigramme si disponible, sinon ILIKE)
  const rows = await query<SireneRow>(
    `SELECT *
     FROM sirene_ref
     WHERE is_siege = true
       AND (
         denomination ILIKE $1
         OR enseigne   ILIKE $1
       )
     ORDER BY
       CASE WHEN denomination ILIKE $2 THEN 0 ELSE 1 END,
       denomination NULLS LAST
     LIMIT $3`,
    [`%${q}%`, `${q}%`, limit]
  )
  return rows.map(rowToResult)
}

async function localDbReady(): Promise<boolean> {
  try {
    const r = await query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM sirene_ref WHERE is_siege = true LIMIT 1`
    )
    return parseInt(r[0]?.c ?? '0') > 0
  } catch {
    return false
  }
}

// ── Handler ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const q       = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const perPage = parseInt(req.nextUrl.searchParams.get('per_page') ?? '10', 10)

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], total_results: 0 })
  }

  try {
    // 1. Recherche locale (DB PostgreSQL)
    if (await localDbReady()) {
      const results = await searchLocal(q, perPage)
      // Filtrer les résultats sans dénomination (établissements dont le nom
      // est uniquement dans StockUnitesLegales, pas dans StockEtablissement)
      const named = results.filter(r => r.nom_complet !== r.siren)
      if (named.length > 0) {
        return NextResponse.json({ results: named, total_results: named.length })
      }
    }

    // 2. AP flow (sync)
    const apData = await callFlow<{ results: unknown[]; total_results: number }>(
      'SIRENE', { q, per_page: String(perPage) }
    )
    if (apData && Array.isArray(apData.results)) {
      return NextResponse.json(apData)
    }

    // 3. Fallback direct API gouvernementale
    const url = `${SIRENE_BASE}/search?q=${encodeURIComponent(q)}&per_page=${perPage}&page=1`
    const res  = await fetch(url, {
      headers: { Accept: 'application/json' },
      next:    { revalidate: 60 },
    })
    if (!res.ok) return NextResponse.json({ results: [], total_results: 0 })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ results: [], total_results: 0 }, { status: 500 })
  }
}
