import fs from 'fs';
import { runFirecrawlTool } from './fc.ts';

interface Target {
  id: string;
  url: string;
}

const TARGETS: Target[] = [
  { id: 'sl_ng_all', url: 'https://www.startuplist.africa/fundings/nigeria' },
  { id: 'sl_ng_2026', url: 'https://www.startuplist.africa/fundings/nigeria/2026' },
  { id: 'sl_ng_preseed', url: 'https://www.startuplist.africa/fundings/nigeria/pre-seed' },
  { id: 'sl_ng_seed_2026', url: 'https://www.startuplist.africa/fundings/nigeria/seed/2026' },
  { id: 'sl_ng_angel', url: 'https://www.startuplist.africa/fundings/nigeria/angel' },
  { id: 'sl_ng_grant', url: 'https://www.startuplist.africa/fundings/nigeria/grant' },
  { id: 'sl_ng_equity_inv', url: 'https://www.startuplist.africa/fundings/nigeria/equity-investment' },
  { id: 'sl_ng_accelerator', url: 'https://www.startuplist.africa/fundings/nigeria/accelerator' },
  { id: 'sl_ng_noneq', url: 'https://www.startuplist.africa/fundings/nigeria/non-equity-assistance' },
  { id: 'sl_ng_funding_round', url: 'https://www.startuplist.africa/fundings/nigeria/funding-round' },
  { id: 'sl_ng_undisclosed_inv', url: 'https://www.startuplist.africa/fundings/nigeria/undisclosed-investment' },
  { id: 'sl_ng_undisclosed_2026', url: 'https://www.startuplist.africa/fundings/nigeria/2026?bucket=undisclosed' },
  { id: 'sl_ng_under1m_2026', url: 'https://www.startuplist.africa/fundings/nigeria/2026?bucket=under-1m' },
  { id: 'sl_ng_1m5m_2026', url: 'https://www.startuplist.africa/fundings/nigeria/2026?bucket=1m-5m' },
  { id: 'sl_ng_debt_2026', url: 'https://www.startuplist.africa/fundings/nigeria/debt-financing/2026' },
  { id: 'sl_ng_fintech', url: 'https://www.startuplist.africa/fundings/nigeria/fintech' },
  { id: 'sl_ng_payments', url: 'https://www.startuplist.africa/fundings/nigeria/payments' },
  { id: 'sl_ng_agritech', url: 'https://www.startuplist.africa/fundings/nigeria/agritech' },
  { id: 'sl_ng_healthtech', url: 'https://www.startuplist.africa/fundings/nigeria/healthtech' },
  { id: 'sl_ng_edtech', url: 'https://www.startuplist.africa/fundings/nigeria/edtech' },
  { id: 'sl_ng_ecommerce', url: 'https://www.startuplist.africa/fundings/nigeria/e-commerce' },
  { id: 'sl_ng_energy', url: 'https://www.startuplist.africa/fundings/nigeria/energy' },
  { id: 'sl_ng_logistics', url: 'https://www.startuplist.africa/fundings/nigeria/logistics' },
  { id: 'sl_ng_saas', url: 'https://www.startuplist.africa/fundings/nigeria/saas' },
  { id: 'sl_ng_ai', url: 'https://www.startuplist.africa/fundings/nigeria/artificial-intelligence' },
  { id: 'sl_ng_proptech', url: 'https://www.startuplist.africa/fundings/nigeria/proptech' },
  { id: 'sl_ng_insurtech', url: 'https://www.startuplist.africa/fundings/nigeria/insurtech' },
  { id: 'sl_ng_climatetech', url: 'https://www.startuplist.africa/fundings/nigeria/climate-tech' },
  { id: 'sl_ng_marketplace', url: 'https://www.startuplist.africa/fundings/nigeria/marketplace' },
  { id: 'sl_ng_food', url: 'https://www.startuplist.africa/fundings/nigeria/food-and-beverage' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  for (const t of TARGETS) {
    const outPath = `evidence/phase1/hy_${t.id}.json`;
    const mdPath = `evidence/phase1/hy_${t.id}.md`;
    if (fs.existsSync(outPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
        if (existing.httpStatus === 200 && existing.success) {
          console.log(`${t.id}: already done`);
          continue;
        }
      } catch {
        // re-run
      }
    }

    let attempts = 0;
    while (attempts < 4) {
      attempts++;
      const r = await runFirecrawlTool({
        tool: 'scrape',
        endpoint: '/scrape',
        method: 'POST',
        body: { url: t.url, formats: ['markdown', 'links'] },
        outPath,
        markdownOutPath: mdPath,
      });
      console.log(`${t.id} (try ${attempts}): status=${r.status} credits=${r.credits} mdLen=${r.json?.data?.markdown?.length ?? 0}`);
      if (r.status === 429) {
        const waitSec = (r.json?.retry_after_seconds || 35) + 3;
        console.log(`Rate limited, waiting ${waitSec}s...`);
        await sleep(waitSec * 1000);
        continue;
      }
      break;
    }
    await sleep(4500);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
