// Pure core for social-security-cola-2027-mcp. Every number is copied from the SSA "Cost-of-Living Increase and
// Other Determinations" notices in the Federal Register and from 20 CFR 404 (eCFR), fetched 2026-11-05.
// The only I/O is one optional keyless read of the Federal Register API to spot a newer notice.
import type { FetchText } from './types.js';

export const REPO = 'social-security-cola-2027-mcp';
export const SITE = 'https://www.mcpstamp.com';
export const UTM = `utm_source=mcp&utm_medium=${REPO}`;
export const AS_OF = '2026-11-05';
export const more = () => `${SITE}/servers/?${UTM}`;
export const FR_DOC = (d: string) => `https://www.federalregister.gov/d/${d}`;
export const CFR = (s: string) => `https://www.ecfr.gov/current/title-20/chapter-III/part-404/section-${s}`;
export const FR_API =
  'https://www.federalregister.gov/api/v1/documents.json?conditions%5Bterm%5D=%22Cost-of-Living+Increase+and+Other+Determinations%22' +
  '&conditions%5Bagencies%5D%5B%5D=social-security-administration&order=newest&per_page=20' +
  '&fields%5B%5D=title&fields%5B%5D=abstract&fields%5B%5D=publication_date&fields%5B%5D=html_url&fields%5B%5D=document_number';

export class InputError extends Error {}
export class UpstreamError extends Error {}

/**
 * COLA by the year it is first paid. Key Y = increase effective for December of Y-1, paid from January Y.
 * [percent, Federal Register document number, publication date].
 */
export const COLA: Record<number, [number, string, string]> = {
  1996: [2.6, '95-26426', '1995-10-25'], 1997: [2.9, '96-27414', '1996-10-25'], 1998: [2.1, '97-28496', '1997-10-30'],
  1999: [1.3, '98-28988', '1998-10-30'], 2000: [2.4, '99-27865', '1999-10-25'], 2001: [3.5, '00-27249', '2000-10-24'],
  2002: [2.6, '01-26911', '2001-10-25'], 2003: [1.4, '02-27203', '2002-10-25'], 2004: [2.1, '03-26642', '2003-10-22'],
  2005: [2.7, '04-23915', '2004-10-26'], 2006: [4.1, '05-21272', '2005-10-25'], 2007: [3.3, 'E6-17939', '2006-10-26'],
  2008: [2.3, 'E7-21070', '2007-10-25'], 2009: [5.8, 'E8-25905', '2008-10-30'], 2010: [0, 'E9-25930', '2009-10-28'],
  2011: [0, '2010-26983', '2010-10-26'], 2012: [3.6, '2011-27496', '2011-10-25'], 2013: [1.7, '2012-26663', '2012-10-30'],
  2014: [1.5, '2013-26569', '2013-11-05'], 2015: [1.7, '2014-25802', '2014-10-29'], 2016: [0, '2015-27828', '2015-10-30'],
  2017: [0.3, '2016-26026', '2016-10-27'], 2018: [2.0, '2017-27105', '2017-12-15'], 2019: [2.8, '2018-23193', '2018-10-24'],
  2020: [1.6, '2019-22921', '2019-10-22'], 2021: [1.3, '2020-23442', '2020-10-22'], 2022: [5.9, '2021-23031', '2021-10-22'],
  2023: [8.7, '2022-23073', '2022-10-24'], 2024: [3.2, '2023-23317', '2023-10-23'], 2025: [2.5, '2024-24871', '2024-10-25'],
  2026: [2.8, '2025-19763', '2025-11-03'], 2027: [3.6, '2026-21796', '2026-10-26'],
};
export const LATEST = Math.max(...Object.keys(COLA).map(Number));

