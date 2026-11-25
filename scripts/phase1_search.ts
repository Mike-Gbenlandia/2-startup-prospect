import fs from 'fs';
import { runFirecrawlTool } from './fc.ts';

interface SearchTask {
  id: string;
  query: string;
  tbs?: string;
  limit?: number;
}

const TASKS: SearchTask[] = [
  { id: 'ind_fintech', query: 'Nigerian fintech startup raises "pre-seed" OR "seed round" OR "seed funding" 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_agritech', query: 'Nigerian agritech OR agtech startup raises "pre-seed" OR "seed round" OR funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_healthtech', query: 'Nigerian healthtech OR healthcare startup raises "pre-seed" OR "seed round" OR funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_edtech', query: 'Nigerian edtech OR education startup raises "pre-seed" OR "seed round" OR funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_logistics', query: 'Nigerian logistics OR supply chain startup raises "pre-seed" OR "seed round" OR funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_energy_climate', query: 'Nigerian climate OR clean energy OR solar startup raises "pre-seed" OR "seed round" OR funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_ecommerce', query: 'Nigerian e-commerce OR commerce OR retail startup raises "pre-seed" OR "seed round" OR funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_proptech', query: 'Nigerian proptech OR real estate startup raises "pre-seed" OR "seed round" OR funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_creator_media_gaming', query: 'Nigerian creator economy OR media OR gaming startup raises funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_b2b_saas', query: 'Nigerian B2B software OR SaaS startup raises "pre-seed" OR "seed round" OR funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_hr', query: 'Nigerian HR tech OR payroll OR recruitment startup raises funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_insurtech', query: 'Nigerian insurtech OR insurance startup raises funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_mobility', query: 'Nigerian mobility OR transport OR EV startup raises funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_ai_cyber', query: 'Nigerian AI OR artificial intelligence OR cybersecurity startup raises funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'ind_legal_food', query: 'Nigerian legaltech OR foodtech OR food startup raises funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },

  // Wave 1C: Nigerian & African tech press
  { id: 'press_techcabal', query: 'site:techcabal.com Nigerian startup raises OR "pre-seed" OR "seed round" OR funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'press_techpoint', query: 'site:techpoint.africa startup raises OR "pre-seed" OR "seed round" OR funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'press_disruptafrica', query: 'site:disruptafrica.com Nigeria startup funding OR raises OR "pre-seed" OR "seed" 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'press_techcrunch', query: 'site:techcrunch.com Nigeria OR Lagos startup raises OR "seed" OR "pre-seed" 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'press_benjamindada', query: 'site:benjamindada.com startup raises OR "pre-seed" OR "seed" OR funding 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'press_bigdeal', query: '"Africa: The Big Deal" Nigeria startups funding July August September October November 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'press_condia_launchbase', query: '(site:thecondia.com OR site:launchbaseafrica.com OR site:techinafrica.com OR site:weetracker.com) Nigerian startup raises OR "pre-seed" OR "seed" 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },

  // Wave 1D: Accelerators & programs 2026 cohorts
  { id: 'acc_yc_techstars', query: 'Nigeria OR Lagos startups ("Y Combinator" OR "Techstars" OR "ARM Labs") cohort 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'acc_google_antler', query: 'Nigerian startups ("Google for Startups" OR "Antler" OR "Founders Factory Africa" OR "54 Collective") cohort 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'acc_mest_catalyst_norrsken', query: 'Nigerian startups ("MEST" OR "Catalyst Fund" OR "Norrsken22" OR "Startupbootcamp" OR "Madica" OR "Baobab Network") 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'acc_local_angel', query: 'Nigerian startup "angel round" OR grant OR accelerator cohort selected July August September October November 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },

  // Wave 1E: Founder announcements on LinkedIn & X
  { id: 'social_linkedin', query: 'site:linkedin.com/posts ("pre-seed" OR "seed round" OR "angel round" OR "accelerator") ("Nigeria" OR "Lagos" OR "Abuja") 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'social_x', query: 'site:x.com ("raised" OR "pre-seed" OR "seed round" OR "YC" OR "Techstars") ("Nigeria" OR "Lagos" OR "Nigerian startup") 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },

  // Wave 1F: Monthly & Weekly African Startup Roundups (Jul-Nov 2026)
  { id: 'roundup_monthly_2026', query: 'African startups raised funding ("July 2026" OR "August 2026" OR "September 2026" OR "October 2026" OR "November 2026") Nigeria', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
  { id: 'roundup_au_startups', query: 'site:au-startups.com OR site:african-startups.com OR site:trysignalbase.com Nigeria 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  for (const t of TASKS) {
    const outPath = `evidence/phase1/search_${t.id}.json`;
    if (fs.existsSync(outPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
        if (existing.httpStatus === 200 && existing.success) {
          console.log(`${t.id}: already done (${existing?.data?.web?.length ?? 0} results)`);
          continue;
        }
      } catch {
        // re-run
      }
    }

    const body: Record<string, unknown> = {
      query: t.query,
      limit: t.limit || 20,
      sources: ['web'],
    };
    if (t.tbs) body.tbs = t.tbs;

    let attempts = 0;
    while (attempts < 3) {
      attempts++;
      const r = await runFirecrawlTool({
        tool: 'search',
        endpoint: '/search',
        method: 'POST',
        body,
        outPath,
      });
      console.log(`${t.id} (try ${attempts}): status=${r.status} credits=${r.credits} web=${r.json?.data?.web?.length ?? 0}`);
      if (r.status === 429) {
        const waitSec = (r.json?.retry_after_seconds || 35) + 3;
        console.log(`Rate limited, waiting ${waitSec}s...`);
        await sleep(waitSec * 1000);
        continue;
      }
      break;
    }
    await sleep(6800);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
