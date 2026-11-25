import fs from 'fs';
import { runFirecrawlTool } from './fc.ts';

interface SearchTask {
  id: string;
  query: string;
  tbs?: string;
  limit?: number;
}

const TASKS: SearchTask[] = [
  // Press archives & clean queries (without overly narrow keyword combos)
  { id: 'press_techcabal_2', query: 'site:techcabal.com "pre-seed" OR "seed round" OR "raises" Nigeria 2026', limit: 20 },
  { id: 'press_techpoint_2', query: 'site:techpoint.africa "pre-seed" OR "seed" OR "raises" Nigerian 2026', limit: 20 },
  { id: 'press_benjamindada_2', query: 'site:benjamindada.com "pre-seed" OR "seed" OR "raises" 2026', limit: 20 },
  { id: 'press_techcrunch_2', query: 'site:techcrunch.com "Nigeria" OR "Lagos" startup funding 2026', limit: 20 },
  { id: 'press_condia_2', query: 'site:thecondia.com "pre-seed" OR "seed" OR "raises" Nigeria 2026', limit: 20 },
  { id: 'press_launchbase_2', query: 'site:launchbaseafrica.com Nigeria startup "pre-seed" OR "seed" OR "raises" 2026', limit: 20 },
  { id: 'press_weetracker_2', query: 'site:weetracker.com Nigerian startup raises OR "pre-seed" OR "seed" 2026', limit: 20 },
  { id: 'press_disrupt_2', query: 'site:disruptafrica.com "Nigerian" startup "raises" OR "pre-seed" OR "seed" 2026', limit: 20 },
  { id: 'press_businessday_thecable', query: '(site:businessday.ng OR site:thecable.ng OR site:technext24.com) Nigerian startup "pre-seed" OR "seed round" OR "raises" 2026', limit: 20 },

  // Monthly & weekly roundups (specific months July - November 2026)
  { id: 'month_jul_2026', query: 'Nigerian startup raises "July 2026" "pre-seed" OR "seed" OR "funding"', limit: 20 },
  { id: 'month_aug_2026', query: 'Nigerian startup raises "August 2026" "pre-seed" OR "seed" OR "funding"', limit: 20 },
  { id: 'month_sep_2026', query: 'Nigerian startup raises "September 2026" "pre-seed" OR "seed" OR "funding"', limit: 20 },
  { id: 'month_oct_2026', query: 'Nigerian startup raises "October 2026" "pre-seed" OR "seed" OR "funding"', limit: 20 },
  { id: 'month_nov_2026', query: 'Nigerian startup raises "November 2026" "pre-seed" OR "seed" OR "funding"', limit: 20 },

  // Accelerators & Nigerian ecosystem cohorts in 2026
  { id: 'acc_orange_idice_cascador', query: 'Nigerian startups ("Orange Corners" OR "iDICE" OR "Cascador" OR "FMYD") cohort 2026', limit: 20 },
  { id: 'acc_arm_vp_microtraction', query: 'Nigerian startups ("ARM Labs" OR "Ventures Platform" OR "Microtraction" OR "Future Africa" OR "Ingressive") 2026', limit: 20 },
  { id: 'acc_tef_cchub_alx', query: 'Nigerian startups ("Tony Elumelu" OR "CcHUB" OR "54 Collective" OR "Founders Factory") 2026', limit: 20 },
  { id: 'acc_yc_techstars_antler_2', query: '("Y Combinator" OR "Techstars" OR "Antler") ("Nigeria" OR "Lagos" OR "Nigerian") 2026 cohort OR batch', limit: 20 },

  // Cities & underrepresented sectors
  { id: 'city_abuja_ibadan_ph', query: '("Abuja" OR "Ibadan" OR "Port Harcourt" OR "Enugu") startup raises "pre-seed" OR "seed" OR "funding" 2026', limit: 20 },
  { id: 'sec_food_legal_creator', query: 'Nigeria startup ("foodtech" OR "legaltech" OR "creator" OR "fashion" OR "beauty") raises funding 2026', limit: 20 },
  { id: 'sec_saas_devtools_ai', query: 'Nigerian startup ("SaaS" OR "B2B" OR "AI") "pre-seed" OR "seed round" OR "angel" 2026', limit: 20 },
  { id: 'sec_climate_energy_mobility', query: 'Nigerian startup ("clean energy" OR "solar" OR "climate" OR "EV" OR "mobility") raises "pre-seed" OR "seed" 2026', limit: 20 },
  { id: 'sec_health_ed_prop', query: 'Nigerian startup ("healthtech" OR "edtech" OR "proptech") "pre-seed" OR "seed" OR "grant" 2026', limit: 20 },
  { id: 'angel_grant_2026', query: 'Nigerian startup ("angel round" OR "angel funding" OR "grant" OR "non-dilutive") 2026', tbs: 'cdr:1,cd_min:07/01/2026,cd_max:11/24/2026', limit: 20 },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  for (const t of TASKS) {
    const outPath = `evidence/phase1/search2_${t.id}.json`;
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
    while (attempts < 4) {
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
