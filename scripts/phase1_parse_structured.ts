import fs from 'fs';
import path from 'path';

export interface RawCandidate {
  name: string;
  website: string;
  source_url: string;
  source_date: string;
  evidence_path: string;
  hq_hint?: string;
  stage_hint?: string;
  amount_hint?: string;
  notes?: string;
}

function normName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|ltd|limited|llc|plc|nigeria|africa|technologies|technology)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

const candidates = new Map<string, RawCandidate>();

function addCandidate(c: RawCandidate) {
  const cleanName = c.name.trim().replace(/\s+/g, ' ');
  if (!cleanName || cleanName.length < 2) return;
  const key = normName(cleanName);
  if (!key) return;

  const existing = candidates.get(key);
  if (!existing) {
    candidates.set(key, { ...c, name: cleanName });
  } else {
    if ((!existing.website || existing.website === 'NOT_FOUND') && c.website && c.website !== 'NOT_FOUND') {
      existing.website = c.website;
    }
    if ((!existing.source_date || existing.source_date === 'NOT_FOUND') && c.source_date && c.source_date !== 'NOT_FOUND') {
      existing.source_date = c.source_date;
    }
  }
}

// 1. Parse Fireround files
const phase1Dir = 'evidence/phase1';
for (const f of fs.readdirSync(phase1Dir).sort()) {
  if (!f.startsWith('fr_') || !f.endsWith('.json')) continue;
  const d = JSON.parse(fs.readFileSync(path.join(phase1Dir, f), 'utf8'));
  const rows = d?.data?.alexandria?.[0]?.data?.data || [];
  if (f.includes('companies_')) {
    for (const r of rows) {
      if ((r.headquarters || '').toLowerCase().includes('nigeria') || (r.headquarters || '').toLowerCase().includes('lagos') || (r.headquarters || '').toLowerCase().includes('abuja')) {
        addCandidate({
          name: r.name,
          website: r.domain ? `https://${r.domain}` : 'NOT_FOUND',
          source_url: r.url || 'https://fireround.dev',
          source_date: r.latest_round?.announced_on || 'NOT_FOUND',
          evidence_path: `evidence/phase1/${f}`,
          hq_hint: r.headquarters,
          stage_hint: r.latest_round?.stage_as_written || r.latest_round?.stage,
        });
      }
    }
  } else if (f.includes('rounds_')) {
    for (const r of rows) {
      const hq = (r.company?.headquarters || '').toLowerCase();
      if (hq.includes('nigeria') || hq.includes('lagos') || hq.includes('abuja')) {
        addCandidate({
          name: r.company?.name || '',
          website: r.company?.website || (r.company?.domain ? `https://${r.company.domain}` : 'NOT_FOUND'),
          source_url: r.primary_source?.url || r.sources?.[0]?.url || r.url || 'https://fireround.dev',
          source_date: r.announced_on || 'NOT_FOUND',
          evidence_path: `evidence/phase1/${f}`,
          hq_hint: r.company?.headquarters,
          stage_hint: r.stage_as_written || r.stage,
          amount_hint: r.amount?.as_written || undefined,
        });
      }
    }
  }
}

// 2. Parse Startuplist Africa markdown tables
for (const f of fs.readdirSync(phase1Dir).sort()) {
  if (!f.startsWith('roundup_startuplist_') || !f.endsWith('.md')) continue;
  const md = fs.readFileSync(path.join(phase1Dir, f), 'utf8');
  const lines = md.split('\n');
  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    const cols = line.split('|').map((s) => s.trim());
    if (cols.length < 7) continue;
    if (!line.toLowerCase().includes('nigeria')) continue;
    const startupCol = cols[2] || '';
    const roundCol = cols[3] || '';
    const hqCol = cols[4] || '';
    const amountCol = cols[6] || '';
    const dateCol = cols[7] || '';
    const nameMatch = startupCol.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    const roundMatch = roundCol.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (nameMatch) {
      addCandidate({
        name: nameMatch[1],
        website: 'NOT_FOUND',
        source_url: roundMatch ? roundMatch[2] : nameMatch[2],
        source_date: dateCol || 'NOT_FOUND',
        evidence_path: `evidence/phase1/${f}`,
        hq_hint: hqCol,
        stage_hint: roundMatch ? roundMatch[1] : roundCol,
        amount_hint: amountCol,
      });
    }
  }
}

// 3. Parse african-startups.com monthly roundups
for (const f of ['roundup_african_startups_jul_2026.md', 'roundup_african_startups_sep_2026.md']) {
  const full = path.join(phase1Dir, f);
  if (!fs.existsSync(full)) continue;
  const md = fs.readFileSync(full, 'utf8');
  const sections = md.split(/^## /m).slice(1);
  for (const sec of sections) {
    const secLines = sec.split('\n');
    const title = secLines[0].trim();
    if (!title || title.includes('Vigneshwar') || title.includes('Rahul Raj')) continue;
    const body = secLines.slice(1).join('\n');
    if (!/\b(nigeria|nigerian|lagos|abuja|kaduna|ibadan)\b/i.test(body)) continue;
    const linkMatch = body.match(/Funding[^:]*:\s*\[[^\]]+\]\((https?:\/\/[^)]+)\)/i);
    const sourceUrl = linkMatch
      ? linkMatch[1]
      : f.includes('jul')
      ? 'https://african-startups.com/news/funding/meet-the-african-startups-that-raised-funding-in-july-2026/'
      : 'https://african-startups.com/news/funding/african-startups-that-raised-funding-in-september-2026/';
    const sourceDate = f.includes('jul') ? '2026-07-31' : '2026-10-01';
    addCandidate({
      name: title,
      website: 'NOT_FOUND',
      source_url: sourceUrl,
      source_date: sourceDate,
      evidence_path: `evidence/phase1/${f}`,
      hq_hint: 'Nigeria-mentioned',
    });
  }
}

console.log(`Parsed ${candidates.size} unique candidates from structured sources so far.`);
for (const c of candidates.values()) {
  console.log(`- ${c.name} | ${c.website} | ${c.source_date} | ${c.stage_hint || ''} | ${c.source_url}`);
}
