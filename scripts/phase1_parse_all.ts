import fs from 'fs';
import path from 'path';

export interface CandidateRecord {
  name: string;
  website: string;
  source_url: string;
  source_date: string;
  evidence_path: string;
  stage_hint: string;
  amount_hint: string;
  hq_hint: string;
  source_count: number;
  all_sources: string[];
}

const NON_NG_COUNTRIES = /\b(kenya|kenyan|egypt|egyptian|south africa|south african|ghana|ghanaian|morocco|moroccan|tunisia|tunisian|rwanda|rwandan|uganda|ugandan|senegal|senegalese|ethiopia|ethiopian|tanzania|tanzanian|cameroon|zambia|zimbabwe|mauritius|algeria|ivory coast|cote d'ivoire|côte d’ivoire|benin|togo|sudan|angola|namibia|botswana|malawi|mali|niger|burkina)\b/i;
const NG_TERMS = /\b(nigeria|nigerian|lagos|abuja|ibadan|port harcourt|kano|enugu|kaduna|ilorin|lekki|yaba|jos|owerri|abeokuta|uyo|benin city|akwa ibom|ogun|oyo|rivers|ikeja|anambra|oyigbo)\b/i;

const EXCLUDE_COMPANY_TERMS = /^(meet the|how |why |what |where |african startups|nigerian startups|top \d+|list of|the |africa's|funding in|techcabal|techpoint|disrupt africa|startuplist|african-startups|google play|village capital|world bank|proparco|afreximbank|sterling bank|development bank|dbn|first circle|saviu|madica|flourish|next roots|mediterrania|orange ventures|grounded investment|cardinalstone|ventures platform|acumen|nithio|british international|swedfund|finnfund|ebrd|repp|all on|launch africa|tlcom|partech|antler|techstars|y combinator|cascador|idice|nsia|finca|jobtech|oxano|circle ventures|standard bank|cib|uk launches|nigeria|africa|lenders|investors|vc funding|startup funding|brand press|latest stories|related articles|stay updated|you’ve seen|see the whole|questions about|live market|security verification|klump|golemon|gigbanc|chimoney|baxi|bisedge|protein kapital|instantrad|hustlesasa|honeycoin|swiftway shippers|luno|andela|wiocc|wiocc group|lemfi|moove|jumia|flutterwave|paystack|opay|moniepoint|interswitch|paga|palmpay|kuda|termite|liners|mnt-halan|spiro|m-kopa|biovac|turaco|watu|sun king|sunculture|vantage payment|family bank|abn|dangote|mtn|airtel|airtel money|south africa['’]s zazu|zazu|aflabox|fincart|souk|taurex|rise of fearless|joonapay|kutana|kutana pay|kutana technologies|connect money|dodai|alignd|chipverse|community wolf|lupa robotics|aba life|healthleap|east africa foods|afreenergy solar|miale solar|neofleet capital|blockchain\.com|meta|uba|gtbank|firstbank|zenith bank|liquid intelligent|smile id|paymob|arc ride|mission mobile|moment|valu|swvl|synapse analytics|africa greenco|satlyt|ubci|lersha|grabrfi|mogo kenya|cashi|yoco|enza|crisscross|nsia banque|medikea|tactful ai|ebanx|tlg capital|payaza|grey|dimension data|dimension data limited|raenest|nomba|diamond bank|africa finance corporation|development bank of nigeria|access bank|fcmb|fidelity bank|stanbic ibtc|ecobank|vfd group|verve|quickteller|yellow card)$/i;

const ALIAS_MAP: Record<string, string> = {
  backelfood: 'backel',
  rekoolaccess: 'rekool',
  lagoslife: 'vatar',
  lagoslifegame: 'vatar',
  lagoslifemakervatar: 'vatar',
  life: 'vatar',
  drive45mobility: 'drive45',
  powergenrenewableenergy: 'powergen',
  ororowastemanagement: 'ororowaste',
  maskhnigeria: 'maskh',
  ileemore: 'ileemoretechnologies',
  traindtrainer: 'traindtrainer',
  startupmyka: 'myka',
  mykainsure: 'myka',
  nigeriansolarstartupacecore: 'acecore',
  lagosbasedpouchers: 'pouchers',
  startupnomba: 'nomba',
  aeoncyberdefense: 'aeon',
  coldhubs: 'coldhubs',
  vibejunglelimited: 'vibejungle',
  onitinnovations: 'onit',
  nigeriasonit: 'onit',
  skilladderai: 'skilladder',
  gazuntypeentertainment: 'gazuntype',
};

function normName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(inc|ltd|limited|llc|plc|nigeria|africa|technologies|technology|solutions|services|group|labs|hub|ventures|company|corp|co)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
  return ALIAS_MAP[base] || base;
}

