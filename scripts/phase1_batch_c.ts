import fs from 'fs';
import { runFirecrawlTool } from './fc.ts';

interface Target {
  id: string;
  url: string;
}

const TARGETS: Target[] = [
  // Startuplist Africa /2026 Sector & Round Filters (newest 2026 Nigerian deals)
  { id: 'sl_ng_finserv_2026', url: 'https://www.startuplist.africa/fundings/nigeria/financial-services/2026' },
  { id: 'sl_ng_healthcare_2026', url: 'https://www.startuplist.africa/fundings/nigeria/health-care/2026' },
  { id: 'sl_ng_education_2026', url: 'https://www.startuplist.africa/fundings/nigeria/education/2026' },
  { id: 'sl_ng_itserv_2026', url: 'https://www.startuplist.africa/fundings/nigeria/information-technology-services/2026' },
  { id: 'sl_ng_renew_2026', url: 'https://www.startuplist.africa/fundings/nigeria/renewable-energy/2026' },
  { id: 'sl_ng_transport_2026', url: 'https://www.startuplist.africa/fundings/nigeria/transportation/2026' },
  { id: 'sl_ng_agri_2026', url: 'https://www.startuplist.africa/fundings/nigeria/agriculture/2026' },
  { id: 'sl_ng_mfg_2026', url: 'https://www.startuplist.africa/fundings/nigeria/manufacturing/2026' },
  { id: 'sl_ng_software_2026', url: 'https://www.startuplist.africa/fundings/nigeria/software/2026' },
  { id: 'sl_ng_hr_2026', url: 'https://www.startuplist.africa/fundings/nigeria/human-resources/2026' },
  { id: 'sl_ng_gaming_2026', url: 'https://www.startuplist.africa/fundings/nigeria/gaming/2026' },
  { id: 'sl_ng_elearning_2026', url: 'https://www.startuplist.africa/fundings/nigeria/e-learning/2026' },
  { id: 'sl_ng_dighealth_2026', url: 'https://www.startuplist.africa/fundings/nigeria/digital-health/2026' },
  { id: 'sl_ng_retail_2026', url: 'https://www.startuplist.africa/fundings/nigeria/retail/2026' },
  { id: 'sl_ng_blockchain_2026', url: 'https://www.startuplist.africa/fundings/nigeria/blockchain/2026' },
  { id: 'sl_ng_auto_2026', url: 'https://www.startuplist.africa/fundings/nigeria/automotive/2026' },
  { id: 'sl_ng_ads_2026', url: 'https://www.startuplist.africa/fundings/nigeria/advertising/2026' },
  { id: 'sl_ng_venture_2026', url: 'https://www.startuplist.africa/fundings/nigeria/venture/2026' },
  { id: 'sl_ng_equity_2026', url: 'https://www.startuplist.africa/fundings/nigeria/equity/2026' },
  { id: 'sl_ng_eqprize_2026', url: 'https://www.startuplist.africa/fundings/nigeria/equity-free-prize/2026' },
  { id: 'sl_ng_5m20m_2026', url: 'https://www.startuplist.africa/fundings/nigeria/2026?bucket=5m-20m' },

  // High-yield West Africa / Nigeria tech press & startup lists
  { id: 'da_west_africa_p1', url: 'https://disruptafrica.com/category/region/west-africa/' },
  { id: 'da_west_africa_p2', url: 'https://disruptafrica.com/category/region/west-africa/page/2/' },
  { id: 'da_west_africa_p3', url: 'https://disruptafrica.com/category/region/west-africa/page/3/' },
  { id: 'as_stellar_cvlabs', url: 'https://african-startups.com/countries/cote-divoire/three-african-fintech-startups-selected-for-stellar-and-cv-labs-first-accelerator-cohort/' },
  { id: 'signalbase_zendtrax', url: 'https://www.trysignalbase.com/news/funding/zendtrax-raises-50k-in-pre-seed-round' },
  { id: 'liners_food_ng_2026', url: 'https://liners.com/research/food-delivery-apps-nigeria-2026' },
  { id: 'tc_daily_nov20', url: 'https://techcabal.com/2026/11/20/techcabal-daily-kuda-cuts-jobs-again/' },
  { id: 'incash_scorecard_2026', url: 'https://blog.incash.africa/nigerias-2026-startup-scorecard-who-won-who-folded-and-the-lessons-everyone-should-steal-d67b4326e9a4' },
  { id: 'f6s_nigeria_100', url: 'https://www.f6s.com/companies/nigeria/lo' },
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
