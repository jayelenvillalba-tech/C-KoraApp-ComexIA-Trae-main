/**
 * Sanctions Check Service — Che.Comex
 * OFAC SDN List (US Treasury) — gratuita, actualización diaria
 * UN Consolidated Sanctions — gratuita
 * EU Consolidated Sanctions — gratuita
 *
 * NOTA DE PRIVACIDAD: Nunca revelar al usuario QUÉ lista lo bloqueó.
 * Solo mensaje genérico de "no podemos completar el registro".
 */

import { getSqliteDb } from '../../database/db-sqlite.js';

export type SanctionSource = 'OFAC' | 'UN' | 'EU';

export interface SanctionResult {
  isSanctioned: boolean;
  matchType: 'exact' | 'fuzzy' | 'none';
  matchedEntity?: string;
  listSource?: SanctionSource;
  confidence: number;  // 0–100
}

// ─── String normalization ─────────────────────────────────────────────────────
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quitar tildes
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Levenshtein distance ─────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarityScore(query: string, target: string): number {
  if (target.includes(query) || query.includes(target)) return 95;
  const dist = levenshtein(query, target);
  const maxLen = Math.max(query.length, target.length);
  return Math.round((1 - dist / maxLen) * 100);
}

// ─── Main check ───────────────────────────────────────────────────────────────
export async function checkSanctions(
  companyName: string,
  _country?: string
): Promise<SanctionResult> {
  const db = getSqliteDb();
  if (!db) return { isSanctioned: false, matchType: 'none', confidence: 0 };

  const queryNorm = normalize(companyName);
  if (queryNorm.length < 3) return { isSanctioned: false, matchType: 'none', confidence: 0 };

  // 1. Exact match
  try {
    const exact = db.prepare(
      `SELECT entity_name, list_source FROM sanctions_list
       WHERE entity_name_normalized = ? LIMIT 1`
    ).get(queryNorm) as any;

    if (exact) {
      return {
        isSanctioned: true,
        matchType: 'exact',
        matchedEntity: exact.entity_name,
        listSource: exact.list_source as SanctionSource,
        confidence: 100,
      };
    }

    // 2. Fuzzy match — scan candidates whose first 4 chars overlap
    const prefix = queryNorm.substring(0, 4);
    const candidates = db.prepare(
      `SELECT entity_name, entity_name_normalized, list_source
       FROM sanctions_list
       WHERE entity_name_normalized LIKE ? LIMIT 200`
    ).all(`${prefix}%`) as any[];

    let best: { name: string; source: string; score: number } | null = null;
    for (const c of candidates) {
      const score = similarityScore(queryNorm, c.entity_name_normalized);
      if (!best || score > best.score) {
        best = { name: c.entity_name, source: c.list_source, score };
      }
    }

    if (best && best.score >= 85) {
      return {
        isSanctioned: true,
        matchType: 'fuzzy',
        matchedEntity: best.name,
        listSource: best.source as SanctionSource,
        confidence: best.score,
      };
    }

    if (best && best.score >= 60) {
      return {
        isSanctioned: false,  // no bloquear, pero flag
        matchType: 'fuzzy',
        matchedEntity: best.name,
        listSource: best.source as SanctionSource,
        confidence: best.score,
      };
    }

    return { isSanctioned: false, matchType: 'none', confidence: 0 };

  } catch (err: any) {
    console.error('[Sanctions] Check error:', err.message);
    return { isSanctioned: false, matchType: 'none', confidence: 0 };
  }
}

// ─── Bulk insert for sync job ─────────────────────────────────────────────────
export function bulkInsertSanctions(
  entries: Array<{ name: string; country?: string; source: SanctionSource; type?: string }>,
  clearFirst = false
): number {
  const db = getSqliteDb();
  if (!db) return 0;

  if (clearFirst) {
    db.prepare(`DELETE FROM sanctions_list`).run();
  }

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO sanctions_list
     (entity_name, entity_name_normalized, country, list_source, sanction_type, updated_at)
     VALUES (?, ?, ?, ?, ?, strftime('%s','now'))`
  );

  let count = 0;
  const insertMany = db.transaction((rows: typeof entries) => {
    for (const r of rows) {
      const norm = normalize(r.name);
      if (norm.length < 3) continue;
      stmt.run(r.name, norm, r.country ?? null, r.source, r.type ?? null);
      count++;
    }
  });

  insertMany(entries);
  return count;
}