function cleanCompanyName(raw: string): string {
  let s = raw
    .replace(/\*+/g, '')
    .replace(/`/g, '')
    .replace(/^\d+\\?\.\s*/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/\s*[—–-]\s*\$?[\d.,]+[mkb]?.*$/i, '')
    .replace(/^Nigeria[’']s\s+/i, '')
    .replace(/^(?:Nigerian|Lagos-based|Lagos-founded|Abuja-based|Nigerian-founded|African|Kenyan|South African|Egyptian|Ghanaian|Italian)\s+(?:startup|fintech|healthtech|agritech|edtech|climate-tech|cleantech|insurtech|proptech|ai|saas|mobility|ecommerce|e-commerce|logistics|gaming|mediatech|solar|energy|renewable energy|food|company|platform|firm|founded|agribusiness|financial services group)\s+/gi, '')
    .replace(/^(?:startup|fintech|insurtech|agritech|edtech|healthtech|proptech|solar startup)\s+/i, '')
    .replace(/^Lagos-founded\s+/i, '')
    .replace(/^Nigerian-founded\s+/i, '')
    .replace(/[’']s$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

function normalizeDate(raw: string, inferYear?: string): string {
  if (!raw || raw === 'NOT_FOUND') return 'NOT_FOUND';
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const months: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };
  // e.g. 20 Nov 2026 or 19 Nov (only infer year if inferYear provided)
  let m = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s*(\d{4})?/);
  if (m) {
    const mon = months[m[2].toLowerCase()];
    const yr = m[3] || inferYear;
    if (mon && yr) {
      const day = m[1].padStart(2, '0');
      return `${yr}-${mon}-${day}`;
    }
  }
  // e.g. November 20, 2026 or Nov 24
  m = s.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?/);
  if (m) {
    const mon = months[m[1].toLowerCase()];
    const yr = m[3] || inferYear;
    if (mon && yr) {
      const day = m[2].padStart(2, '0');
      return `${yr}-${mon}-${day}`;
    }
  }
  return s;
}

const map = new Map<string, CandidateRecord>();

function addCandidate(input: {
  name: string;
  website?: string;
  source_url: string;
  source_date?: string;
  inferYear?: string;
  evidence_path: string;
  stage_hint?: string;
  amount_hint?: string;
  hq_hint?: string;
}) {
  const clean = cleanCompanyName(input.name);
  if (!clean || clean.length < 2 || clean.length > 55) return;
  if (EXCLUDE_COMPANY_TERMS.test(clean)) return;
  if (/^\d+$/.test(clean) || /^https?:\/\//i.test(clean)) return;
  if (clean.split(' ').length > 6) return;

  const key = normName(clean);
  if (!key || key.length < 2) return;

  const dateNorm = normalizeDate(input.source_date || 'NOT_FOUND', input.inferYear);
  const website = input.website && input.website.startsWith('http') ? input.website.replace(/\?utm_source=.*$/i, '') : 'NOT_FOUND';

  const existing = map.get(key);
  if (!existing) {
    map.set(key, {
      name: clean,
      website,
      source_url: input.source_url,
      source_date: dateNorm,
      evidence_path: input.evidence_path,
      stage_hint: input.stage_hint || '',
      amount_hint: input.amount_hint || '',
      hq_hint: input.hq_hint || 'Nigeria',
      source_count: 1,
      all_sources: [input.source_url],
    });
  } else {
    if (existing.website === 'NOT_FOUND' && website !== 'NOT_FOUND') {
      existing.website = website;
    }
    const existingInWindow = existing.source_date >= '2026-07-01' && existing.source_date <= '2026-11-24';
    const newInWindow = dateNorm >= '2026-07-01' && dateNorm <= '2026-11-24';
    if (!existingInWindow && newInWindow) {
      existing.source_date = dateNorm;
      existing.source_url = input.source_url;
      existing.evidence_path = input.evidence_path;
    } else if (existingInWindow && newInWindow && existing.source_url.includes('liners.com') && !input.source_url.includes('liners.com')) {
      // Prefer direct funding/news URL over general conference list
      existing.source_date = dateNorm;
      existing.source_url = input.source_url;
      existing.evidence_path = input.evidence_path;
    }
    if (!existing.stage_hint && input.stage_hint) existing.stage_hint = input.stage_hint;
    if (!existing.amount_hint && input.amount_hint) existing.amount_hint = input.amount_hint;
    if (!existing.all_sources.includes(input.source_url)) {
      existing.all_sources.push(input.source_url);
      existing.source_count = existing.all_sources.length;
    }
  }
}

const dir = 'evidence/phase1';
const files = fs.readdirSync(dir).sort();

// 1. Fireround JSONs
for (const f of files) {
  if (!f.startsWith('fr_') || !f.endsWith('.json')) continue;
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const rows = d?.data?.alexandria?.[0]?.data?.data || [];
  for (const r of rows) {
    if (f.includes('companies_')) {
      const hq = r.headquarters || '';
      if (NG_TERMS.test(hq)) {
        addCandidate({
          name: r.name || '',
          website: r.domain ? `https://${r.domain}` : 'NOT_FOUND',
          source_url: r.url || 'https://fireround.dev',
          source_date: r.latest_round?.announced_on || 'NOT_FOUND',
          evidence_path: `${dir}/${f}`,
          stage_hint: r.latest_round?.stage_as_written || r.latest_round?.stage || '',
          amount_hint: r.total_raised_usd_millions ? `$${r.total_raised_usd_millions}M` : '',
          hq_hint: hq,
        });
      }
    } else if (f.includes('rounds_')) {
      const hq = r.company?.headquarters || '';
      if (NG_TERMS.test(hq)) {
        addCandidate({
          name: r.company?.name || '',
          website: r.company?.website || (r.company?.domain ? `https://${r.company.domain}` : 'NOT_FOUND'),
          source_url: r.primary_source?.url || r.sources?.[0]?.url || r.url || 'https://fireround.dev',
          source_date: r.announced_on || 'NOT_FOUND',
          evidence_path: `${dir}/${f}`,
          stage_hint: r.stage_as_written || r.stage || '',
          amount_hint: r.amount?.as_written || '',
          hq_hint: hq,
        });
      }
    }
  }
}

// 2. Startuplist Africa table files (hy_sl_*.md)
for (const f of files) {
  if (!f.startsWith('hy_sl_') || !f.endsWith('.md')) continue;
  const md = fs.readFileSync(path.join(dir, f), 'utf8');
  const is2026Filtered = /_2026\.md$/i.test(f) || /\/2026(?:\?|\b|#)/.test(md.slice(0, 300));
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cols = line.split('|').map((s) => s.trim());
    if (cols.length < 8) continue;
    const startupCol = cols[2] || '';
    const roundCol = cols[3] || '';
    const hqCol = cols[4] || '';
    const amountCol = cols[6] || '';
    const dateCol = cols[7] || '';
    if (!NG_TERMS.test(hqCol + ' ' + startupCol)) continue;
    const nameMatch = startupCol.match(/\[([^\]]+)\]\((https:\/\/www\.startuplist\.africa\/startups\/[^)]+)\)/);
    const roundMatch = roundCol.match(/\[([^\]]+)\]\((https:\/\/www\.startuplist\.africa\/funding\/[^)]+)\)/);
    if (nameMatch) {
      addCandidate({
        name: nameMatch[1],
        website: 'NOT_FOUND',
        source_url: roundMatch ? roundMatch[2] : nameMatch[2],
        source_date: dateCol,
        inferYear: is2026Filtered ? '2026' : undefined,
        evidence_path: `${dir}/${f}`,
        stage_hint: roundMatch ? roundMatch[1] : roundCol,
        amount_hint: amountCol.replace(/\d{1,2}\s+[A-Za-z]+.*$/, '').trim(),
        hq_hint: hqCol,
      });
    }
  }
}

