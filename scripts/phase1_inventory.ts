import fs from 'fs';
import path from 'path';

const dir = 'evidence/phase1';
const files = fs.readdirSync(dir).sort();

let totalWeb = 0;
const byHost = new Map<string, number>();
const urls = new Map<string, { url: string; title: string; description: string; sourceFile: string }>();

for (const f of files) {
  if (!f.endsWith('.json')) continue;
  const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (f.startsWith('fr_')) {
    const rows = data?.data?.alexandria?.[0]?.data?.data || [];
    console.log(`FR ${f}: ${rows.length} rows`);
  } else {
    const web = data?.data?.web || [];
    totalWeb += web.length;
    for (const w of web) {
      if (!w.url) continue;
      if (!urls.has(w.url)) {
        urls.set(w.url, {
          url: w.url,
          title: w.title || '',
          description: w.description || '',
          sourceFile: f,
        });
      }
      try {
        const host = new URL(w.url).hostname.replace(/^www\./, '');
        byHost.set(host, (byHost.get(host) || 0) + 1);
      } catch {}
    }
  }
}

console.log(`Total web items: ${totalWeb}, unique URLs: ${urls.size}`);
const topHosts = [...byHost.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
console.log('Top hosts:', topHosts);
