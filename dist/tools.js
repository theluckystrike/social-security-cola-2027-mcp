// Tool registry shared by the stdio and Worker entries.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { InputError, REPO, SITE, LATEST, calculateClaimingAgeBenefit, calculateColaIncrease, calculateEarningsTest, getFullRetirementAge, getSocialSecurityCola, getSocialSecurityLimits, } from './core.js';
export const VERSION = '1.0.0';
export const TOOL_INFO = [
    { name: 'get_social_security_cola', blurb: `The Social Security COLA for a year (${LATEST}: 3.6 percent, paid from January ${LATEST}) and the history back to 1996, from the SSA notices in the Federal Register. Checks the Federal Register for a newer notice.` },
    { name: 'calculate_cola_increase', blurb: 'What a monthly benefit becomes after a year\'s COLA, with SSA rounding.' },
    { name: 'get_full_retirement_age', blurb: 'Full retirement age for a birth date, the exact month it is reached, the earliest claim month at 62, the cut at 62, delayed credits to 70 and the survivor full retirement age.' },
    { name: 'calculate_claiming_age_benefit', blurb: 'Monthly benefit for a claiming age from 62 to 70, using the 20 CFR 404.410 reduction and 404.313 delayed credits.' },
    { name: 'get_social_security_limits', blurb: 'Maximum taxable earnings, earnings test limits, work credit amount, SGA, SSI maximums and PIA bend points for 2023 to 2027.' },
    { name: 'calculate_earnings_test', blurb: 'How much the retirement earnings test withholds for a given income and year.' },
];
const RO = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
function ok(data) {
    return { content: [{ type: 'text', text: `${data.summary}\n\n${JSON.stringify(data, null, 2)}` }], structuredContent: data };
}
function fail(e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { isError: true, content: [{ type: 'text', text: `${e instanceof InputError ? 'Error' : 'Upstream error'}: ${msg}` }] };
}
const wrap = (f) => async (a) => { try {
    return ok((await f(a)));
}
catch (e) {
    return fail(e);
} };
const birth = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Birth date as YYYY-MM-DD, for example "1960-07-15".');
const limitYear = z.number().int().min(2023).max(2027).optional().describe('Year 2023 to 2027. Default 2027.');
export function createServer(fetchText) {
    const server = new McpServer({ name: REPO, version: VERSION, websiteUrl: SITE }, {
        instructions: 'Social Security numbers that are newer than most model training data: the COLA paid from January 2027 (3.6 percent, announced October 2026), the 2027 wage base ($192,300), ' +
            '2027 earnings test limits and SSI amounts, all copied from the SSA notices in the Federal Register, plus exact full retirement age and claiming-age math from 20 CFR 404. ' +
            'Use get_social_security_cola for "what is the COLA" and get_full_retirement_age for "when can I retire".',
    });
    server.registerTool('get_social_security_cola', {
        title: 'Get Social Security COLA',
        description: 'Social Security cost-of-living adjustment (COLA) for a payable year, from the SSA "Cost-of-Living Increase and Other Determinations" notice in the Federal Register. ' +
            'The 2027 COLA is 3.6 percent (effective December 2026, paid January 2027, published 2026-10-26). Also returns the COLA history back to 1996. ' +
            'Without a year it checks the Federal Register API for a newer notice.',
        inputSchema: {
            year: z.number().int().min(1996).max(2100).optional().describe('Year the COLA is first paid (January). Default: the latest, 2027.'),
            history_years: z.number().int().min(0).max(40).optional().describe('How many years of COLA history to include, newest first. Default 10.'),
        },
        annotations: { title: 'Social Security COLA', ...RO, openWorldHint: true },
    }, wrap((a) => getSocialSecurityCola(fetchText, a)));
    server.registerTool('calculate_cola_increase', {
        title: 'Calculate COLA increase',
        description: 'Apply a year\'s Social Security COLA to a monthly benefit. Rounds down to the next lower 10 cents and shows the whole-dollar payment, as SSA does. Default year 2027 (3.6 percent).',
        inputSchema: {
            monthly_benefit: z.number().positive().max(100000).describe('Current monthly benefit in dollars, for example 2008.'),
            year: z.number().int().min(1996).max(2100).optional().describe('Year the COLA is first paid. Default 2027.'),
        },
        annotations: { title: 'COLA increase', ...RO },
    }, wrap((a) => calculateColaIncrease(a)));
    server.registerTool('get_full_retirement_age', {
        title: 'Get full retirement age',
        description: 'Full retirement age for Social Security from a birth date (20 CFR 404.409, including the January 1 rule and the day-before-birthday rule), the exact date and month it is reached, ' +
            'the earliest month benefits can start at 62 and the percent cut, the spouse percent at 62, delayed retirement credits to age 70 and the survivor full retirement age.',
        inputSchema: { birth_date: birth },
        annotations: { title: 'Full retirement age', ...RO },
    }, wrap((a) => getFullRetirementAge(a)));
    server.registerTool('calculate_claiming_age_benefit', {
        title: 'Calculate benefit by claiming age',
        description: 'Monthly Social Security retirement benefit if claimed at a given age between 62 and 70, from the full-retirement-age amount (PIA). Uses 5/9 of 1 percent a month for the first 36 early months, ' +
            '5/12 of 1 percent after that, and 2/3 of 1 percent a month of delayed credits for people born after 1942, with SSA dime rounding.',
        inputSchema: {
            birth_date: birth,
            pia: z.number().positive().max(20000).describe('Monthly benefit at full retirement age (primary insurance amount) in dollars, from the SSA statement.'),
            claim_age_years: z.number().int().min(62).max(70).describe('Claiming age in whole years, 62 to 70.'),
            claim_age_months: z.number().int().min(0).max(11).optional().describe('Extra months, 0 to 11. Default 0.'),
        },
        annotations: { title: 'Benefit by claiming age', ...RO },
    }, wrap((a) => calculateClaimingAgeBenefit(a)));
    server.registerTool('get_social_security_limits', {
        title: 'Get Social Security limits for a year',
        description: 'Social Security program amounts for 2023 to 2027 from the Federal Register notices: maximum taxable earnings (2027: $192,300), retirement earnings test limits (2027: $25,560 and $67,920), ' +
            'earnings per work credit, substantial gainful activity, trial work month, maximum federal SSI and PIA bend points.',
        inputSchema: { year: limitYear },
        annotations: { title: 'Social Security limits', ...RO },
    }, wrap((a) => getSocialSecurityLimits(a)));
    server.registerTool('calculate_earnings_test', {
        title: 'Calculate earnings test withholding',
        description: 'How much Social Security withholds under the retirement earnings test for a year and annual earnings: $1 for every $2 over the limit, or $1 for every $3 in the year you reach full retirement age.',
        inputSchema: {
            annual_earnings: z.number().min(0).describe('Wages plus net self-employment earnings for the year, in dollars. In the year you reach full retirement age, only earnings before that month.'),
            year: limitYear,
            reaches_full_retirement_age_this_year: z.boolean().optional().describe('True if you reach full retirement age during this year. Default false.'),
            monthly_benefit: z.number().positive().optional().describe('Monthly benefit, to estimate how many months are withheld.'),
        },
        annotations: { title: 'Earnings test', ...RO },
    }, wrap((a) => calculateEarningsTest(a)));
    return server;
}
