import fs from 'fs';
import { runFirecrawlTool } from './fc.ts';

interface ScrapeTarget {
  kind: 'scrape';
  id: string;
  url: string;
}

interface SearchTarget {
  kind: 'search';
  id: string;
  query: string;
  limit: number;
  tbs?: string;
}

type Target = ScrapeTarget | SearchTarget;

const TARGETS: Target[] = [
  // Remaining Startuplist /2026 sectors & round types
  { kind: 'scrape', id: 'sl_ng_finance_2026', url: 'https://www.startuplist.africa/fundings/nigeria/finance/2026' },
  { kind: 'scrape', id: 'sl_ng_insurance_2026', url: 'https://www.startuplist.africa/fundings/nigeria/insurance/2026' },
  { kind: 'scrape', id: 'sl_ng_it_2026', url: 'https://www.startuplist.africa/fundings/nigeria/information-technology/2026' },
  { kind: 'scrape', id: 'sl_ng_health_2026', url: 'https://www.startuplist.africa/fundings/nigeria/health/2026' },
  { kind: 'scrape', id: 'sl_ng_bigdata_2026', url: 'https://www.startuplist.africa/fundings/nigeria/big-data/2026' },
  { kind: 'scrape', id: 'sl_ng_consumergoods_2026', url: 'https://www.startuplist.africa/fundings/nigeria/consumer-goods/2026' },
  { kind: 'scrape', id: 'sl_ng_convnote_2026', url: 'https://www.startuplist.africa/fundings/nigeria/convertible-note/2026' },
  { kind: 'scrape', id: 'sl_ng_corporate_2026', url: 'https://www.startuplist.africa/fundings/nigeria/corporate/2026' },
  { kind: 'scrape', id: 'sl_ng_inv_notspec_2026', url: 'https://www.startuplist.africa/fundings/nigeria/investment-round-not-specified/2026' },
  { kind: 'scrape', id: 'sl_ng_venture_type_2026', url: 'https://www.startuplist.africa/fundings/nigeria/venture-capital/2026' },

  // F6S Nigeria category listings
  { kind: 'scrape', id: 'f6s_ng_fintech', url: 'https://www.f6s.com/companies/fintech/nigeria/co' },
  { kind: 'scrape', id: 'f6s_ng_saas', url: 'https://www.f6s.com/companies/saas/nigeria/co' },
  { kind: 'scrape', id: 'f6s_ng_ai', url: 'https://www.f6s.com/companies/artificial-intelligence/nigeria/co' },
  { kind: 'scrape', id: 'f6s_ng_ecommerce', url: 'https://www.f6s.com/companies/e-commerce/nigeria/co' },

  // Nigerian & African press funding feeds
  { kind: 'scrape', id: 'as_funding_feed', url: 'https://african-startups.com/news/funding/' },
  { kind: 'scrape', id: 'techpoint_funding', url: 'https://techpoint.africa/subject/funding/' },
  { kind: 'scrape', id: 'benjamindada_funding', url: 'https://www.benjamindada.com/tag/funding/' },
  { kind: 'scrape', id: 'condia_funding', url: 'https://thecondia.com/category/funding/' },

  // Targeted searches for Jul-Nov 2026 cohorts & Nigerian early-stage rounds
  {
    kind: 'search',
    id: 'search_e_cohorts_2026',
    query: 'Nigerian startups selected cohort 2026 Antler OR Techstars OR "Catalyst Fund" OR Norrsken OR "Orange Corners" OR "Lagos Agrithon" OR MEST OR CcHUB',
    limit: 20,
    tbs: 'qdr:y',
  },
  {
    kind: 'search',
    id: 'search_e_press_2026',
    query: '(site:techpoint.africa OR site:techcabal.com OR site:benjamindada.com OR site:thecondia.com) Nigerian startup (raises OR raised OR secures OR pre-seed OR seed) 2026',
    limit: 20,
    tbs: 'qdr:y',
  },
  {
    kind: 'search',
    id: 'search_e_da_as_2026',
    query: '(site:disruptafrica.com OR site:african-startups.com) Nigeria (pre-seed OR seed OR angel OR grant OR accelerator) 2026',
    limit: 20,
    tbs: 'qdr:y',
  },
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
      const r =
        t.kind === 'scrape'
          ? await runFirecrawlTool({
              tool: 'scrape',
              endpoint: '/scrape',
              method: 'POST',
              body: { url: t.url, formats: ['markdown', 'links'] },
              outPath,
              markdownOutPath: mdPath,
            })
          : await runFirecrawlTool({
              tool: 'search',
              endpoint: '/search',
              method: 'POST',
              body: { query: t.query, limit: t.limit, ...(t.tbs ? { tbs: t.tbs } : {}) },
              outPath: `evidence/phase1/${t.id}.json`,
            });

      console.log(`${t.id} (try ${attempts}): status=${r.status} credits=${r.credits}`);
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
