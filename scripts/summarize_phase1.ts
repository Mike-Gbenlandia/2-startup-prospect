import fs from 'fs';
import path from 'path';

// Helper to inspect all search & Fireround results in evidence/phase1 and print summary
const dir = 'evidence/phase1';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();

console.log(`Found ${files.length} files in ${dir}`);

const uniqueUrls = new Map<string, { url: string; title: string; sourceFile: string }>();

for (const file of files) {
  const full = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));
  if (file.startsWith('fr_')) {
    const arr = data?.data?.alexandria?.[0]?.data?.data || [];
    console.log(`${file}: ${arr.length} fireround records`);
  } else {
    const web = data?.data?.web || [];
    console.log(`${file}: ${web.length} web results`);
    for (const item of web) {
      if (item.url && !uniqueUrls.has(item.url)) {
        uniqueUrls.set(item.url, {
          url: item.url,
          title: item.title || '',
          sourceFile: file,
        });
      }
    }
  }
}

console.log(`Total unique web URLs collected so far: ${uniqueUrls.size}`);
