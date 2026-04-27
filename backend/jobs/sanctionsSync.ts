/**
 * Sanctions Sync Job — Che.Comex
 * Descarga diaria de listas: OFAC (US), UN, EU
 * Corre 1 vez por día via setInterval desde server-sqlite.ts
 */

import { bulkInsertSanctions, type SanctionSource } from '../services/sanctionsCheck.js';

// ─── OFAC SDN CSV ─────────────────────────────────────────────────────────────
async function syncOFAC(): Promise<number> {
  // OFAC SDN List CSV — US Treasury
  const url = 'https://www.treasury.gov/ofac/downloads/sdn.csv';
  console.log('[SanctionsSync] Downloading OFAC SDN list...');

  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`OFAC download failed: ${res.status}`);

  const csv = await res.text();
  const lines = csv.split('\n').filter(l => l.trim().length > 0);

  const entries: Array<{ name: string; country?: string; source: SanctionSource; type?: string }> = [];

  for (const line of lines) {
    // CSV format: EntNum, SDN_Name, SDN_Type, Program, Title, Call_Sign, Vess_Type, Tonnage, GRT, Vess_Flag, Vess_Owner, Remarks
    const cols = parseCSVLine(line);
    if (cols.length < 2) continue;

    const name = cols[1]?.replace(/^["']|["']$/g, '').trim();
    const type = cols[2]?.replace(/^["']|["']$/g, '').trim();
    if (!name || name === 'SDN_Name') continue;  // skip header

    entries.push({ name, source: 'OFAC', type });
  }

  return bulkInsertSanctions(entries);
}

// ─── UN Consolidated XML ──────────────────────────────────────────────────────
async function syncUN(): Promise<number> {
  const url = 'https://scsanctions.un.org/resources/xml/en/consolidated.xml';
  console.log('[SanctionsSync] Downloading UN consolidated sanctions...');

  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`UN sanctions download failed: ${res.status}`);

  const xml = await res.text();

  // Simple XML parsing — extract INDIVIDUAL and ENTITY names
  const entries: Array<{ name: string; country?: string; source: SanctionSource }> = [];

  // Match <FIRST_NAME>...</FIRST_NAME> + <SECOND_NAME>...<THIRD_NAME>...<FOURTH_NAME>...
  const entityMatches = xml.matchAll(/<NAME_ORIGINAL_SCRIPT>(.*?)<\/NAME_ORIGINAL_SCRIPT>/gs);
  for (const m of entityMatches) {
    const name = m[1].trim();
    if (name.length > 2) entries.push({ name, source: 'UN' });
  }

  // Also grab FIRST_NAME / SECOND_NAME combinations
  const blocks = xml.split(/<\/?(?:INDIVIDUAL|ENTITY)>/);
  for (const block of blocks) {
    const firstName  = block.match(/<FIRST_NAME>(.*?)<\/FIRST_NAME>/s)?.[1]?.trim() || '';
    const secondName = block.match(/<SECOND_NAME>(.*?)<\/SECOND_NAME>/s)?.[1]?.trim() || '';
    const thirdName  = block.match(/<THIRD_NAME>(.*?)<\/THIRD_NAME>/s)?.[1]?.trim() || '';
    const combined   = [firstName, secondName, thirdName].filter(Boolean).join(' ').trim();
    const nationality = block.match(/<NATIONALITY>[^<]*<VALUE>(.*?)<\/VALUE>/s)?.[1]?.trim();

    if (combined.length > 3) {
      entries.push({ name: combined, country: nationality, source: 'UN' });
    }
  }

  return bulkInsertSanctions(entries);
}

// ─── EU Consolidated XML ──────────────────────────────────────────────────────
async function syncEU(): Promise<number> {
  // EU Financial Sanctions File (FSF)
  const url = 'https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content';
  console.log('[SanctionsSync] Downloading EU consolidated sanctions...');

  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`EU sanctions download failed: ${res.status}`);

  const xml = await res.text();
  const entries: Array<{ name: string; country?: string; source: SanctionSource }> = [];

  // EU XML has <nameAlias firstName="..." lastName="..." wholeName="..."/>
  const nameMatches = xml.matchAll(/wholeName="([^"]+)"/g);
  for (const m of nameMatches) {
    const name = m[1].trim();
    if (name.length > 2) entries.push({ name, source: 'EU' });
  }

  // Also match <entity name="...">
  const entityMatches = xml.matchAll(/<entity[^>]+name="([^"]+)"/g);
  for (const m of entityMatches) {
    const name = m[1].trim();
    if (name.length > 2) entries.push({ name, source: 'EU' });
  }

  return bulkInsertSanctions(entries);
}

// ─── CSV parser (simple, handles quoted fields) ───────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── Main sync ────────────────────────────────────────────────────────────────
export async function runSanctionsSync(): Promise<void> {
  console.log('[SanctionsSync] Starting daily sanctions update...');
  const startTime = Date.now();
  let totalAdded = 0;
  const errors: string[] = [];

  for (const [label, fn] of [
    ['OFAC', syncOFAC],
    ['UN',   syncUN],
    ['EU',   syncEU],
  ] as [string, () => Promise<number>][]) {
    try {
      const added = await fn();
      console.log(`[SanctionsSync] ✅ ${label}: ${added} entries`);
      totalAdded += added;
    } catch (err: any) {
      console.error(`[SanctionsSync] ❌ ${label} failed:`, err.message);
      errors.push(`${label}: ${err.message}`);
    }
    // short pause between sources
    await new Promise(r => setTimeout(r, 2000));
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[SanctionsSync] Done in ${elapsed}s — ${totalAdded} total entries, ${errors.length} errors`);
}

// ─── Scheduler ────────────────────────────────────────────────────────────────
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function startSanctionsSyncScheduler(): void {
  // Run immediately on start, then every 24h
  setTimeout(async () => {
    try { await runSanctionsSync(); } catch (e) { console.error('[SanctionsSync] Initial run failed:', e); }
  }, 10_000); // 10s after boot

  setInterval(async () => {
    try { await runSanctionsSync(); } catch (e) { console.error('[SanctionsSync] Scheduled run failed:', e); }
  }, ONE_DAY_MS);

  console.log('[SanctionsSync] Scheduler initialized (runs every 24h)');
}