// 3. African-Startups monthly roundups
for (const f of ['hy_african_startups_jul_2026.md', 'hy_african_startups_sep_2026.md', 'hy_as_oct_2026.md']) {
  const full = path.join(dir, f);
  if (!fs.existsSync(full)) continue;
  const md = fs.readFileSync(full, 'utf8');
  const sections = md.split(/^## /m).slice(1);
  const fallbackDate = f.includes('jul') ? '2026-07-31' : f.includes('sep') ? '2026-10-01' : '2026-10-30';
  const fallbackUrl = f.includes('jul')
    ? 'https://african-startups.com/news/funding/meet-the-african-startups-that-raised-funding-in-july-2026/'
    : f.includes('sep')
    ? 'https://african-startups.com/news/funding/african-startups-that-raised-funding-in-september-2026/'
    : 'https://african-startups.com/news/funding/meet-the-african-startups-that-secured-funding-in-october-2026/';

  for (const sec of sections) {
    const secLines = sec.split('\n');
    const title = secLines[0].replace(/\*+/g, '').trim();
    if (!title || /^(Vigneshwar|Rahul Raj|Frequently|Methodology|Sources|Other|In this|Related|Subscribe|Follow)/i.test(title)) continue;
    const body = secLines.slice(1).join('\n');
    const hqLineMatch = body.match(/(?:\*\*)?HQ(?:\*\*)?:\s*([^\n]+)/i);
    let isNg = false;
    if (hqLineMatch) {
      isNg = NG_TERMS.test(hqLineMatch[1]);
    } else {
      const descParas = body
        .split('\n')
        .filter((l) => l.trim() && !/^\*\*(?:Founded|Founder|CEO|CFO|CIO|Funding|HQ|Launched)/i.test(l.trim()))
        .slice(0, 2)
        .join(' ');
      isNg = NG_TERMS.test(descParas) && (!NON_NG_COUNTRIES.test(descParas.slice(0, 140)) || NG_TERMS.test(descParas.slice(0, 140)));
    }
    if (!isNg) continue;
    const linkMatch = body.match(/Funding[^:]*:\s*\*?\*?\[([^\]]+)\]\((https?:\/\/[^)]+)\)/i);
    const plainFundingMatch = body.match(/Funding[^:]*:\s*\*?\*?([^\n]+)/i);
    addCandidate({
      name: title,
      website: 'NOT_FOUND',
      source_url: linkMatch ? linkMatch[2] : fallbackUrl,
      source_date: fallbackDate,
      evidence_path: `${dir}/${f}`,
      stage_hint: linkMatch ? linkMatch[1] : (plainFundingMatch ? plainFundingMatch[1].replace(/\*+/g, '').trim() : ''),
      hq_hint: hqLineMatch ? hqLineMatch[1] : 'Nigeria',
    });
  }
}

// 4. StartupMapHub tables
for (const f of ['hy_startupmaphub_30_2026.md', 'hy_startupmaphub_agritech_2026.md']) {
  const full = path.join(dir, f);
  if (!fs.existsSync(full)) continue;
  const md = fs.readFileSync(full, 'utf8');
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cols = line.split('|').map((s) => s.trim());
    if (cols.length < 6) continue;
    const nameCol = cols[1] || '';
    const countryCol = cols[2] || '';
    if (!NG_TERMS.test(countryCol)) continue;
    const linkM = nameCol.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    addCandidate({
      name: linkM ? linkM[1] : nameCol,
      website: 'NOT_FOUND',
      source_url: linkM ? linkM[2] : `https://startupmaphub.com/blog/${f.includes('agritech') ? 'top-agritech-startups-africa-2026' : '30-african-startups-that-raised-funding-2026'}`,
      source_date: '2026-07-15',
      evidence_path: `${dir}/${f}`,
      stage_hint: cols[4] || '',
      amount_hint: cols[5] || '',
      hq_hint: countryCol,
    });
  }
}

