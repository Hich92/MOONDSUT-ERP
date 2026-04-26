#!/usr/bin/env python3
"""
Import SIRENE StockEtablissement → sirene_ref (PostgreSQL)

Stratégie streaming :
 - Télécharge le ZIP par blocs (pas besoin d'écrire sur disque)
 - Décompresse à la volée (deflate raw, offset 57 = juste après le local file header)
 - Filtre : sièges uniquement (établissementSiege == 'true')
 - Insère par lots via COPY FROM STDIN
 - Crée les index en fin d'import

Usage :
    python3 import_sirene.py

Env vars :
    DB_HOST   (default: db)
    DB_NAME   (default: erp)
    DB_USER   (default: erp)
    DB_PASS   (default: erp)
"""

import csv
import io
import os
import sys
import time
import zlib
import urllib.request
import psycopg2
from datetime import datetime

# ── Config ─────────────────────────────────────────────────────────
URL = "https://object.files.data.gouv.fr/data-pipeline-open/siren/stock/StockEtablissement_utf8.zip"
ZIP_LOCAL_HEADER_OFFSET = 57   # computed from header inspection
BATCH_SIZE = 10_000
LOG_EVERY  = 500_000

DB = dict(
    host   = os.getenv("DB_HOST", "172.19.0.5"),
    dbname = os.getenv("DB_NAME", "erp"),
    user   = os.getenv("DB_USER", "erp"),
    password = os.getenv("DB_PASS", "jCb8ml9uxlXbbHkPeHxQmALH5yL0"),
    port   = int(os.getenv("DB_PORT", "5432")),
)

# Colonnes CSV → colonnes DB (ordre = ordre CSV)
# On mappe uniquement celles qu'on garde
COLS_IDX = {
    "siret":                              2,
    "siren":                              0,
    "nic":                                1,
    "etablissementSiege":                 9,   # filtre
    "etatAdministratifEtablissement":    45,
    "dateCreationEtablissement":          4,
    "denominationUsuelleEtablissement":  49,
    "enseigne1Etablissement":            46,
    "activitePrincipaleEtablissement":   50,
    "numeroVoieEtablissement":           12,
    "typeVoieEtablissement":             16,
    "libelleVoieEtablissement":          17,
    "codePostalEtablissement":           18,
    "libelleCommuneEtablissement":       19,
    "codeCommuneEtablissement":          22,
    "trancheEffectifsEtablissement":      5,
    "caractereEmployeurEtablissement":   52,
    "dateDebut":                         44,
}

DB_COLS = (
    "siret", "siren", "nic", "is_siege", "etat", "date_creation",
    "denomination", "enseigne", "code_naf",
    "numero_voie", "type_voie", "libelle_voie",
    "code_postal", "commune", "code_commune",
    "tranche_effectifs", "caractere_employeur", "date_debut",
)

def parse_date(s):
    if not s or s == "":
        return None
    try:
        return datetime.strptime(s[:10], "%Y-%m-%d").date().isoformat()
    except:
        return None

def parse_bool(s):
    return s.strip().lower() == "true"

def row_to_db(csv_row):
    """Transforme un row CSV (list) en tuple pour DB."""
    def g(key):
        idx = COLS_IDX[key]
        return csv_row[idx] if idx < len(csv_row) else ""

    return (
        g("siret"),
        g("siren"),
        g("nic") or None,
        parse_bool(g("etablissementSiege")),
        g("etatAdministratifEtablissement") or None,
        parse_date(g("dateCreationEtablissement")),
        g("denominationUsuelleEtablissement") or None,
        g("enseigne1Etablissement") or None,
        g("activitePrincipaleEtablissement") or None,
        g("numeroVoieEtablissement") or None,
        g("typeVoieEtablissement") or None,
        g("libelleVoieEtablissement") or None,
        g("codePostalEtablissement") or None,
        g("libelleCommuneEtablissement") or None,
        g("codeCommuneEtablissement") or None,
        g("trancheEffectifsEtablissement") or None,
        g("caractereEmployeurEtablissement") or None,
        parse_date(g("dateDebut")),
    )

def stream_csv_from_zip(url, offset):
    """Génère des lignes CSV en décompressant le ZIP à la volée."""
    req = urllib.request.Request(url, headers={"User-Agent": "MoonDust-ERP/1.0"})

    dec = zlib.decompressobj(-15)  # raw deflate
    buf = b""
    total_downloaded = 0
    total_rows = 0
    skip_header = True
    remainder = b""

    with urllib.request.urlopen(req, timeout=120) as resp:
        file_size = int(resp.headers.get("Content-Length", 0))
        print(f"Taille ZIP : {file_size / 1e9:.2f} Go", flush=True)

        # Sauter le local file header du ZIP
        skipped = 0
        while skipped < offset:
            chunk = resp.read(min(offset - skipped, 4096))
            if not chunk:
                break
            skipped += len(chunk)

        # Décompresser et lire par blocs
        while True:
            compressed = resp.read(1 << 20)  # 1 MB chunks
            if not compressed:
                break
            total_downloaded += len(compressed)

            try:
                raw = dec.decompress(compressed)
            except zlib.error:
                # Fin du stream
                try:
                    raw = dec.flush()
                except:
                    raw = b""
                buf += raw
                break

            buf += raw

            # Découper en lignes
            lines = buf.split(b"\n")
            buf = lines.pop()  # garder le reste partiel

            for line_bytes in lines:
                if skip_header:
                    skip_header = False
                    continue
                yield line_bytes.decode("utf-8", errors="replace"), total_downloaded, file_size

        # Traiter le dernier bloc
        if buf:
            yield buf.decode("utf-8", errors="replace"), total_downloaded, file_size

