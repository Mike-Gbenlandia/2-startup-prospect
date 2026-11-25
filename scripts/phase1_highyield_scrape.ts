import fs from 'fs';
import { runFirecrawlTool } from './fc.ts';

interface Target {
  id: string;
  url: string;
}

const TARGETS: Target[] = [
  // Group A: Roundups & Cohort Announcements
  { id: 'african_startups_jul_2026', url: 'https://african-startups.com/news/funding/meet-the-african-startups-that-raised-funding-in-july-2026/' },
  { id: 'african_startups_sep_2026', url: 'https://african-startups.com/news/funding/african-startups-that-raised-funding-in-september-2026/' },
  { id: 'african_startups_cat_funding', url: 'https://african-startups.com/category/news/funding/' },
  { id: 'african_startups_cat_nigeria', url: 'https://african-startups.com/category/countries/nigeria/' },
  { id: 'techgix_aug_2026', url: 'https://techgix.ng/post/african-startups-that-raised-funding-in-august-2026' },
  { id: 'startupmaphub_30_2026', url: 'https://startupmaphub.com/blog/30-african-startups-that-raised-funding-2026' },
  { id: 'startupmaphub_agritech_2026', url: 'https://startupmaphub.com/blog/top-agritech-startups-africa-2026' },
  { id: 'startuplist_q3_2026', url: 'https://blog.startuplist.africa/articles/q3-2026-african-startup-funding-analysis' },
  { id: 'startuplist_oct_2026', url: 'https://blog.startuplist.africa/articles/october-2026-african-startup-funding-recap' },
  { id: 'weetracker_idice_8', url: 'https://weetracker.com/2026/11/23/8-nigerian-startups-get-800000-idice-growth-lab/' },
  { id: 'techcabal_cascador_niya_8', url: 'https://techcabal.com/2026/11/10/cascador-niya-select-eight-founders/' },
  { id: 'disruptafrica_cascador_10', url: 'https://disruptafrica.com/2026/09/07/cascador-picks-10-nigerian-startups-for-2026-scaleup-growth-programme/' },
  { id: 'google_applied_ai_2026', url: 'https://blog.google/intl/en-africa/company-news/outreach-and-initiatives/applied-ai-lab-cohort-2026/' },
  { id: 'cchub_edtech_cohort4', url: 'https://cchub.africa/cohort-4-of-cchubs-edtech-fellowship-targets-early-stage-startups-innovating-for-the-underserved-learners/' },
  { id: 'disruptafrica_madica_5', url: 'https://disruptafrica.com/2026/09/16/pre-seed-investment-programme-madica-adds-five-startups-to-portfolio/' },
  { id: 'techcabal_village_cap_sep21', url: 'https://techcabal.com/2026/09/21/village-capital-africa/' },
  { id: 'techcabal_village_cap_sep3', url: 'https://techcabal.com/2026/09/03/village-capital-nigeria-investments/' },
  { id: 'liners_moonshot_2026', url: 'https://liners.com/research/moonshot-2026-african-companies' },
  { id: 'techcabal_moonshot_battlefield', url: 'https://techcabal.beehiiv.com/p/acecore-wins-10-000-at-moonshot' },
  { id: 'yc_nigeria', url: 'https://www.ycombinator.com/companies?regions=Nigeria' },

  // Group B: Tech Press Funding Tags
  { id: 'techcabal_funding_p1', url: 'https://techcabal.com/category/funding/' },
  { id: 'techcabal_funding_p2', url: 'https://techcabal.com/category/funding/page/2/' },
  { id: 'techcabal_startups_funding', url: 'https://techcabal.com/category/startups/funding/' },
  { id: 'techpoint_funding_p1', url: 'https://techpoint.africa/subject/funding/' },
  { id: 'techpoint_funding_p2', url: 'https://techpoint.africa/subject/funding/page/2/' },
  { id: 'disruptafrica_funding_p1', url: 'https://disruptafrica.com/category/funding/' },
  { id: 'disruptafrica_funding_p2', url: 'https://disruptafrica.com/category/funding/page/2/' },
  { id: 'condia_funding_p1', url: 'https://thecondia.com/category/funding/' },
  { id: 'condia_funding_p2', url: 'https://thecondia.com/category/funding/page/2/' },
  { id: 'weetracker_funding_p1', url: 'https://weetracker.com/category/funding/' },
  { id: 'weetracker_funding_p2', url: 'https://weetracker.com/category/funding/page/2/' },
  { id: 'launchbase_funding', url: 'https://launchbaseafrica.com/category/funding/' },
  { id: 'au_startups_news', url: 'https://au-startups.com/news' },
  { id: 'trysignalbase_funding', url: 'https://www.trysignalbase.com/news/funding' },

  // Group C: Startuplist Africa Nigeria Filters (1 credit = 10 newest Nigerian rounds)
  { id: 'sl_all', url: 'https://www.startuplist.africa/fundings' },
  { id: 'sl_ng_all', url: 'https://www.startuplist.africa/fundings/nigeria' },
  { id: 'sl_ng_2026', url: 'https://www.startuplist.africa/fundings/nigeria/2026' },
  { id: 'sl_ng_preseed', url: 'https://www.startuplist.africa/fundings/nigeria/pre-seed' },
  { id: 'sl_ng_angel', url: 'https://www.startuplist.africa/fundings/nigeria/angel' },
  { id: 'sl_ng_grant', url: 'https://www.startuplist.africa/fundings/nigeria/grant' },
  { id: 'sl_ng_equity_inv', url: 'https://www.startuplist.africa/fundings/nigeria/equity-investment' },
  { id: 'sl_ng_accelerator', url: 'https://www.startuplist.africa/fundings/nigeria/accelerator' },
  { id: 'sl_ng_noneq', url: 'https://www.startuplist.africa/fundings/nigeria/non-equity-assistance' },
  { id: 'sl_ng_funding_round', url: 'https://www.startuplist.africa/fundings/nigeria/funding-round' },
  { id: 'sl_ng_undisclosed_inv', url: 'https://www.startuplist.africa/fundings/nigeria/undisclosed-investment' },
  { id: 'sl_ng_undisclosed', url: 'https://www.startuplist.africa/fundings/nigeria/undisclosed' },
  { id: 'sl_ng_convertible', url: 'https://www.startuplist.africa/fundings/nigeria/convertible-note' },
  { id: 'sl_ng_prize', url: 'https://www.startuplist.africa/fundings/nigeria/equity-free-prize' },
  { id: 'sl_ng_not_spec', url: 'https://www.startuplist.africa/fundings/nigeria/investment-round-not-specified' },
  { id: 'sl_ng_fintech', url: 'https://www.startuplist.africa/fundings/nigeria/fintech' },
  { id: 'sl_ng_finserv', url: 'https://www.startuplist.africa/fundings/nigeria/financial-services' },
  { id: 'sl_ng_agritech', url: 'https://www.startuplist.africa/fundings/nigeria/agritech' },
  { id: 'sl_ng_agriculture', url: 'https://www.startuplist.africa/fundings/nigeria/agriculture' },
  { id: 'sl_ng_healthtech', url: 'https://www.startuplist.africa/fundings/nigeria/healthtech' },
  { id: 'sl_ng_healthcare', url: 'https://www.startuplist.africa/fundings/nigeria/health-care' },
  { id: 'sl_ng_edtech', url: 'https://www.startuplist.africa/fundings/nigeria/edtech' },
  { id: 'sl_ng_education', url: 'https://www.startuplist.africa/fundings/nigeria/education' },
  { id: 'sl_ng_ecommerce', url: 'https://www.startuplist.africa/fundings/nigeria/e-commerce' },
  { id: 'sl_ng_energy', url: 'https://www.startuplist.africa/fundings/nigeria/energy' },
  { id: 'sl_ng_renewable', url: 'https://www.startuplist.africa/fundings/nigeria/renewable-energy' },
  { id: 'sl_ng_logistics', url: 'https://www.startuplist.africa/fundings/nigeria/logistics' },
  { id: 'sl_ng_transport', url: 'https://www.startuplist.africa/fundings/nigeria/transportation' },
  { id: 'sl_ng_saas', url: 'https://www.startuplist.africa/fundings/nigeria/saas' },
  { id: 'sl_ng_ai', url: 'https://www.startuplist.africa/fundings/nigeria/artificial-intelligence' },
  { id: 'sl_ng_proptech', url: 'https://www.startuplist.africa/fundings/nigeria/proptech' },
  { id: 'sl_ng_insurtech', url: 'https://www.startuplist.africa/fundings/nigeria/insurtech' },
  { id: 'sl_ng_gaming', url: 'https://www.startuplist.africa/fundings/nigeria/gaming' },
  { id: 'sl_ng_hr', url: 'https://www.startuplist.africa/fundings/nigeria/human-resources' },
  { id: 'sl_ng_food', url: 'https://www.startuplist.africa/fundings/nigeria/food-and-beverage' },
  { id: 'sl_ng_mfg', url: 'https://www.startuplist.africa/fundings/nigeria/manufacturing' },
  { id: 'sl_ng_emobility', url: 'https://www.startuplist.africa/fundings/nigeria/electric-mobility' },
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