// 5. Explicit cohort / prize / roundtable articles containing verified Nigerian startups
const curatedCohorts: Array<{
  file: string;
  url: string;
  date: string;
  stage: string;
  entries: Array<{ name: string; website?: string; amount?: string; hq?: string }>;
}> = [
  {
    file: 'hy_weetracker_idice_8.md',
    url: 'https://weetracker.com/2026/11/23/8-nigerian-startups-get-800000-idice-growth-lab/',
    date: '2026-11-23',
    stage: 'iDICE Growth Lab Equity',
    entries: [
      { name: 'GoDash', amount: '$100K' },
      { name: 'Telios', amount: '$100K' },
      { name: 'Vantrace', amount: '$100K' },
      { name: 'KrosAI', amount: '$100K' },
      { name: 'Leaflet', amount: '$100K' },
      { name: 'Lenol', amount: '$100K' },
      { name: '360gadgetsafrica', amount: '$100K' },
      { name: 'SavvyBee', amount: '$100K' },
    ],
  },
  {
    file: 'hy_techcabal_cascador_niya_8.md',
    url: 'https://techcabal.com/2026/11/10/cascador-niya-select-eight-founders/',
    date: '2026-11-10',
    stage: 'NiYA-Cascador Grant',
    entries: [
      { name: 'SewPro', website: 'https://www.sewpro.app/', amount: '₦5M ($3,711)' },
      { name: 'Biuda', website: 'https://www.biudahq.com/', amount: '₦5M ($3,711)' },
      { name: 'Sparklean Station Nigeria', website: 'https://sparkleanstation.com/', amount: '₦5M ($3,711)' },
      { name: 'Backel Food Services', website: 'https://backel.co/', amount: '₦5M ($3,711)' },
      { name: 'Shellify', amount: '₦5M ($3,711)' },
      { name: 'Rèkool Access Technology', website: 'https://rekool.ng/', amount: '₦5M ($3,711)' },
      { name: 'Agrosavvy Consult', amount: '₦5M ($3,711)' },
      { name: 'Craft Planet', website: 'https://craftplanet.org/', amount: '₦5M ($3,711)' },
    ],
  },
  {
    file: 'hy_disruptafrica_cascador_10.md',
    url: 'https://disruptafrica.com/2026/09/07/cascador-picks-10-nigerian-startups-for-2026-scaleup-growth-programme/',
    date: '2026-09-07',
    stage: 'Cascador ScaleUp 2026 Cohort',
    entries: [
      { name: 'Venco' },
      { name: 'SunFi' },
      { name: 'ColdHubs' },
      { name: 'EHA Clinics' },
      { name: 'Beauty Hut Africa' },
      { name: 'BEYOND Fitness' },
      { name: 'Ziba Beach Resort' },
      { name: 'Tulay Africa' },
      { name: 'Maanj Agric' },
      { name: 'Finger Chops' },
    ],
  },
  {
    file: 'hy_google_applied_ai_2026.md',
    url: 'https://blog.google/intl/en-africa/company-news/outreach-and-initiatives/applied-ai-lab-cohort-2026/',
    date: '2026-11-11',
    stage: 'Google Africa Applied AI Lab 2026 Cohort',
    entries: [
      { name: 'Intron', website: 'https://intron.io/' },
      { name: 'Termii', website: 'https://termii.com/' },
      { name: 'Vendy', website: 'https://vendy.ng/' },
      { name: 'AethexAI', website: 'https://aethexai.com/' },
    ],
  },
  {
    file: 'hy_techcabal_village_cap_sep3.md',
    url: 'https://techcabal.com/2026/09/03/village-capital-nigeria-investments/',
    date: '2026-09-03',
    stage: 'Seed / Catalytic Investment',
    entries: [
      { name: 'Trade Lenda', website: 'https://tradelenda.com/', amount: '$300K' },
      { name: 'AirSmat', website: 'https://airsmat.com/', amount: '$150K' },
    ],
  },
  {
    file: 'hy_techcabal_moonshot_battlefield.md',
    url: 'https://techcabal.beehiiv.com/p/acecore-wins-10-000-at-moonshot',
    date: '2026-10-30',
    stage: 'TC Battlefield 2026 Prize / Finalist',
    entries: [
      { name: 'Acecore', amount: '$10,000' },
      { name: 'Supplya', amount: '$5,000' },
      { name: 'Navidyn Limited', amount: '$2,500' },
      { name: 'Fertitude' },
      { name: 'Lena' },
      { name: 'Qiqi Farms' },
    ],
  },
  {
    file: 'hy_cchub_edtech_12.md',
    url: 'https://cchub.africa/the-mastercard-foundation-edtech-fellowship-backs-12-early-stage-nigerian-startups-advancing-inclusive-education-through-innovation-and-evidence/',
    date: '2026-07-31',
    stage: 'CcHUB Mastercard Foundation EdTech Fellowship Cohort 4 (up to $100k equity-free)',
    entries: [
      { name: 'TrainDTrainer Ltd', amount: 'Up to $100K' },
      { name: 'Talktu', amount: 'Up to $100K' },
      { name: 'DAWN AI STUDY', amount: 'Up to $100K' },
      { name: 'Efiwe', amount: 'Up to $100K' },
      { name: 'Ileemore Technologies Limited', amount: 'Up to $100K' },
      { name: 'Skillup Africa', amount: 'Up to $100K' },
      { name: 'Lena', amount: 'Up to $100K' },
      { name: 'Heels and Tech', amount: 'Up to $100K' },
      { name: 'NursePadi', amount: 'Up to $100K' },
      { name: 'Skilladder AI', amount: 'Up to $100K' },
      { name: 'Lalitah', amount: 'Up to $100K' },
      { name: 'Ribara Analytica', amount: 'Up to $100K' },
    ],
  },
  {
    file: 'hy_as_google_indie_games.md',
    url: 'https://african-startups.com/news/funding/meet-the-10-african-gaming-studios-selected-for-google-plays-1-million-indie-games-fund/',
    date: '2026-11-06',
    stage: 'Google Play Indie Games Fund Africa (non-dilutive)',
    entries: [
      { name: 'Deluxe Entertainment Studios', website: 'https://www.deluxecreation.com/', hq: 'Lagos, Nigeria' },
      { name: 'Fer Factor', website: 'https://ferfactor.com/', hq: 'Lagos, Nigeria' },
      { name: 'Gazuntype Entertainment', website: 'https://gazuntype.com/', hq: 'Nigeria' },
      { name: 'Maliyo Games', website: 'https://www.maliyo.com/', hq: 'Lagos, Nigeria' },
      { name: 'Vatar', amount: '$500K' },
    ],
  },
  {
    file: 'hy_as_nsia_4.md',
    url: 'https://african-startups.com/countries/nigeria/nigerias-nsia-awards-220k-in-cash-and-equity-to-three-winners-of-its-prize-for-innovation-4-0/',
    date: '2026-10-27',
    stage: 'NSIA Prize for Innovation 4.0 (cash & equity)',
    entries: [
      { name: 'Come Again Foods', website: 'https://comeagainfoods.com/', amount: '$100K', hq: 'Lagos, Nigeria' },
    ],
  },
  {
    file: 'hy_as_aries_mediatech.md',
    url: 'https://african-startups.com/news/funding/aries-media-ventures-launches-debut-fund-for-african-mediatech-startups-backs-first-three-companies/',
    date: '2026-10-21',
    stage: 'Early-stage MediaTech (angel/pre-seed/seed)',
    entries: [
      { name: 'Aktivate' },
    ],
  },
  {
    file: 'hy_disruptafrica_madica_5.md',
    url: 'https://disruptafrica.com/2026/09/16/pre-seed-investment-programme-madica-adds-five-startups-to-portfolio/',
    date: '2026-09-16',
    stage: 'Madica Pre-seed',
    entries: [
      { name: 'ChipMango', amount: 'Up to $200K' },
    ],
  },
  {
    file: 'hy_techgix_aug_2026.md',
    url: 'https://techgix.ng/post/african-startups-that-raised-funding-in-august-2026',
    date: '2026-09-04',
    stage: 'August 2026 Funding',
    entries: [
      { name: 'Maskh', amount: '$4M' },
      { name: 'ThriveAgric', amount: '$3.94M' },
      { name: 'Terra Industries', amount: '$18M' },
    ],
  },
  {
    file: 'hy_google_acc_10_4ng.md',
    url: 'https://techpoint.africa/news/4-nigerian-startups-for-googles-accelerator/',
    date: '2026-04-21',
    stage: 'Google for Startups Accelerator Africa Class 10',
    entries: [
      { name: 'Bani' },
      { name: 'MasteryHive AI' },
      { name: 'Regxta' },
      { name: 'Termii' },
    ],
  },
  {
    file: 'hy_signalbase_zendtrax.md',
    url: 'https://www.trysignalbase.com/news/funding/zendtrax-raises-50k-in-pre-seed-round',
    date: '2026-10-30',
    stage: 'Pre-seed (MARL 14th Cohort)',
    entries: [
      { name: 'Zendtrax', website: 'https://zendtrax.co/', amount: '$50K' },
      { name: 'Solarcorp', amount: '$50K' },
      { name: 'Bravoo', amount: '$50K' },
    ],
  },
  {
    file: 'hy_signalbase_zendtrax.md',
    url: 'https://www.trysignalbase.com/news/funding/fuelventa-raises-45k-in-pre-seed-round',
    date: '2026-11-04',
    stage: 'Pre-seed',
    entries: [
      { name: 'Fuelventa', amount: '$44.7K' },
    ],
  },
  {
    file: 'hy_signalbase_zendtrax.md',
    url: 'https://www.trysignalbase.com/news/funding/harthio-raises-2k-in-seed-funding',
    date: '2026-10-25',
    stage: 'Seed / Micro-grant',
    entries: [
      { name: 'Harthio', amount: '$1.5K' },
    ],
  },
  {
    file: 'hy_signalbase_zendtrax.md',
    url: 'https://www.trysignalbase.com/news/funding/hubpharm-africa-raises-30k-to-expand-specialty-pharmacy-access',
    date: '2026-10-25',
    stage: 'Early-stage Funding',
    entries: [
      { name: 'HubPharm Africa', amount: '$30K' },
    ],
  },
  {
    file: 'hy_signalbase_zendtrax.md',
    url: 'https://www.trysignalbase.com/news/funding/teazy-tech-raises-11k-pre',
    date: '2026-10-25',
    stage: 'Pre-seed',
    entries: [
      { name: 'Teazy Tech', amount: '$11.3K' },
    ],
  },
  {
    file: 'hy_as_stellar_cvlabs.md',
    url: 'https://african-startups.com/countries/cote-divoire/three-african-fintech-startups-selected-for-stellar-and-cv-labs-first-accelerator-cohort/',
    date: '2026-08-21',
    stage: 'Stellar x CV Labs Accelerator Cohort 1 (up to $150K XLM)',
    entries: [
      { name: 'Yolat', website: 'https://www.yolat.com/', amount: 'Up to $150K XLM', hq: 'Nigeria' },
    ],
  },
  {
    file: 'hy_da_her_startup.md',
    url: 'https://disruptafrica.com/2026/11/23/her-startup-selects-12-women-led-startups-for-2nd-accelerator-cohort/',
    date: '2026-11-23',
    stage: 'Her Startup 2nd Accelerator Cohort (convertible RBF + FI Morocco)',
    entries: [
      { name: 'Kadosh Mechatronics' },
      { name: 'FriendnPal' },
      { name: 'Glorious Farmgate' },
      { name: 'Fuse Varsity' },
      { name: 'Odnaworld' },
      { name: 'TESA Global Solutions' },
    ],
  },
  {
    file: 'hy_liners_funding.md',
    url: 'https://liners.com/ufarmx',
    date: '2026-11-09',
    stage: 'Pre-Seed (TEDCO)',
    entries: [
      { name: 'UfarmX', amount: '$250,000' },
    ],
  },
  {
    file: 'hy_liners_funding.md',
    url: 'https://liners.com/pharmarun',
    date: '2026-11-07',
    stage: 'Grant (Zenith Bank)',
    entries: [
      { name: 'Pharmarun', amount: 'NGN 15M' },
    ],
  },
  {
    file: 'hy_tc_daily_nov20.md',
    url: 'https://african-startups.com/news/funding/vibe-jungle-raises-400k-to-lower-production-costs-for-african-creators/',
    date: '2026-11-16',
    stage: 'Founder-led Funding Round',
    entries: [
      { name: 'Vibe Jungle Limited', amount: '$400K' },
    ],
  },
  {
    file: 'hy_tc_daily_nov20.md',
    url: 'https://african-startups.com/news/funding/chude-jideonwos-fourthmainland-fund-backs-mediatech-startup-storipod-to-scale-creator-monetisation-across-africa/',
    date: '2026-11-18',
    stage: 'Undisclosed Investment (FourthMainland)',
    entries: [
      { name: 'Storipod' },
    ],
  },
  {
    file: 'hy_tc_daily_nov20.md',
    url: 'https://innovation-village.com/khaime-raises-500000-pre-seed-funding-to-build-the-future-of-ai-powered-commerce/',
    date: '2026-11-19',
    stage: 'Pre-seed (Launch Africa Ventures)',
    entries: [
      { name: 'Khaime', amount: '$500K' },
    ],
  },
  {
    file: 'hy_tc_daily_nov20.md',
    url: 'https://weetracker.com/2026/11/16/protegey-secures-pre-seed-funding-lvlup-ventures/',
    date: '2026-11-16',
    stage: 'Pre-seed (LvlUp Ventures)',
    entries: [
      { name: 'PROTEGEY', hq: 'Verify Nigeria HQ' },
    ],
  },
  {
    file: 'hy_f6s_nigeria_100.md',
    url: 'https://www.f6s.com/companies/nigeria/co',
    date: 'NOT_FOUND',
    stage: 'F6S Recent Nigeria Startup (Founded 2024-2026, verify date/tier)',
    entries: [
      { name: 'Techwheel Africa', amount: '$2.8M', hq: 'Lagos, Nigeria' },
      { name: 'Diamond Bank ($DBNK)', amount: '$1.1M', hq: 'Lagos, Nigeria' },
      { name: 'Swoop', amount: '$250K', hq: 'Lagos, Nigeria' },
      { name: 'Biochar Industrial Group', hq: 'Lagos, Nigeria' },
      { name: 'Pouchers', amount: '$500K', hq: 'Lagos, Nigeria' },
    ],
  },
  {
    file: 'hy_liners_food_ng_2026.md',
    url: 'https://liners.com/research/food-delivery-apps-nigeria-2026',
    date: 'NOT_FOUND',
    stage: 'Active Nigerian Food Delivery App (Sep-Oct 2026 fieldwork; Tier D/funding check)',
    entries: [
      { name: '500Chow' },
      { name: 'Heyfood' },
      { name: 'Foodelo' },
      { name: 'Squaay' },
      { name: 'FoodNaija' },
      { name: 'BukaFinder' },
      { name: 'DownloadChow' },
      { name: 'Dado Food' },
    ],
  },
  {
    file: 'hy_da_west_africa_p1.md',
    url: 'https://disruptafrica.com/2026/11/24/nigerias-onit-brings-structure-trust-to-africas-informal-service-economy/',
    date: 'NOT_FOUND',
    stage: 'Disrupt Africa Nov 24 Launch/Profile (check funding/Tier D)',
    entries: [
      { name: 'OnIt Innovations' },
    ],
  },
  {
    file: 'hy_da_west_africa_p2.md',
    url: 'https://disruptafrica.com/2026/11/19/how-nigerian-startup-peoplepulse-is-helping-smes-digitise-hr-with-ai/',
    date: 'NOT_FOUND',
    stage: 'Disrupt Africa Nov 19 Profile (check funding/Tier D)',
    entries: [
      { name: 'PeoplePulse' },
    ],
  },
  {
    file: 'hy_da_west_africa_p2.md',
    url: 'https://disruptafrica.com/2026/11/17/nigerias-tratum-building-offline-capable-banking-infrastructure-for-physical-economy/',
    date: 'NOT_FOUND',
    stage: 'Disrupt Africa Nov 17 Profile (check funding/Tier D)',
    entries: [
      { name: 'Tratum' },
    ],
  },
  {
    file: 'hy_da_west_africa_p2.md',
    url: 'https://disruptafrica.com/2026/11/11/nigerias-rex-africa-launches-ai-native-bank-with-conversational-financial-agent/',
    date: 'NOT_FOUND',
    stage: 'Disrupt Africa Nov 11 Launch (check funding/Tier D)',
    entries: [
      { name: 'Rex Africa' },
    ],
  },
  {
    file: 'hy_da_west_africa_p3.md',
    url: 'https://disruptafrica.com/2026/11/11/nigerian-agri-tech-startup-bridge-merchant-connects-smallholder-farmers-to-institutional-buyers/',
    date: 'NOT_FOUND',
    stage: 'Disrupt Africa Nov 11 Profile (check funding/Tier D)',
    entries: [
      { name: 'Bridge Merchant' },
    ],
  },
  {
    file: 'hy_da_west_africa_p3.md',
    url: 'https://disruptafrica.com/2026/11/05/nigerias-mytherapist-wants-to-close-the-gap-between-needing-therapy-and-getting-it/',
    date: 'NOT_FOUND',
    stage: 'Disrupt Africa Nov 5 Profile (check funding/Tier D)',
    entries: [
      { name: 'Mytherapist' },
    ],
  },
  {
    file: 'hy_african_startups_cat_nigeria.md',
    url: 'https://african-startups.com/countries/nigeria/lodapoint-launches-truck-hailing-platform-with-over-10000-trucks-engaged/',
    date: 'NOT_FOUND',
    stage: 'African-Startups Nov 20 Launch (check funding/Tier D)',
    entries: [
      { name: 'Lodapoint' },
    ],
  },
  {
    file: 'hy_techpoint_funding.md',
    url: 'https://techpoint.africa/brandpress/helpme-ai-sets-24-november-public-launch-for-unified-ai-transaction-interface/',
    date: 'NOT_FOUND',
    stage: 'Techpoint Nov 24 Launch (check funding/Tier D)',
    entries: [
      { name: 'HelpMe AI Solutions' },
    ],
  },
  {
    file: 'hy_techpoint_funding.md',
    url: 'https://techpoint.africa/brandpress/exploit-forge-launches-strikehound/',
    date: 'NOT_FOUND',
    stage: 'Techpoint Nov 2026 Launch (check funding/Tier D)',
    entries: [
      { name: 'Exploit-Forge Limited' },
    ],
  },
  {
    file: 'hy_techpoint_funding.md',
    url: 'https://techpoint.africa/brandpress/gsubz-expands-from-data-into-china-imports-for-nigerian-smes/',
    date: 'NOT_FOUND',
    stage: 'Techpoint Nov 2026 Expansion (check funding/Tier D)',
    entries: [
      { name: 'Gsubz' },
    ],
  },
];

