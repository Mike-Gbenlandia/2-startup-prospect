import fs from 'fs';
import { runFirecrawlTool } from './fc.ts';

interface Target {
  id: string;
  url: string;
}

const TARGETS: Target[] = [
  // Remaining Startuplist Africa /2026 Sector Filters
  { id: 'sl_ng_fintech_2026', url: 'https://www.startuplist.africa/fundings/nigeria/fintech/2026' },
  { id: 'sl_ng_ecommerce_2026', url: 'https://www.startuplist.africa/fundings/nigeria/e-commerce/2026' },
  { id: 'sl_ng_agritech_2026', url: 'https://www.startuplist.africa/fundings/nigeria/agritech/2026' },
  { id: 'sl_ng_energy_2026', url: 'https://www.startuplist.africa/fundings/nigeria/energy/2026' },
  { id: 'sl_ng_edtech_2026', url: 'https://www.startuplist.africa/fundings/nigeria/edtech/2026' },
  { id: 'sl_ng_logistics_2026', url: 'https://www.startuplist.africa/fundings/nigeria/logistics/2026' },
  { id: 'sl_ng_ai_2026', url: 'https://www.startuplist.africa/fundings/nigeria/artificial-intelligence/2026' },
  { id: 'sl_ng_saas_2026', url: 'https://www.startuplist.africa/fundings/nigeria/saas/2026' },
  { id: 'sl_ng_banking_2026', url: 'https://www.startuplist.africa/fundings/nigeria/banking/2026' },
  { id: 'sl_ng_marketplace_2026', url: 'https://www.startuplist.africa/fundings/nigeria/marketplace/2026' },
  { id: 'sl_ng_healthtech_2026', url: 'https://www.startuplist.africa/fundings/nigeria/healthtech/2026' },
  { id: 'sl_ng_payments_2026', url: 'https://www.startuplist.africa/fundings/nigeria/payments/2026' },
  { id: 'sl_ng_food_2026', url: 'https://www.startuplist.africa/fundings/nigeria/food-and-beverage/2026' },
  { id: 'sl_ng_proptech_2026', url: 'https://www.startuplist.africa/fundings/nigeria/proptech/2026' },
  { id: 'sl_ng_insurtech_2026', url: 'https://www.startuplist.africa/fundings/nigeria/insurtech/2026' },
  { id: 'sl_ng_emobility_2026', url: 'https://www.startuplist.africa/fundings/nigeria/electric-mobility/2026' },
  { id: 'sl_ng_biotech_2026', url: 'https://www.startuplist.africa/fundings/nigeria/biotechnology/2026' },

  // Remaining Startuplist Africa /2026 Round Type Filters
  { id: 'sl_ng_preseed_2026', url: 'https://www.startuplist.africa/fundings/nigeria/pre-seed/2026' },
  { id: 'sl_ng_grant_2026', url: 'https://www.startuplist.africa/fundings/nigeria/grant/2026' },
  { id: 'sl_ng_angel_2026', url: 'https://www.startuplist.africa/fundings/nigeria/angel/2026' },
  { id: 'sl_ng_accelerator_2026', url: 'https://www.startuplist.africa/fundings/nigeria/accelerator/2026' },
  { id: 'sl_ng_noneq_2026', url: 'https://www.startuplist.africa/fundings/nigeria/non-equity-assistance/2026' },
  { id: 'sl_ng_fundinground_2026', url: 'https://www.startuplist.africa/fundings/nigeria/funding-round/2026' },
  { id: 'sl_ng_eqinv_2026', url: 'https://www.startuplist.africa/fundings/nigeria/equity-investment/2026' },
  { id: 'sl_ng_undiscl_inv_2026', url: 'https://www.startuplist.africa/fundings/nigeria/undisclosed-investment/2026' },
  { id: 'sl_ng_preseriesa_2026', url: 'https://www.startuplist.africa/fundings/nigeria/pre-series-a/2026' },

  // Additional high-yield funding trackers & cohorts
  { id: 'liners_funding', url: 'https://liners.com/funding' },
  { id: 'startupmaphub_nigeria', url: 'https://startupmaphub.com/funding/mvp/nigeria' },
  { id: 'da_africa_ignite', url: 'https://disruptafrica.com/2026/11/25/9-startups-picked-for-1st-africa-ignite-climate-adaptation-cohort/' },
  { id: 'da_her_startup', url: 'https://disruptafrica.com/2026/11/23/her-startup-selects-12-women-led-startups-for-2nd-accelerator-cohort/' },
  { id: 'wt_protegey', url: 'https://weetracker.com/2026/11/16/protegey-secures-pre-seed-funding-lvlup-ventures/' },
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
