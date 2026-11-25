import fs from 'fs';
import { runFirecrawlTool } from './fc.ts';

interface Target {
  id: string;
  url: string;
}

const TARGETS: Target[] = [
  // African-Startups discovered roundups & Nigeria deals (Oct-Nov 2026)
  { id: 'as_oct_2026', url: 'https://african-startups.com/news/funding/meet-the-african-startups-that-secured-funding-in-october-2026/' },
  { id: 'as_google_indie_games', url: 'https://african-startups.com/news/funding/meet-the-10-african-gaming-studios-selected-for-google-plays-1-million-indie-games-fund/' },
  { id: 'as_nsia_4', url: 'https://african-startups.com/countries/nigeria/nigerias-nsia-awards-220k-in-cash-and-equity-to-three-winners-of-its-prize-for-innovation-4-0/' },
  { id: 'as_finca_2026', url: 'https://african-startups.com/news/funding/finca-ventures-prize-2026-six-african-startups-win-400k-in-grants/' },
  { id: 'as_aries_mediatech', url: 'https://african-startups.com/news/funding/aries-media-ventures-launches-debut-fund-for-african-mediatech-startups-backs-first-three-companies/' },
  { id: 'as_stellar_cvlabs', url: 'https://african-startups.com/countries/cote-divoire/three-african-fintech-startups-selected-for-stellar-and-cv-labs-first-accelerator-cohort/' },
  { id: 'as_storipod', url: 'https://african-startups.com/news/funding/chude-jideonwos-fourthmainland-fund-backs-mediatech-startup-storipod-to-scale-creator-monetisation-across-africa/' },
  { id: 'as_protegey', url: 'https://african-startups.com/news/funding/protegey-raises-pre-seed-funding-to-build-shared-fraud-intelligence-network-across-africa/' },
  { id: 'as_cream_dbanj', url: 'https://african-startups.com/news/funding/afreximbank-backs-afrobeats-star-dbanjs-c-r-e-a-m-platform-to-monetise-african-creativity/' },
  { id: 'as_ocular_ai', url: 'https://african-startups.com/news/funding/ocular-ai-raises-2-million-pre-seed-to-build-voice-ai-training-data/' },
  { id: 'as_vatar', url: 'https://african-startups.com/countries/nigeria/nigerias-vatar-creator-of-viral-browser-game-lagos-life-raises-500k-to-scale-its-social-worlds-platform/' },
  { id: 'as_minicor', url: 'https://african-startups.com/countries/nigeria/nigerian-founded-minicor-raises-3-8-million-seed-round-to-connect-ai-with-legacy-software/' },
  { id: 'as_pullus', url: 'https://african-startups.com/countries/nigeria/pullus-gets-first-debt-financing-to-buy-poultry-from-nigerian-smallholder-farmers/' },
  { id: 'as_prado_power', url: 'https://african-startups.com/countries/nigeria/nigerias-prado-power-secures-repp-2-debt-financing-to-develop-five-solar-mini-grids-with-battery-storage/' },
  { id: 'as_ororo_waste', url: 'https://african-startups.com/countries/nigeria/nigerias-ororo-waste-secures-up-to-1-million-from-rising-tide-africa-to-expand-used-cooking-oil-collection/' },
  { id: 'as_lodapoint', url: 'https://african-startups.com/countries/nigeria/lodapoint-launches-truck-hailing-platform-with-over-10000-trucks-engaged/' },
  { id: 'as_cat_funding_p2', url: 'https://african-startups.com/category/news/funding/page/2/' },
  { id: 'as_cat_funding_p3', url: 'https://african-startups.com/category/news/funding/page/3/' },
  { id: 'cchub_edtech_12', url: 'https://cchub.africa/the-mastercard-foundation-edtech-fellowship-backs-12-early-stage-nigerian-startups-advancing-inclusive-education-through-innovation-and-evidence/' },
  { id: 'google_acc_10_4ng', url: 'https://techpoint.africa/news/4-nigerian-startups-for-googles-accelerator/' },
  { id: 'idice_growth_lab_12', url: 'https://techmoonshot.com/2026/07/20/idice-opens-350000-growth-lab-for-12-nigerian-startups/' },
  { id: 'bigdeal_oct_2026', url: 'https://thebigdeal.substack.com/p/october26' },
  { id: 'bigdeal_aug_2026', url: 'https://thebigdeal.substack.com/p/august26' },
  { id: 'startupmaphub_mvp_ng', url: 'https://startupmaphub.com/funding/mvp/nigeria' },
  { id: 'techmoonshot_investors_2026', url: 'https://techmoonshot.com/2026/10/27/most-active-investors-backing-nigerian-startups-in-2026/' },

  // Additional Startuplist Africa Nigeria sectors
  { id: 'sl_ng_payments', url: 'https://www.startuplist.africa/fundings/nigeria/payments' },
  { id: 'sl_ng_elearning', url: 'https://www.startuplist.africa/fundings/nigeria/e-learning' },
  { id: 'sl_ng_marketplace', url: 'https://www.startuplist.africa/fundings/nigeria/marketplace' },
  { id: 'sl_ng_retail', url: 'https://www.startuplist.africa/fundings/nigeria/retail' },
  { id: 'sl_ng_software', url: 'https://www.startuplist.africa/fundings/nigeria/software' },
  { id: 'sl_ng_biotech', url: 'https://www.startuplist.africa/fundings/nigeria/biotechnology' },
  { id: 'sl_ng_consumer', url: 'https://www.startuplist.africa/fundings/nigeria/consumer-goods' },
  { id: 'sl_ng_blockchain', url: 'https://www.startuplist.africa/fundings/nigeria/blockchain' },
  { id: 'sl_ng_climatetech', url: 'https://www.startuplist.africa/fundings/nigeria/climate-tech' },
  { id: 'sl_ng_cleantech', url: 'https://www.startuplist.africa/fundings/nigeria/cleantech' },
  { id: 'sl_ng_realestate', url: 'https://www.startuplist.africa/fundings/nigeria/real-estate' },
  { id: 'sl_ng_media', url: 'https://www.startuplist.africa/fundings/nigeria/media-and-entertainment' },
  { id: 'sl_ng_telecom', url: 'https://www.startuplist.africa/fundings/nigeria/telecommunications' },
  { id: 'sl_ng_supplychain', url: 'https://www.startuplist.africa/fundings/nigeria/supply-chain' },
  { id: 'sl_ng_seed_2026', url: 'https://www.startuplist.africa/fundings/nigeria/seed/2026' },
  { id: 'sl_ng_debt_2026', url: 'https://www.startuplist.africa/fundings/nigeria/debt-financing/2026' },
  { id: 'sl_ng_under1m_2026', url: 'https://www.startuplist.africa/fundings/nigeria/2026?bucket=under-1m' },
  { id: 'sl_ng_1m5m_2026', url: 'https://www.startuplist.africa/fundings/nigeria/2026?bucket=1m-5m' },
  { id: 'sl_ng_undisclosed_2026', url: 'https://www.startuplist.africa/fundings/nigeria/2026?bucket=undisclosed' },
  { id: 'sl_ng_advertising', url: 'https://www.startuplist.africa/fundings/nigeria/advertising' },
  { id: 'sl_ng_banking', url: 'https://www.startuplist.africa/fundings/nigeria/banking' },
  { id: 'sl_ng_insurance', url: 'https://www.startuplist.africa/fundings/nigeria/insurance' },
  { id: 'sl_ng_digital_health', url: 'https://www.startuplist.africa/fundings/nigeria/digital-health' },
  { id: 'sl_ng_it_services', url: 'https://www.startuplist.africa/fundings/nigeria/information-technology-services' },
  { id: 'disruptafrica_news_p1', url: 'https://disruptafrica.com/category/news/' },
  { id: 'disruptafrica_westafrica_p1', url: 'https://disruptafrica.com/category/region/west-africa/' },
  { id: 'disruptafrica_westafrica_p2', url: 'https://disruptafrica.com/category/region/west-africa/page/2/' },
  { id: 'as_cat_nigeria_p2', url: 'https://african-startups.com/category/countries/nigeria/page/2/' },
  { id: 'as_cat_nigeria_p3', url: 'https://african-startups.com/category/countries/nigeria/page/3/' },
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