/** OASDI contribution and benefit base (maximum taxable earnings) by year, from the same notices. */
export const WAGE_BASE: Record<number, number> = {
  1996: 62700, 1997: 65400, 1998: 68400, 1999: 72600, 2000: 76200, 2001: 80400, 2002: 84900, 2003: 87000, 2004: 87900,
  2005: 90000, 2006: 94200, 2007: 97500, 2008: 102000, 2009: 106800, 2010: 106800, 2011: 106800, 2012: 110100,
  2013: 113700, 2014: 117000, 2015: 118500, 2016: 118500, 2017: 127200, 2018: 128400, 2019: 132900, 2020: 137700,
  2021: 142800, 2022: 147000, 2023: 160200, 2024: 168600, 2025: 176100, 2026: 184500, 2027: 192300,
};

export interface YearLimits {
  wage_base: number; earnings_test_monthly_under_fra: number; earnings_test_monthly_fra_year: number; quarter_of_coverage: number;
  sga_monthly_non_blind: number; sga_monthly_blind: number; trial_work_month: number; ssi_individual: number; ssi_couple: number;
  pia_bend_points: [number, number]; awi: [number, number];
}
/** Program amounts 2023 to 2027, read from the notice for each year. */
export const LIMITS: Record<number, YearLimits> = {
  2023: { wage_base: 160200, earnings_test_monthly_under_fra: 1770, earnings_test_monthly_fra_year: 4710, quarter_of_coverage: 1640, sga_monthly_non_blind: 1470, sga_monthly_blind: 2460, trial_work_month: 1050, ssi_individual: 914, ssi_couple: 1371, pia_bend_points: [1115, 6721], awi: [2021, 60575.07] },
  2024: { wage_base: 168600, earnings_test_monthly_under_fra: 1860, earnings_test_monthly_fra_year: 4960, quarter_of_coverage: 1730, sga_monthly_non_blind: 1550, sga_monthly_blind: 2590, trial_work_month: 1110, ssi_individual: 943, ssi_couple: 1415, pia_bend_points: [1174, 7078], awi: [2022, 63795.13] },
  2025: { wage_base: 176100, earnings_test_monthly_under_fra: 1950, earnings_test_monthly_fra_year: 5180, quarter_of_coverage: 1810, sga_monthly_non_blind: 1620, sga_monthly_blind: 2700, trial_work_month: 1160, ssi_individual: 967, ssi_couple: 1450, pia_bend_points: [1226, 7391], awi: [2023, 66621.80] },
  2026: { wage_base: 184500, earnings_test_monthly_under_fra: 2040, earnings_test_monthly_fra_year: 5430, quarter_of_coverage: 1890, sga_monthly_non_blind: 1690, sga_monthly_blind: 2830, trial_work_month: 1210, ssi_individual: 994, ssi_couple: 1491, pia_bend_points: [1286, 7749], awi: [2024, 69846.57] },
  2027: { wage_base: 192300, earnings_test_monthly_under_fra: 2130, earnings_test_monthly_fra_year: 5660, quarter_of_coverage: 1970, sga_monthly_non_blind: 1770, sga_monthly_blind: 2950, trial_work_month: 1270, ssi_individual: 1029, ssi_couple: 1544, pia_bend_points: [1340, 8077], awi: [2025, 72800.33] },
};

const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
/** Round down to the next lower multiple of 10 cents, working in cents to avoid float drift. */
export const floorDime = (n: number) => Math.floor(Math.round(n * 1000) / 100 + 1e-9) / 10;
/** Round up to the next higher multiple of 10 cents. */
export const ceilDime = (n: number) => Math.ceil(Math.round(n * 1000) / 100 - 1e-9) / 10;

function checkYear(y: number | undefined, table: Record<number, unknown>, what: string): number {
  const year = y ?? LATEST;
  if (!table[year]) {
    const ks = Object.keys(table).map(Number);
    throw new InputError(`No ${what} for ${year}. This server has ${Math.min(...ks)} to ${Math.max(...ks)}.`);
  }
  return year;
}

// ---------------------------------------------------------------- COLA

export function colaRow(year: number) {
  const [pct, doc, date] = COLA[year];
  return { payable_year: year, cola_percent: pct, effective: `December ${year - 1} benefits, paid in January ${year}`, federal_register_doc: doc, published: date, source: FR_DOC(doc) };
}

