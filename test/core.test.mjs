// Fixtures: values copied from the SSA "Cost-of-Living Increase and Other Determinations" notices in the Federal Register
// (fetched 2026-11-05), the worked examples in 20 CFR 404.410(a) and 404.313(b), and hand-checked date arithmetic.
// test/fixtures/fr-latest.json is a trimmed Federal Register API response saved 2026-11-05; fr-synthetic-2028.json is a
// hand-made response that stands in for a future notice.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import {
  COLA, LATEST, WAGE_BASE, LIMITS, fraFor, survivorFraFor, drcPerMonth, retirementReductionPct, attainDate, parseDate, floorDime, ceilDime,
  getSocialSecurityCola, calculateColaIncrease, getFullRetirementAge, calculateClaimingAgeBenefit, getSocialSecurityLimits, calculateEarningsTest,
  parseNotice, InputError, UTM,
} from '../dist/core.js';

const fx = (n) => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8');

test('2027 COLA is 3.6 percent from FR doc 2026-21796, latest year 2027', () => {
  assert.equal(LATEST, 2027); assert.deepEqual(COLA[2027], [3.6, '2026-21796', '2026-10-26']);
});
test('COLA history from the notices: 2023 8.7, 2022 5.9, 2016 0, 2010 0, 2009 5.8, 1997 2.9', () => {
  assert.equal(COLA[2023][0], 8.7); assert.equal(COLA[2022][0], 5.9); assert.equal(COLA[2016][0], 0); assert.equal(COLA[2010][0], 0);
  assert.equal(COLA[2009][0], 5.8); assert.equal(COLA[1997][0], 2.9); assert.equal(Object.keys(COLA).length, 32);
});
test('wage base: 2027 192,300, 2026 184,500, 2018 corrected 128,400, unchanged in 2010, 2011, 2016', () => {
  assert.equal(WAGE_BASE[2027], 192300); assert.equal(WAGE_BASE[2026], 184500); assert.equal(WAGE_BASE[2018], 128400);
  assert.equal(WAGE_BASE[2010], 106800); assert.equal(WAGE_BASE[2011], 106800); assert.equal(WAGE_BASE[2016], 118500);
});
test('2027 limits: earnings test 2,130 and 5,660 a month (25,560 and 67,920 a year), QC 1,970, SSI 1,029 and 1,544, bend points 1,340 and 8,077', () => {
  const r = getSocialSecurityLimits({});
  assert.equal(r.year, 2027); assert.equal(r.maximum_taxable_earnings, 192300);
  assert.equal(r.earnings_test.under_full_retirement_age.annual, 25560); assert.equal(r.earnings_test.year_you_reach_full_retirement_age.annual, 67920);
  assert.equal(r.quarter_of_coverage, 1970); assert.equal(r.max_credits_earnings, 7880);
  assert.deepEqual(r.ssi_federal_monthly_max, { individual: 1029, couple: 1544 }); assert.deepEqual(r.pia_bend_points, [1340, 8077]);
  assert.deepEqual(r.substantial_gainful_activity_monthly, { non_blind: 1770, blind: 2950 }); assert.equal(r.trial_work_period_month, 1270);
  assert.ok(r.more.includes(UTM)); assert.equal(r.source, 'https://www.federalregister.gov/d/2026-21796');
});
test('2026 limits: 2,040 and 5,430 a month, SSI 994; unknown year rejected', () => {
  assert.equal(LIMITS[2026].earnings_test_monthly_under_fra, 2040); assert.equal(LIMITS[2026].earnings_test_monthly_fra_year, 5430); assert.equal(LIMITS[2026].ssi_individual, 994);
  assert.throws(() => getSocialSecurityLimits({ year: 2022 }), InputError);
});
test('FRA table 20 CFR 404.409: 1937 65, 1938 65+2, 1943-54 66, 1955 66+2, 1959 66+10, 1960 67; survivors shifted 2 years', () => {
  assert.deepEqual(fraFor(1937), [65, 0]); assert.deepEqual(fraFor(1938), [65, 2]); assert.deepEqual(fraFor(1954), [66, 0]);
  assert.deepEqual(fraFor(1955), [66, 2]); assert.deepEqual(fraFor(1959), [66, 10]); assert.deepEqual(fraFor(1960), [67, 0]);
  assert.deepEqual(survivorFraFor(1961), [66, 10]); assert.deepEqual(survivorFraFor(1962), [67, 0]); assert.deepEqual(survivorFraFor(1945), [66, 0]);
});
test('reduction and credits: 36 months 20 percent, 60 months 30 percent, 2/3 of 1 percent a month after 1942', () => {
  assert.equal(Math.round(retirementReductionPct(36) * 1e6) / 1e6, 20); assert.equal(Math.round(retirementReductionPct(60) * 1e6) / 1e6, 30);
  assert.equal(drcPerMonth(1943), 2 / 3); assert.equal(drcPerMonth(1933), 11 / 24);
  assert.equal(floorDime(43.04), 43); assert.equal(ceilDime(228.78), 228.8); assert.equal(floorDime(2072), 2072);
});
test('ages: reached the day before the birthday; Jan 1 birthday uses the year before', () => {
  assert.equal(attainDate(parseDate('1960-07-15'), 67, 0).date, '2027-07-14');
  assert.equal(attainDate(parseDate('1955-03-01'), 66, 2).date, '2021-04-30');
  const r = getFullRetirementAge({ birth_date: '1960-01-01' });
  assert.equal(r.birth_year_for_rules, 1959); assert.equal(r.full_retirement_age.label, '66 and 10 months'); assert.equal(r.full_retirement_age_month, '2026-10');
  assert.throws(() => parseDate('1960-02-30'), InputError);
});
test('born 1960-07-15: FRA 67 in 2027-07, earliest month 2022-08, 59 months early, 70.417 percent, spouse 32.708, 124 at 70', () => {
  const r = getFullRetirementAge({ birth_date: '1960-07-15' });
  assert.equal(r.full_retirement_age_date, '2027-07-14'); assert.equal(r.earliest_retirement_benefit_month, '2022-08');
  assert.equal(r.months_early_at_earliest, 59); assert.equal(r.benefit_at_earliest_percent_of_pia, 70.417);
  assert.equal(r.spouse_benefit_at_earliest_percent_of_worker_pia, 32.708); assert.equal(r.benefit_at_70_percent_of_pia, 124); assert.equal(r.age_70_month, '2030-07');
});
test('born on the 2nd can start in the birthday month at 62 (404.311)', () => {
  const r = getFullRetirementAge({ birth_date: '1964-05-02' });
  assert.equal(r.earliest_retirement_benefit_month, '2026-05'); assert.equal(r.months_early_at_earliest, 60); assert.equal(r.benefit_at_earliest_percent_of_pia, 70);
});
test('20 CFR 404.410(a) example: PIA $980.50, 44 months early, payable $751.70', () => {
  const r = calculateClaimingAgeBenefit({ birth_date: '1941-06-02', pia: 980.5, claim_age_years: 62 });
  assert.equal(r.full_retirement_age, '65 and 8 months'); assert.equal(r.months_from_full_retirement_age, -44);
  assert.equal(r.monthly_change, -228.8); assert.equal(r.monthly_benefit, 751.7);
});
test('20 CFR 404.313(b) example: born 1933-01-15, PIA $782.60, 12 credits at 11/24 percent, $825.60', () => {
  const r = calculateClaimingAgeBenefit({ birth_date: '1933-01-15', pia: 782.6, claim_age_years: 66 });
  assert.equal(r.months_from_full_retirement_age, 12); assert.equal(r.change_percent, 5.5); assert.equal(r.monthly_benefit, 825.6);
});
test('claiming at 70 born 1960: 36 credits, 24 percent, $2,000 becomes $2,480; out-of-range age rejected', () => {
  const r = calculateClaimingAgeBenefit({ birth_date: '1960-07-15', pia: 2000, claim_age_years: 70 });
  assert.equal(r.change_percent, 24); assert.equal(r.monthly_benefit, 2480);
  assert.throws(() => calculateClaimingAgeBenefit({ birth_date: '1960-07-15', pia: 2000, claim_age_years: 71 }), InputError);
});
test('COLA increase: $2,000 x 1.036 = $2,072; $1,976.40 x 1.028 = $2,031.73 floors to $2,031.70', () => {
  const a = calculateColaIncrease({ monthly_benefit: 2000 });
  assert.equal(a.new_monthly_benefit_before_rounding_to_dollar, 2072); assert.equal(a.monthly_increase, 72);
  const b = calculateColaIncrease({ monthly_benefit: 1976.4, year: 2026 });
  assert.equal(b.new_monthly_benefit_before_rounding_to_dollar, 2031.7); assert.equal(b.new_monthly_payment_rounded_down, 2031);
});
test('earnings test 2027: $35,560 under FRA withholds $5,000; $76,920 in FRA year withholds $3,000; under limit 0', () => {
  assert.equal(calculateEarningsTest({ annual_earnings: 35560 }).benefits_withheld, 5000);
  const b = calculateEarningsTest({ annual_earnings: 76920, reaches_full_retirement_age_this_year: true, monthly_benefit: 1500 });
  assert.equal(b.benefits_withheld, 3000); assert.equal(b.months_fully_withheld, 2);
  assert.equal(calculateEarningsTest({ annual_earnings: 20000 }).benefits_withheld, 0);
});
test('Federal Register check: saved response is the 2027 notice; a 2028 notice is reported as newer', async () => {
  assert.deepEqual(parseNotice(fx('fr-latest.json')).cola_percent, 3.6);
  const same = await getSocialSecurityCola(async () => fx('fr-latest.json'), {});
  assert.equal(same.newer_notice, null); assert.equal(same.cola_percent, 3.6); assert.match(same.summary, /3\.6 percent/);
  const newer = await getSocialSecurityCola(async () => fx('fr-synthetic-2028.json'), {});
  assert.equal(newer.newer_notice.year, 2028); assert.equal(newer.newer_notice.cola_percent, 2.9); assert.match(newer.summary, /newer notice/);
  const down = await getSocialSecurityCola(async () => { throw new Error('HTTP 503'); }, {});
  assert.equal(down.cola_percent, 3.6); assert.match(down.live_check, /failed/);
  assert.equal((await getSocialSecurityCola(null, { year: 2023, history_years: 3 })).history.length, 3);
});
test('stdio: initialize, tools/list and an offline tools/call over JSON-RPC', async () => {
  const child = spawn(process.execPath, [new URL('../dist/stdio.js', import.meta.url).pathname], { stdio: ['pipe', 'pipe', 'ignore'] });
  const lines = []; let buf = '';
  const got = (id) => new Promise((res) => { const iv = setInterval(() => { const m = lines.find((l) => l.id === id); if (m) { clearInterval(iv); res(m); } }, 10); });
  child.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { lines.push(JSON.parse(buf.slice(0, i))); buf = buf.slice(i + 1); } });
  const send = (m) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');
  send({ id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } });
  assert.equal((await got(1)).result.serverInfo.name, 'social-security-cola-2027-mcp');
  send({ method: 'notifications/initialized' });
  send({ id: 2, method: 'tools/list' });
  assert.deepEqual((await got(2)).result.tools.map((t) => t.name), ['get_social_security_cola', 'calculate_cola_increase', 'get_full_retirement_age', 'calculate_claiming_age_benefit', 'get_social_security_limits', 'calculate_earnings_test']);
  send({ id: 3, method: 'tools/call', params: { name: 'get_full_retirement_age', arguments: { birth_date: '1958-09-20' } } });
  assert.equal((await got(3)).result.structuredContent.full_retirement_age.label, '66 and 8 months');
  child.kill();
});