for (const c of curatedCohorts) {
  if (!fs.existsSync(path.join(dir, c.file))) continue;
  for (const e of c.entries) {
    addCandidate({
      name: e.name,
      website: e.website || 'NOT_FOUND',
      source_url: c.url,
      source_date: c.date,
      evidence_path: `${dir}/${c.file}`,
      stage_hint: c.stage,
      amount_hint: e.amount || '',
      hq_hint: e.hq || 'Nigeria',
    });
  }
}

// 6. Liners Moonshot 2026 Nigerian startups (single + grouped + Nigerian-founded untagged sections)
if (fs.existsSync(path.join(dir, 'hy_liners_moonshot_2026.md'))) {
  const md = fs.readFileSync(path.join(dir, 'hy_liners_moonshot_2026.md'), 'utf8');
  const secParts = md.split(/^###\s+(\d+)\\?\.\s+/m);
  for (let i = 1; i < secParts.length; i += 2) {
    const num = parseInt(secParts[i], 10);
    const block = secParts[i + 1] || '';
    const firstLine = block.split('\n')[0].trim();
    const body = block.split('\n').slice(1).join('\n');

    const countryMatch = firstLine.match(/\(([^)]+)\)/);
    const country = countryMatch ? countryMatch[1].trim() : '';
    const isTaggedNg = NG_TERMS.test(country);
    const isTaggedNonNg = country && !isTaggedNg && NON_NG_COUNTRIES.test(country);
    if (isTaggedNonNg) continue;

    // Also include known Nigerian-founded / TC Battlefield entries without country tag in heading
    const untaggedNg = !country && (NG_TERMS.test(body.slice(0, 500)) || (num >= 73 && num <= 79) || num === 44 || num === 55 || num === 66);
    if (!isTaggedNg && !untaggedNg) continue;

    // Extract external website links in the block (exclude liners.com, assets.liners.com)
    const extLinks: Array<{ label: string; url: string }> = [];
    for (const lm of body.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)) {
      const u = lm[2];
      if (!/liners\.com/i.test(u)) {
        extLinks.push({ label: lm[1].trim(), url: u.replace(/\?utm_source=.*$/i, '') });
      }
    }

    const headingTitle = firstLine.replace(/\s*\([^)]*\).*$/, '').trim();
    // Split grouped headings like "Kolomoni MFB, Mintyn, Sofri and Rex Africa" or "iRecharge and Plug.ng"
    const names = headingTitle
      .split(/\s*,\s*|\s+and\s+/i)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const n of names) {
      const matchedLink = extLinks.find((l) => normName(l.label) === normName(n) || normName(l.label).includes(normName(n)));
      addCandidate({
        name: n,
        website: matchedLink ? matchedLink.url : (names.length === 1 && extLinks[0] ? extLinks[0].url : 'NOT_FOUND'),
        source_url: 'https://liners.com/research/moonshot-2026-african-companies',
        source_date: 'NOT_FOUND',
        evidence_path: `${dir}/hy_liners_moonshot_2026.md`,
        stage_hint: 'Moonshot 2026 Exhibitor/Startup (verify funding/launch)',
        hq_hint: country || 'Nigeria',
      });
    }
  }
}

