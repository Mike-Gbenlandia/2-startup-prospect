import fs from 'fs';
import { runFirecrawlTool } from './fc.ts';

async function main() {
  // Step e: Fireround call through Alexandria (using exact options from capability contract)
  console.log('--- Running Step e: Fireround rounds/search ---');
  const fr = await runFirecrawlTool({
    tool: 'alexandria',
    endpoint: '/scrape',
    method: 'POST',
    body: {
      alexandria: {
        provider: 'fireround',
        capability: 'rounds/search',
        options: {
          q: 'Nigeria',
          since: '2026-07-01',
          limit: 10,
        },
      },
    },
    outPath: 'evidence/phase0_e_fireround_call.json',
  });
  console.log('Fireround status:', fr.status, 'outcome:', fr.outcome, 'credits:', fr.credits);
  const frData = fr.json?.data?.alexandria?.[0]?.data;
  console.log('Fireround rounds returned:', frData?.data?.length ?? 0, 'next_cursor:', frData?.next_cursor ?? null);

  // Step d: Interact session on public Instagram profile of Nigerian tech outlet (TechCabal)
  console.log('--- Running Step d: Instagram Scrape + Interact ---');
  const igUrl = 'https://www.instagram.com/techcabal/';
  const scrapeRes = await runFirecrawlTool({
    tool: 'scrape',
    endpoint: '/scrape',
    method: 'POST',
    body: {
      url: igUrl,
      formats: ['markdown'],
      waitFor: 3000,
    },
    outPath: 'evidence/phase0_d_ig_scrape.json',
    markdownOutPath: 'evidence/phase0_d_ig_scrape.md',
  });
  console.log('IG scrape status:', scrapeRes.status, 'scrapeId:', scrapeRes.scrapeId, 'credits:', scrapeRes.credits);

  if (!scrapeRes.scrapeId) {
    throw new Error('No scrapeId returned from Instagram scrape');
  }

  const scrapeId = scrapeRes.scrapeId;
  let liveViewUrl: string | null = null;
  try {
    const interactRes = await runFirecrawlTool({
      tool: 'interact',
      endpoint: `/scrape/${scrapeId}/interact`,
      method: 'POST',
      scrapeIdOverride: scrapeId,
      body: {
        language: 'node',
        timeout: 30,
        code: `
await page.waitForTimeout(2000);
const title = await page.title();
const url = page.url();
const bodyText = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 1500) : '');
const buf = await page.screenshot({ fullPage: false });
JSON.stringify({ title, url, bodyText, screenshotBase64: buf.toString('base64') });
        `.trim(),
      },
      outPath: 'evidence/phase0_d_ig_interact.json',
    });

    liveViewUrl = interactRes.json?.liveViewUrl || null;
    console.log('Interact status:', interactRes.status, 'outcome:', interactRes.outcome, 'liveViewUrl:', liveViewUrl);

    const rawResult = interactRes.json?.result;
    if (rawResult) {
      let parsed: any = rawResult;
      if (typeof rawResult === 'string') {
        parsed = JSON.parse(rawResult);
      }
      console.log('Page title:', parsed.title, 'URL:', parsed.url);
      console.log('Body snippet:', (parsed.bodyText || '').slice(0, 300).replace(/\n+/g, ' '));
      if (parsed.screenshotBase64) {
        fs.writeFileSync('screenshots/test_instagram.png', Buffer.from(parsed.screenshotBase64, 'base64'));
        console.log('Saved screenshots/test_instagram.png');
      } else {
        console.error('No screenshotBase64 in interact result!');
      }
    } else {
      console.error('No result in interact response:', JSON.stringify(interactRes.json).slice(0, 500));
    }
  } finally {
    const stopRes = await runFirecrawlTool({
      tool: 'interact_stop',
      endpoint: `/scrape/${scrapeId}/interact`,
      method: 'DELETE',
      scrapeIdOverride: scrapeId,
      outPath: 'evidence/phase0_d_ig_stop.json',
    });
    console.log('Stop session status:', stopRes.status, 'outcome:', stopRes.outcome);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