export function parseNotice(json: string): { year: number; cola_percent: number | null; title: string; url: string; published: string } | null {
  let j: any;
  try { j = JSON.parse(json); } catch { throw new UpstreamError('the Federal Register API returned a response that is not JSON'); }
  const r = (j.results ?? []).find((x: any) => /Cost-of-Living Increase and Other Determinations/i.test(x.title ?? '') && !/Correction/i.test(x.title ?? ''));
  if (!r) return null;
  const year = Number((String(r.title).match(/(\d{4})(?!.*\d{4})/) ?? [])[1]);
  const m = String(r.abstract ?? '').match(/(?:a|an) ([\d.]+) percent cost-of-living increase/);
  const none = /no cost-of-living increase/i.test(String(r.abstract ?? ''));
  return { year, cola_percent: m ? Number(m[1]) : none ? 0 : null, title: r.title, url: r.html_url, published: r.publication_date };
}

export async function getSocialSecurityCola(fetchText: FetchText | null, a: { year?: number; history_years?: number }) {
  const year = checkYear(a.year, COLA, 'COLA');
  const row = colaRow(year);
  const n = Math.min(Math.max(a.history_years ?? 10, 0), Object.keys(COLA).length);
  const history = Object.keys(COLA).map(Number).sort((x, y) => y - x).slice(0, n).map((y) => ({ payable_year: y, cola_percent: COLA[y][0] }));
  let newer: ReturnType<typeof parseNotice> = null;
  let live_check = 'skipped';
  if (fetchText && a.year === undefined) {
    try {
      const notice = parseNotice(await fetchText(FR_API, { cacheTtl: 21600, timeoutMs: 12000 }));
      live_check = notice ? `newest Federal Register notice is for ${notice.year}` : 'no notice found';
      if (notice && notice.year > LATEST) newer = notice;
    } catch (e) {
      live_check = `Federal Register check failed (${(e as Error).message}); built-in table used`;
    }
  }
  const summary = newer
    ? `A newer notice exists. The Federal Register notice "${newer.title}" (${newer.published}) gives a ${newer.cola_percent ?? 'see notice'} percent COLA, paid from January ${newer.year}. ` +
      `The built-in table ends with the ${LATEST} COLA of ${COLA[LATEST][0]} percent.`
    : `The Social Security cost-of-living adjustment paid from January ${year} is ${row.cola_percent} percent. It applies to December ${year - 1} benefits and to SSI payments for January ${year}. ` +
      `SSA published it in the Federal Register on ${row.published} (document ${row.federal_register_doc}).`;
  return {
    summary,
    ...row,
    newer_notice: newer,
    live_check,
    history,
    note: 'SSA bases the COLA on the rise in the average CPI-W from the third quarter of the last COLA year to the third quarter of the current year, rounded to 0.1 percent. People first eligible (age 62, disability or death) in the payable year do not get that year\'s COLA.',
    as_of: AS_OF,
    more: more(),
  };
}

export function calculateColaIncrease(a: { monthly_benefit: number; year?: number }) {
  const year = checkYear(a.year, COLA, 'COLA');
  if (!(a.monthly_benefit > 0 && a.monthly_benefit < 100000)) throw new InputError('monthly_benefit must be a positive dollar amount, for example 1976.');
  const pct = COLA[year][0];
  const raised = floorDime(a.monthly_benefit * (1 + pct / 100));
  const dollars = Math.floor(raised + 1e-9);
  return {
    summary: `A ${usd(a.monthly_benefit)} monthly benefit with the ${pct} percent COLA paid from January ${year} becomes about ${usd(raised)} before any Medicare premium, or ${usd(dollars)} after SSA rounds the payment down to the whole dollar. That is about ${usd(round2(raised - a.monthly_benefit))} more a month.`,
    payable_year: year,
    cola_percent: pct,
    old_monthly_benefit: a.monthly_benefit,
    new_monthly_benefit_before_rounding_to_dollar: raised,
    new_monthly_payment_rounded_down: dollars,
    monthly_increase: round2(raised - a.monthly_benefit),
    annual_increase: round2((raised - a.monthly_benefit) * 12),
    method: 'SSA applies the COLA to the primary insurance amount and rounds down to the next lower 10 cents, then deducts any Medicare Part B premium and rounds the payment down to the whole dollar. Starting from a net payment, this result is an estimate within about a dollar.',
    as_of: AS_OF,
    source: FR_DOC(COLA[year][1]),
    more: more(),
  };
}

