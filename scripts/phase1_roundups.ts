import fs from 'fs';
import { runFirecrawlTool } from './fc.ts';

interface RoundupTarget {
  id: string;
  url: string;
}

const TARGETS: RoundupTarget[] = [
  // Monthly & Africa-wide funding roundups (Jul-Nov 2026)
  { id: 'african_startups_jul_2026', url: 'https://african-startups.com/news/funding/meet-the-african-startups-that-raised-funding-in-july-2026/' },
  { id: 'african_startups_aug_2026', url: 'https://african-startups.com/news/funding/african-startups-that-raised-funding-in-august-2026/' },
  { id: 'african_startups_sep_2026', url: 'https://african-startups.com/news/funding/african-startups-that-raised-funding-in-september-2026/' },
  { id: 'african_startups_oct_2026', url: 'https://african-startups.com/news/funding/african-startups-that-raised-funding-in-october-2026/' },
  { id: 'african_startups_nov_2026', url: 'https://african-startups.com/news/funding/african-startups-that-raised-funding-in-november-2026/' },
  { id: 'african_startups_feed', url: 'https://african-startups.com/news/funding/' },
  { id: 'techgix_aug_2026', url: 'https://techgix.ng/post/african-startups-that-raised-funding-in-august-2026' },
  { id: 'startupmaphub_30_2026', url: 'https://startupmaphub.com/blog/30-african-startups-that-raised-funding-2026' },
  { id: 'startupmaphub_agritech_2026', url: 'https://startupmaphub.com/blog/top-agritech-startups-africa-2026' },
  { id: 'startuplist_fundings_all', url: 'https://www.startuplist.africa/fundings' },
  { id: 'startuplist_fundings_nigeria', url: 'https://www.startuplist.africa/fundings/nigeria' },
  { id: 'trysignalbase_funding', url: 'https://www.trysignalbase.com/news/funding' },
  { id: 'au_startups_news', url: 'https://au-startups.com/news' },
  { id: 'liners_moonshot_2026', url: 'https://liners.com/research/moonshot-2026-african-companies' },
  { id: 'techcabal_funding_tag', url: 'https://techcabal.com/category/funding/' },
  { id: 'techpoint_funding_tag', url: 'https://techpoint.africa/subject/funding/' },
  { id: 'disruptafrica_funding_tag', url: 'https://disruptafrica.com/category/funding/' },
  { id: 'benjamindada_funding', url: 'https://www.benjamindada.com/tag/funding/' },
  { id: 'weetracker_idice_8', url: 'https://weetracker.com/2026/11/23/8-nigerian-startups-get-800000-idice-growth-lab/' },
  { id: 'techcabal_cascador_niya_8', url: 'https://techcabal.com/2026/11/10/cascador-niya-select-eight-founders/' },
  { id: 'disruptafrica_cascador_10', url: 'https://disruptafrica.com/2026/09/07/cascador-picks-10-nigerian-startups-for-2026-scaleup-growth-programme/' },
  { id: 'bigdeal_substack', url: 'https://thebigdeal.substack.com/' },
  { id: 'condia_funding', url: 'https://thecondia.com/category/funding/' },
  { id: 'launchbase_funding', url: 'https://launchbaseafrica.com/category/funding/' },
  { id: 'incash_scorecard_2026', url: 'https://blog.incash.africa/nigerias-2026-startup-scorecard-who-won-who-folded-and-the-lessons-everyone-should-steal-d67b4326e9a4' },
  { id: 'techstars_fall_2026', url: 'https://www.techstars.com/newsroom/introducing-techstars-fall-2026-accelerator-class' },
  { id: 'revise_accelerators_ng', url: 'https://www.revise.africa/resources/startup-accelerators-nigeria/' },
  { id: 'startupmaphub_mvp_ng', url: 'https://startupmaphub.com/funding/mvp/nigeria' },
  { id: 'weetracker_funding', url: 'https://weetracker.com/category/funding/' },
  { id: 'techmoonshot_investors_2026', url: 'https://techmoonshot.com/2026/10/27/most-active-investors-backing-nigerian-startups-in-2026/' },
  { id: 'bigdeal_oct_2026', url: 'https://thebigdeal.substack.com/p/october26' },
  { id: 'startuplist_ng_preseed', url: 'https://www.startuplist.africa/fundings/nigeria/pre-seed' },
  { id: 'startuplist_ng_seed', url: 'https://www.startuplist.africa/fundings/nigeria/seed' },
  { id: 'google_applied_ai_2026', url: 'https://blog.google/intl/en-africa/company-news/outreach-and-initiatives/applied-ai-lab-cohort-2026/' },
  { id: 'google_acc_10_4ng', url: 'https://techpoint.africa/news/4-nigerian-startups-for-googles-accelerator/' },
  { id: 'idice_growth_lab_12', url: 'https://techmoonshot.com/2026/07/20/idice-opens-350000-growth-lab-for-12-nigerian-startups/' },
  { id: 'nairametrics_aug_2026', url: 'https://nairametrics.com/2026/09/08/african-startup-funding-nigeria-takes-83-7-as-top-10-deals-raise-428-million-in-august/' },
  { id: 'bigdeal_aug_2026', url: 'https://thebigdeal.substack.com/p/august26' },
  { id: 'startuplist_q3_2026', url: 'https://blog.startuplist.africa/articles/q3-2026-african-startup-funding-analysis' },
  { id: 'africa_dev_aug_2026', url: 'https://africa-dev.io/blogs/african-startup-funding-reaches-443-4-million-in-august-2026-as-nigeria-dominates' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  for (const t of TARGETS) {
    const outPath = `evidence/phase1/roundup_${t.id}.json`;
    const mdPath = `evidence/phase1/roundup_${t.id}.md`;
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
    while (attempts < 3) {
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
    await sleep(3000);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
