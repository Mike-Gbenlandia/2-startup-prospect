import { runFirecrawlTool } from './fc.ts';

async function main() {
  // 1. fireround/companies/search for Nigeria, Lagos, Abuja
  const companyQueries = [
    { label: 'companies_nigeria', options: { q: 'Nigeria', since: '2026-07-01', limit: 100 } },
    { label: 'companies_lagos', options: { q: 'Lagos', since: '2026-07-01', limit: 100 } },
    { label: 'companies_abuja', options: { q: 'Abuja', since: '2026-07-01', limit: 100 } },
  ];

  for (const cq of companyQueries) {
    const res = await runFirecrawlTool({
      tool: 'alexandria',
      endpoint: '/scrape',
      method: 'POST',
      body: {
        alexandria: {
          provider: 'fireround',
          capability: 'companies/search',
          options: cq.options,
        },
      },
      outPath: `evidence/phase1/fr_${cq.label}.json`,
    });
    const d = res.json?.data?.alexandria?.[0]?.data;
    console.log(cq.label, 'status:', res.status, 'credits:', res.credits, 'count:', d?.data?.length ?? 0, 'total:', d?.total ?? 0);
  }

  // 2. fireround/rounds/search with next_cursor pagination
  const roundQueries = ['Lagos', 'Nigerian', 'Africa'];
  for (const rq of roundQueries) {
    let cursor: string | null = null;
    let page = 1;
    while (page <= 3) {
      const options: Record<string, unknown> = {
        q: rq,
        since: '2026-07-01',
        limit: 50,
      };
      if (cursor) options.cursor = cursor;

      const res = await runFirecrawlTool({
        tool: 'alexandria',
        endpoint: '/scrape',
        method: 'POST',
        body: {
          alexandria: {
            provider: 'fireround',
            capability: 'rounds/search',
            options,
          },
        },
        outPath: `evidence/phase1/fr_rounds_${rq.toLowerCase()}_p${page}.json`,
      });
      const d = res.json?.data?.alexandria?.[0]?.data;
      const rows = d?.data || [];
      console.log(`rounds_${rq}_p${page}`, 'status:', res.status, 'credits:', res.credits, 'count:', rows.length, 'next_cursor:', d?.next_cursor ?? null);
      cursor = d?.next_cursor || null;
      if (!cursor || rows.length === 0) break;
      page++;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