def import_to_db(conn, rows_iter):
    cur = conn.cursor()
    cur.execute("TRUNCATE sirene_ref;")
    conn.commit()

    batch = []
    total = 0
    siege_count = 0
    skipped = 0
    t0 = time.time()
    t_log = t0

    for line, downloaded, file_size in rows_iter:
        line = line.strip()
        if not line:
            continue

        try:
            row = next(csv.reader([line]))
        except:
            skipped += 1
            continue

        total += 1

        # Filtre : sièges uniquement
        siege_idx = COLS_IDX["etablissementSiege"]
        if siege_idx >= len(row):
            skipped += 1
            continue

        is_siege = parse_bool(row[siege_idx])
        if not is_siege:
            continue

        try:
            db_row = row_to_db(row)
        except Exception as e:
            skipped += 1
            continue

        batch.append(db_row)
        siege_count += 1

        if len(batch) >= BATCH_SIZE:
            _flush(cur, batch)
            conn.commit()
            batch = []

        if total % LOG_EVERY == 0:
            now = time.time()
            pct = (downloaded / file_size * 100) if file_size else 0
            rate = total / (now - t0)
            print(
                f"  {total:>10,} lus | {siege_count:>8,} sièges | "
                f"{downloaded/1e9:.2f}/{file_size/1e9:.2f} Go ({pct:.0f}%) | "
                f"{rate:.0f} r/s | skip={skipped}",
                flush=True
            )

    if batch:
        _flush(cur, batch)
        conn.commit()

    cur.close()
    elapsed = time.time() - t0
    return total, siege_count, skipped, elapsed

def _flush(cur, batch):
    buf = io.StringIO()
    writer = csv.writer(buf, quoting=csv.QUOTE_MINIMAL)
    for row in batch:
        writer.writerow(["" if v is None else v for v in row])
    buf.seek(0)
    cur.copy_expert(
        f"COPY sirene_ref ({','.join(DB_COLS)}) FROM STDIN WITH (FORMAT csv, NULL '')",
        buf,
    )

def create_indexes(conn):
    print("\nCréation des index...", flush=True)
    cur = conn.cursor()
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_sirene_ref_siren ON sirene_ref(siren);",
        "CREATE INDEX IF NOT EXISTS idx_sirene_ref_etat ON sirene_ref(etat);",
        "CREATE INDEX IF NOT EXISTS idx_sirene_ref_code_postal ON sirene_ref(code_postal);",
        "CREATE INDEX IF NOT EXISTS idx_sirene_ref_code_naf ON sirene_ref(code_naf);",
        # Full-text search sur denomination et enseigne
        "CREATE INDEX IF NOT EXISTS idx_sirene_ref_denom_trgm ON sirene_ref USING gin(denomination gin_trgm_ops);",
        "CREATE INDEX IF NOT EXISTS idx_sirene_ref_ens_trgm ON sirene_ref USING gin(enseigne gin_trgm_ops);",
    ]
    # Activer pg_trgm pour la recherche trigramme
    cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
    conn.commit()
    for idx_sql in indexes:
        print(f"  {idx_sql[:60]}...", flush=True)
        cur.execute(idx_sql)
        conn.commit()
    cur.close()
    print("Index créés.", flush=True)

def main():
    print(f"=== Import SIRENE StockEtablissement → sirene_ref ===")
    print(f"Démarrage : {datetime.now().isoformat()}")
    print(f"DB : {DB['host']}/{DB['dbname']}")
    print(f"Filtre : établissements siège uniquement\n")

    conn = psycopg2.connect(**DB)

    rows_iter = stream_csv_from_zip(URL, ZIP_LOCAL_HEADER_OFFSET)
    total, siege_count, skipped, elapsed = import_to_db(conn, rows_iter)

    create_indexes(conn)
    conn.close()

    print(f"\n=== TERMINÉ ===")
    print(f"Lignes lues      : {total:,}")
    print(f"Sièges importés  : {siege_count:,}")
    print(f"Ignorées         : {skipped:,}")
    print(f"Durée            : {elapsed/60:.1f} min")
    print(f"Fin              : {datetime.now().isoformat()}")

if __name__ == "__main__":
    main()
