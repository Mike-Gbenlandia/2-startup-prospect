import fs from 'fs';
import path from 'path';

const dir = 'evidence/phase1';
const files = fs.readdirSync(dir).filter((f) => f.startsWith('search_') && f.endsWith('.json')).sort();

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const web = data?.data?.web || [];
  console.log(`\n=== ${f} (${web.length}) ===`);
  for (const w of web) {
    const t = (w.title || '').replace(/\s+/g, ' ').trim();
    const d = (w.description || '').replace(/\s+/g, ' ').trim();
    const u = w.url || '';
    if (/(nigeria|nigerian|lagos|abuja|ibadan|pre-seed|seed|angel|raises|secured|funding|accelerator|cohort|grant|idice|cascador|antler|combinator|techstars)/i.test(`${t} ${d} ${u}`)) {
      console.log(`  [${t}] (${u}) :: ${d.slice(0, 160)}`);
    }
  }
}