// 7. Headline extractor across ALL hy_* category feeds + search*.json
const DEAL_VERB = /\b(raises|raised|secures|secured|closes|closed|lands|landed|gets|wins|won|receives|received|bags|nabs|announces|attracts|picks|backs|backed|invests in)\b/i;

function extractFromHeadline(title: string, desc: string, url: string, dateHint: string, evPath: string) {
  const text = `${title} ${desc}`;
  if (!NG_TERMS.test(text) && !/african-startups\.com\/countries\/nigeria|startuplist\.africa/i.test(url)) return;
  if (/^(South Africa|Kenya|Egypt|Ghana|Morocco|Tunisia|Rwanda|Uganda|Senegal|Ethiopia|Tanzania|Italian|Egyptian|UK|US|French|German)\b/i.test(title)) return;
  if (!DEAL_VERB.test(title)) return;

  // Strip "After X, " prefix if present
  const cleanTitle = title.replace(/^After\s+[A-Za-z0-9.&'’\- ]+,\s+/i, '');

  // Pattern 1: "<Name> raises/secures/closes/lands/gets/wins ..."
  let m = cleanTitle.match(/^([A-Z0-9][A-Za-z0-9.&'’\- ]{1,40}?)\s+(?:raises|secures|closes|lands|gets|wins|receives|bags|nabs|extends|hits|launches)\b/);
  if (m) {
    addCandidate({
      name: m[1],
      website: 'NOT_FOUND',
      source_url: url,
      source_date: dateHint,
      evidence_path: evPath,
      stage_hint: title,
      hq_hint: 'Nigeria',
    });
    return;
  }
  // Pattern 2: "Nigeria's <Name>[, description,] raises/secures..."
  m = cleanTitle.match(/(?:Nigeria[’']s|Nigerian\s+\w+(?:\s+\w+)?|Lagos-based\s+\w+(?:\s+\w+)?)\s+([A-Z0-9][A-Za-z0-9.&'’\- ]{1,35}?)(?:,\s+[^,]{3,60},)?\s+(?:raises|secures|closes|lands|gets|wins|receives|bags|nabs|extends)\b/);
  if (m) {
    addCandidate({
      name: m[1],
      website: 'NOT_FOUND',
      source_url: url,
      source_date: dateHint,
      evidence_path: evPath,
      stage_hint: title,
      hq_hint: 'Nigeria',
    });
    return;
  }
  // Pattern 3: "<Investor> backs/invests in <Name> ..."
  m = cleanTitle.match(/(?:backs|invests in)\s+(?:Nigeria[’']s\s+|Nigerian\s+\w+\s+)?([A-Z0-9][A-Za-z0-9.&'’\- ]{1,35}?)(?:\s+to\b|\s+in\b|\s+for\b|\s+with\b|,|$)/);
  if (m) {
    addCandidate({
      name: m[1],
      website: 'NOT_FOUND',
      source_url: url,
      source_date: dateHint,
      evidence_path: evPath,
      stage_hint: title,
      hq_hint: 'Nigeria',
    });
  }
}

for (const f of files) {
  if (f.startsWith('hy_') && f.endsWith('.md') && !f.startsWith('hy_sl_') && f !== 'hy_tc_daily_nov20.md' && f !== 'hy_liners_funding.md') {
    const md = fs.readFileSync(path.join(dir, f), 'utf8');
    const linkMatches = md.matchAll(/\[([^\]]{10,160})\]\((https?:\/\/[^)]+)\)/g);
    for (const lm of linkMatches) {
      const anchor = lm[1].replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
      const linkUrl = lm[2];
      if (/facebook\.com\/sharer|twitter\.com\/intent|linkedin\.com\/share|wa\.me|whatsapp\.com|mailto:|translate\.google/i.test(linkUrl)) continue;
      const idx = lm.index || 0;
      const ctx = md.slice(Math.max(0, idx - 100), Math.min(md.length, idx + lm[0].length + 200));
      const dateMatch = ctx.match(/(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+2026|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s+2026|2026-\d{2}-\d{2}/i);
      const urlDateMatch = linkUrl.match(/\/(2026)\/(\d{2})\/(\d{2})\//);
      const inferredDate = dateMatch ? dateMatch[0] : (urlDateMatch ? `${urlDateMatch[1]}-${urlDateMatch[2]}-${urlDateMatch[3]}` : 'NOT_FOUND');
      extractFromHeadline(anchor, ctx, linkUrl, inferredDate, `${dir}/${f}`);
    }
  } else if (f.startsWith('search') && f.endsWith('.json')) {
    const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const w of d?.data?.web || []) {
      const url = w.url || '';
      if (!url || url.includes('google.com/goto')) continue;
      const dateMatch = (w.description || '').match(/(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+2026|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*,?\s+2026/i);
      extractFromHeadline(w.title || '', w.description || '', url, dateMatch ? dateMatch[0] : 'NOT_FOUND', `${dir}/${f}`);
    }
  }
}

// 8. F6S Nigeria directory cards (hy_f6s_*.md)
for (const f of files) {
  if (!f.startsWith('hy_f6s_') || !f.endsWith('.md')) continue;
  const md = fs.readFileSync(path.join(dir, f), 'utf8');
  const cards = md.split(/^## \[/m).slice(1);
  for (const card of cards) {
    const firstLineEnd = card.indexOf('\n');
    const head = firstLineEnd === -1 ? card : card.slice(0, firstLineEnd);
    const body = firstLineEnd === -1 ? '' : card.slice(firstLineEnd + 1);
    const titleMatch = head.match(/^([^\]]+)\]\((https:\/\/www\.f6s\.com\/company\/[^)]+)\)/);
    if (!titleMatch) continue;
    const rawName = titleMatch[1].trim();
    const f6sUrl = titleMatch[2].trim();

    const locMatch = body.match(/^([A-Za-z .\-']+,\s*Nigeria)\s*$/m);
    if (!locMatch) continue;
    const hq = locMatch[1].trim();

    const foundedMatch = body.match(/^Founded\s+(\d{4})\s*$/m);
    const foundedYear = foundedMatch ? parseInt(foundedMatch[1], 10) : 0;

    const raisedMatch = body.match(/^([^\n]*?\braised from\b[^\n]*)$/m);
    let amountHint = '';
    if (raisedMatch) {
      const amtM = raisedMatch[1].match(/^(\$[\d.,]+[kmb]?|₦[\d.,]+[kmb]?)/i);
      if (amtM) amountHint = amtM[1];
    }

    // Keep Founded 2025/2026 OR Founded 2024 with recorded funding
    if (foundedYear >= 2025 || (foundedYear === 2024 && !!raisedMatch)) {
      addCandidate({
        name: rawName,
        website: 'NOT_FOUND',
        source_url: f6sUrl,
        source_date: 'NOT_FOUND',
        evidence_path: `${dir}/${f}`,
        stage_hint: `F6S Nigeria (Founded ${foundedYear}${raisedMatch ? '; funded' : ''})`,
        amount_hint: amountHint,
        hq_hint: hq,
      });
    }
  }
}

const allList = [...map.values()];
const inWindow = allList
  .filter((c) => c.source_date >= '2026-07-01' && c.source_date <= '2026-11-24')
  .sort((a, b) => b.source_date.localeCompare(a.source_date));
const notFoundRecent = allList
  .filter((c) => c.source_date === 'NOT_FOUND')
  .sort((a, b) => a.name.localeCompare(b.name));
const h1_2026 = allList
  .filter((c) => c.source_date >= '2026-01-01' && c.source_date < '2026-07-01')
  .sort((a, b) => b.source_date.localeCompare(a.source_date));
const older = allList
  .filter((c) => c.source_date !== 'NOT_FOUND' && c.source_date < '2026-01-01')
  .sort((a, b) => b.source_date.localeCompare(a.source_date));

// Export all non-pre-2026 candidates (or include H1 2026 after inWindow & notFoundRecent)
// Keep pre-2026 out of candidates_raw.csv unless count < 320
const exportList = [...inWindow, ...notFoundRecent, ...h1_2026];

function csvCell(v: string): string {
  const s = (v ?? '').replace(/\r?\n/g, ' ').trim();
  if (/[",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const csvLines = ['name,website,source_url,source_date'];
for (const c of exportList) {
  csvLines.push([c.name, c.website, c.source_url, c.source_date].map(csvCell).join(','));
}
fs.writeFileSync('candidates_raw.csv', csvLines.join('\n') + '\n', 'utf8');
fs.writeFileSync('evidence/phase1/candidates_raw.json', JSON.stringify(exportList, null, 2), 'utf8');
fs.writeFileSync('evidence/phase1/candidates_parsed_preview.json', JSON.stringify(allList, null, 2), 'utf8');

console.log(`Total unique Nigerian candidates parsed: ${allList.length}`);
console.log(`- In-window (2026-07-01..2026-11-24): ${inWindow.length}`);
console.log(`- Recent/F6S/Moonshot NOT_FOUND dates (verify in Phase 2): ${notFoundRecent.length}`);
console.log(`- H1 2026 (2026-01-01..2026-06-30): ${h1_2026.length}`);
console.log(`- Excluded pre-2026: ${older.length}`);
console.log(`Exported to candidates_raw.csv: ${exportList.length} rows`);

