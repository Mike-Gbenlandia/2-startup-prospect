import fs from 'fs';
import { runFirecrawlTool } from './fc.ts';

interface Target {
  id: string;
  url: string;
}

const TARGETS: Target[] = [
  { id: 'african_startups_jul_2026', url: 'https://african-startups.com/news/funding/meet-the-african-startups-that-raised-funding-in-july-2026/' },
  { id: 'african_startups_sep_2026', url: 'https://african-startups.com/news/funding/african-startups-that-raised-funding-in-september-2026/' },
  { id: 'as_oct_2026', url: 'https://african-startups.com/news/funding/meet-the-african-startups-that-secured-funding-in-october-2026/' },
  { id: 'techgix_aug_2026', url: 'https://techgix.ng/post/african-startups-that-raised-funding-in-august-2026' },
  { id: 'startupmaphub_30_2026', url: 'https://startupmaphub.com/blog/30-african-startups-that-raised-funding-2026' },
  { id: 'startupmaphub_agritech_2026', url: 'https://startupmaphub.com/blog/top-agritech-startups-africa-2026' },
  { id: 'startuplist_q3_2026', url: 'https://blog.startuplist.africa/articles/q3-2026-african-startup-funding-analysis' },
  { id: 'startuplist_oct_2026', url: 'https://blog.startuplist.africa/articles/october-2026-african-startup-funding-recap' },
  { id: 'weetracker_idice_8', url: 'https://weetracker.com/2026/11/23/8-nigerian-startups-get-800000-idice-growth-lab/' },
  { id: 'techcabal_cascador_niya_8', url: 'https://techcabal.com/2026/11/10/cascador-niya-select-eight-founders/' },
  { id: 'disruptafrica_cascador_10', url: 'https://disruptafrica.com/2026/09/07/cascador-picks-10-nigerian-startups-for-2026-scaleup-growth-programme/' },
  { id: 'google_applied_ai_2026', url: 'https://blog.google/intl/en-africa/company-news/outreach-and-initiatives/applied-ai-lab-cohort-2026/' },
  { id: 'cchub_edtech_12', url: 'https://cchub.africa/the-mastercard-foundation-edtech-fellowship-backs-12-early-stage-nigerian-startups-advancing-inclusive-education-through-innovation-and-evidence/' },
  { id: 'disruptafrica_madica_5', url: 'https://disruptafrica.com/2026/09/16/pre-seed-investment-programme-madica-adds-five-startups-to-portfolio/' },
  { id: 'techcabal_village_cap_sep3', url: 'https://techcabal.com/2026/09/03/village-capital-nigeria-investments/' },
  { id: 'liners_moonshot_2026', url: 'https://liners.com/research/moonshot-2026-african-companies' },
  { id: 'techcabal_moonshot_battlefield', url: 'https://techcabal.beehiiv.com/p/acecore-wins-10-000-at-moonshot' },
  { id: 'yc_nigeria', url: 'https://www.ycombinator.com/companies?regions=Nigeria' },
  { id: 'as_nsia_4', url: 'https://african-startups.com/countries/nigeria/nigerias-nsia-awards-220k-in-cash-and-equity-to-three-winners-of-its-prize-for-innovation-4-0/' },
  { id: 'as_google_indie_games', url: 'https://african-startups.com/news/funding/meet-the-10-african-gaming-studios-selected-for-google-plays-1-million-indie-games-fund/' },
  { id: 'as_finca_2026', url: 'https://african-startups.com/news/funding/finca-ventures-prize-2026-six-african-startups-win-400k-in-grants/' },
  { id: 'as_aries_mediatech', url: 'https://african-startups.com/news/funding/aries-media-ventures-launches-debut-fund-for-african-mediatech-startups-backs-first-three-companies/' },
  { id: 'google_acc_10_4ng', url: 'https://techpoint.africa/news/4-nigerian-startups-for-googles-accelerator/' },
  { id: 'idice_growth_lab_12', url: 'https://techmoonshot.com/2026/07/20/idice-opens-350000-growth-lab-for-12-nigerian-startups/' },
  { id: 'african_startups_cat_nigeria', url: 'https://african-startups.com/category/countries/nigeria/' },
  { id: 'as_cat_nigeria_p2', url: 'https://african-startups.com/category/countries/nigeria/page/2/' },
  { id: 'as_cat_nigeria_p3', url: 'https://african-startups.com/category/countries/nigeria/page/3/' },
  { id: 'techmoonshot_investors_2026', url: 'https://techmoonshot.com/2026/10/27/most-active-investors-backing-nigerian-startups-in-2026/' },
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