// ---------------------------------------------------------------- dates and full retirement age

interface YMD { y: number; m: number; d: number }
export function parseDate(s: string): YMD {
  const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!mt) throw new InputError(`"${s}" is not a date. Use YYYY-MM-DD, for example 1960-07-15.`);
  const [y, m, d] = [Number(mt[1]), Number(mt[2]), Number(mt[3])];
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) throw new InputError(`"${s}" is not a real calendar date.`);
  if (y < 1900 || y > 2030) throw new InputError('Birth year must be between 1900 and 2030.');
  return { y, m, d };
}
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const monthKey = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`;
const monthIndex = (y: number, m: number) => y * 12 + (m - 1);
const fromIndex = (i: number) => monthKey(Math.floor(i / 12), (i % 12) + 1);

/**
 * The date a person attains an age of `years` and `months`. 20 CFR 404.102: you reach an age on the day before
 * your birthday. Days past the end of a short month are clamped to its last day.
 */
export function attainDate(b: YMD, years: number, months: number): { date: string; y: number; m: number; d: number } {
  const idx = monthIndex(b.y + years, b.m) + months;
  const y = Math.floor(idx / 12), m = (idx % 12) + 1;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const t = Date.UTC(y, m - 1, Math.min(b.d, last)) - 86400000;
  const dt = new Date(t);
  return { date: iso(t), y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

/** Birth-year cohort used by the 20 CFR 404.409 tables: a January 1 birthday belongs to the year before. */
export const cohortYear = (b: YMD) => (b.m === 1 && b.d === 1 ? b.y - 1 : b.y);

/** 20 CFR 404.409(a): full retirement age for retirement and spouse benefits, as [years, months]. */
export function fraFor(cohort: number): [number, number] {
  if (cohort < 1938) return [65, 0];
  if (cohort <= 1942) return [65, (cohort - 1937) * 2];
  if (cohort <= 1954) return [66, 0];
  if (cohort <= 1959) return [66, (cohort - 1954) * 2];
  return [67, 0];
}
/** 20 CFR 404.409(b): full retirement age for widow's and widower's benefits. */
export function survivorFraFor(cohort: number): [number, number] {
  if (cohort < 1912) return [62, 0];
  if (cohort <= 1939) return [65, 0];
  if (cohort <= 1944) return [65, (cohort - 1939) * 2];
  if (cohort <= 1956) return [66, 0];
  if (cohort <= 1961) return [66, (cohort - 1956) * 2];
  return [67, 0];
}
/** 20 CFR 404.313(b)(2): delayed retirement credit per month, in percent. */
export function drcPerMonth(cohort: number): number {
  const t: [number, number][] = [[1916, 1 / 12], [1924, 1 / 4], [1926, 7 / 24], [1928, 1 / 3], [1930, 3 / 8], [1932, 5 / 12], [1934, 11 / 24], [1936, 1 / 2], [1938, 13 / 24], [1940, 7 / 12], [1942, 5 / 8]];
  for (const [upto, v] of t) if (cohort <= upto) return v;
  return 2 / 3;
}
/** 20 CFR 404.410(a): reduction in percent for n months of entitlement before full retirement age. */
export const retirementReductionPct = (n: number) => (Math.min(n, 36) * 5) / 9 + (Math.max(n - 36, 0) * 5) / 12;
/** 20 CFR 404.410(b): spouse benefit reduction in percent. */
export const spouseReductionPct = (n: number) => (Math.min(n, 36) * 25) / 36 + (Math.max(n - 36, 0) * 5) / 12;
const pct = (n: number) => Math.round(n * 1000) / 1000;
const fmtAge = ([y, m]: [number, number]) => (m ? `${y} and ${m} months` : `${y}`);

/** First month of entitlement at 62: 20 CFR 404.311(a)(2) needs age 62 throughout the month. */
export function firstMonthAt62(b: YMD): string {
  const a = attainDate(b, 62, 0);
  return a.d === 1 ? monthKey(a.y, a.m) : fromIndex(monthIndex(a.y, a.m) + 1);
}

export function getFullRetirementAge(a: { birth_date: string }) {
  const b = parseDate(a.birth_date);
  const c = cohortYear(b);
  const fra = fraFor(c);
  const fraAt = attainDate(b, fra[0], fra[1]);
  const fraMonth = monthKey(fraAt.y, fraAt.m);
  const first62 = firstMonthAt62(b);
  const [fy, fm] = first62.split('-').map(Number);
  const early = monthIndex(fraAt.y, fraAt.m) - monthIndex(fy, fm);
  const at70 = attainDate(b, 70, 0);
  const drcMonths = monthIndex(at70.y, at70.m) - monthIndex(fraAt.y, fraAt.m);
  const red = retirementReductionPct(early);
  const sred = spouseReductionPct(early);
  const surv = survivorFraFor(c);
  const drc = drcPerMonth(c);
  return {
    summary:
      `Born ${a.birth_date}: full retirement age is ${fmtAge(fra)}, reached on ${fraAt.date}, so unreduced retirement benefits start with ${fraMonth}. ` +
      `The earliest retirement benefit month is ${first62}, ${early} months early, which cuts the benefit by ${pct(red)} percent to ${pct(100 - red)} percent of the full amount. ` +
      `Waiting past full retirement age adds ${pct(drc)} percent a month, up to ${pct(drc * drcMonths)} percent at age 70 (${monthKey(at70.y, at70.m)}).`,
    birth_date: a.birth_date,
    birth_year_for_rules: c,
    january_1_rule: b.m === 1 && b.d === 1 ? 'Born on January 1, so SSA uses the rules for the year before.' : null,
    full_retirement_age: { years: fra[0], months: fra[1], label: fmtAge(fra) },
    full_retirement_age_date: fraAt.date,
    full_retirement_age_month: fraMonth,
    age_62_date: attainDate(b, 62, 0).date,
    earliest_retirement_benefit_month: first62,
    months_early_at_earliest: early,
    reduction_at_earliest_percent: pct(red),
    benefit_at_earliest_percent_of_pia: pct(100 - red),
    spouse_benefit_at_earliest_percent_of_worker_pia: pct(50 * (1 - sred / 100)),
    delayed_credit_per_month_percent: pct(drc),
    delayed_credit_per_year_percent: pct(drc * 12),
    age_70_month: monthKey(at70.y, at70.m),
    benefit_at_70_percent_of_pia: pct(100 + drc * drcMonths),
    survivor_full_retirement_age: { years: surv[0], months: surv[1], label: fmtAge(surv) },
    rules: 'You reach an age on the day before your birthday (20 CFR 404.102). Before full retirement age you must be 62 for the whole month (404.311), so people born on the 1st or 2nd can start in their birthday month and others start the month after. Reduction is 5/9 of 1 percent a month for the first 36 months and 5/12 of 1 percent for each further month (404.410).',
    as_of: AS_OF,
    source: CFR('404.409'),
    more: more(),
  };
}

export function calculateClaimingAgeBenefit(a: { birth_date: string; pia: number; claim_age_years: number; claim_age_months?: number }) {
  const b = parseDate(a.birth_date);
  if (!(a.pia > 0 && a.pia < 20000)) throw new InputError('pia must be the monthly benefit at full retirement age in dollars, for example 2000.');
  const cm = a.claim_age_months ?? 0;
  if (!Number.isInteger(a.claim_age_years) || a.claim_age_years < 62 || a.claim_age_years > 70 || !Number.isInteger(cm) || cm < 0 || cm > 11 || (a.claim_age_years === 70 && cm > 0)) {
    throw new InputError('Claiming age must be 62 years 0 months to 70 years 0 months.');
  }
  const c = cohortYear(b);
  const fra = fraFor(c);
  const fraAt = attainDate(b, fra[0], fra[1]);
  const fraIdx = monthIndex(fraAt.y, fraAt.m);
  let claimMonth: string;
  if (a.claim_age_years === 62 && cm === 0) claimMonth = firstMonthAt62(b);
  else { const t = attainDate(b, a.claim_age_years, cm); claimMonth = monthKey(t.y, t.m); }
  const [cy, cmo] = claimMonth.split('-').map(Number);
  const cIdx = monthIndex(cy, cmo);
  const at70 = attainDate(b, 70, 0);
  let monthly: number, change: number, kind: string, months: number, changePct: number;
  if (cIdx < fraIdx) {
    months = fraIdx - cIdx; changePct = -retirementReductionPct(months);
    const cut = ceilDime((a.pia * retirementReductionPct(months)) / 100);
    monthly = round2(a.pia - cut); change = -cut; kind = 'early';
  } else {
    months = Math.min(cIdx, monthIndex(at70.y, at70.m)) - fraIdx; changePct = drcPerMonth(c) * months;
    const add = floorDime((a.pia * changePct) / 100);
    monthly = round2(a.pia + add); change = add; kind = months ? 'delayed' : 'full';
  }
  const label = `${a.claim_age_years}${cm ? ` and ${cm} months` : ''}`;
  return {
    summary:
      kind === 'full' ? `Claiming at ${label} (${claimMonth}) is at full retirement age, so the benefit is the full ${usd(a.pia)}.`
        : kind === 'early' ? `Claiming at ${label} (first month ${claimMonth}) is ${months} months before full retirement age (${fmtAge(fra)}). The ${usd(a.pia)} benefit is cut by ${pct(-changePct)} percent, ${usd(-change)}, to ${usd(monthly)} a month for life, before COLAs.`
          : `Claiming at ${label} (${claimMonth}) is ${months} months after full retirement age (${fmtAge(fra)}). Delayed credits add ${pct(changePct)} percent, ${usd(change)}, for ${usd(monthly)} a month, before COLAs.`,
    birth_date: a.birth_date,
    pia: a.pia,
    full_retirement_age: fmtAge(fra),
    full_retirement_age_month: monthKey(fraAt.y, fraAt.m),
    claim_month: claimMonth,
    timing: kind,
    months_from_full_retirement_age: kind === 'early' ? -months : months,
    change_percent: pct(changePct),
    monthly_change: change,
    monthly_benefit: monthly,
    rounding: 'Reduction rounded up to the next 10 cents and delayed-credit increase rounded down to the next 10 cents, as in 20 CFR 404.410 and 404.313. SSA then deducts any Medicare premium and rounds the payment down to the whole dollar.',
    caveats: 'Delayed credits earned before the year you turn 70 are added in January of the next year. The earnings test can withhold benefits before full retirement age. Ages are in whole months.',
    as_of: AS_OF,
    source: kind === 'early' ? CFR('404.410') : CFR('404.313'),
    more: more(),
  };
}

// ---------------------------------------------------------------- yearly limits and earnings test

export function getSocialSecurityLimits(a: { year?: number }) {
  const year = checkYear(a.year, LIMITS, 'program amounts');
  const L = LIMITS[year];
  return {
    summary:
      `Social Security amounts for ${year}: maximum taxable earnings ${usd(L.wage_base)}; earnings test limit ${usd(L.earnings_test_monthly_under_fra * 12)} a year (${usd(L.earnings_test_monthly_under_fra)} a month) under full retirement age and ` +
      `${usd(L.earnings_test_monthly_fra_year * 12)} in the year you reach it; one work credit per ${usd(L.quarter_of_coverage)} of earnings; SGA ${usd(L.sga_monthly_non_blind)} a month (${usd(L.sga_monthly_blind)} if blind); ` +
      `maximum federal SSI ${usd(L.ssi_individual)} individual and ${usd(L.ssi_couple)} couple; COLA ${COLA[year][0]} percent.`,
    year,
    cola_percent: COLA[year][0],
    maximum_taxable_earnings: L.wage_base,
    earnings_test: {
      under_full_retirement_age: { annual: L.earnings_test_monthly_under_fra * 12, monthly: L.earnings_test_monthly_under_fra, withholding: '$1 for every $2 above the limit' },
      year_you_reach_full_retirement_age: { annual: L.earnings_test_monthly_fra_year * 12, monthly: L.earnings_test_monthly_fra_year, withholding: '$1 for every $3 above the limit, counting only earnings before the month you reach full retirement age' },
    },
    quarter_of_coverage: L.quarter_of_coverage,
    max_credits_earnings: L.quarter_of_coverage * 4,
    substantial_gainful_activity_monthly: { non_blind: L.sga_monthly_non_blind, blind: L.sga_monthly_blind },
    trial_work_period_month: L.trial_work_month,
    ssi_federal_monthly_max: { individual: L.ssi_individual, couple: L.ssi_couple },
    pia_bend_points: L.pia_bend_points,
    pia_formula: `90% of the first ${usd(L.pia_bend_points[0])} of AIME, 32% of AIME from ${usd(L.pia_bend_points[0])} to ${usd(L.pia_bend_points[1])}, 15% above ${usd(L.pia_bend_points[1])} (for people first eligible in ${year})`,
    national_average_wage_index: { year: L.awi[0], value: L.awi[1] },
    as_of: AS_OF,
    source: FR_DOC(COLA[year][1]),
    more: more(),
  };
}

export function calculateEarningsTest(a: { year?: number; annual_earnings: number; reaches_full_retirement_age_this_year?: boolean; monthly_benefit?: number }) {
  const year = checkYear(a.year, LIMITS, 'earnings test amounts');
  if (!(a.annual_earnings >= 0 && a.annual_earnings < 1e8)) throw new InputError('annual_earnings must be zero or a positive dollar amount.');
  const L = LIMITS[year];
  const fraYear = !!a.reaches_full_retirement_age_this_year;
  const limit = (fraYear ? L.earnings_test_monthly_fra_year : L.earnings_test_monthly_under_fra) * 12;
  const over = Math.max(0, a.annual_earnings - limit);
  const withheld = round2(over / (fraYear ? 3 : 2));
  const monthsWithheld = a.monthly_benefit && a.monthly_benefit > 0 ? Math.min(12, Math.ceil(withheld / a.monthly_benefit - 1e-9)) : null;
  return {
    summary: over === 0
      ? `${usd(a.annual_earnings)} is within the ${year} earnings test limit of ${usd(limit)}${fraYear ? ' for the year you reach full retirement age' : ''}. No benefits are withheld.`
      : `${usd(a.annual_earnings)} is ${usd(over)} over the ${year} limit of ${usd(limit)}. SSA withholds $1 for every $${fraYear ? 3 : 2} over, so ${usd(withheld)} of benefits for ${year}` +
        `${monthsWithheld !== null ? `, about ${monthsWithheld} months of a ${usd(a.monthly_benefit!)} benefit` : ''}. Withheld benefits are not lost; SSA raises the benefit at full retirement age to credit the months withheld.`,
    year,
    annual_earnings: a.annual_earnings,
    limit,
    rule: fraYear ? 'year you reach full retirement age: $1 withheld for every $3 above the limit, counting only earnings before that month' : 'under full retirement age all year: $1 withheld for every $2 above the limit',
    amount_over: over,
    benefits_withheld: withheld,
    months_fully_withheld: monthsWithheld,
    note: 'The test stops applying from the month you reach full retirement age. In the first year of retirement a monthly limit can also apply to months you do not work.',
    as_of: AS_OF,
    source: FR_DOC(COLA[year][1]),
    more: more(),
  };
}
