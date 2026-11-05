# social-security-cola-2027-mcp

Social Security COLA 2027, full retirement age and 2027 limits for AI assistants. The COLA paid from January 2027 is 3.6 percent. Give a birth date and get the exact full retirement age month, the cut at 62 and the gain at 70.

This is a Model Context Protocol (MCP) server. Every amount is copied from the SSA notices in the Federal Register and from 20 CFR part 404. It needs no API key.

## Tools

| Tool | What it returns |
| --- | --- |
| `get_social_security_cola` | The COLA for a payable year (2027 is 3.6 percent, effective December 2026, paid January 2027) and the history back to 1996. Without a year it checks the Federal Register API for a newer notice. |
| `calculate_cola_increase` | What a monthly benefit becomes after the COLA, with SSA rounding to 10 cents and to the whole dollar. |
| `get_full_retirement_age` | Full retirement age for a birth date, the date and month it is reached, the earliest claim month at 62, the percent cut at 62, the spouse percent, delayed credits to 70 and the survivor full retirement age. |
| `calculate_claiming_age_benefit` | The monthly benefit for any claiming age from 62 to 70, from the full-retirement-age amount (PIA). |
| `get_social_security_limits` | For 2023 to 2027: maximum taxable earnings (2027 is $192,300), earnings test limits (2027 is $25,560 and $67,920), earnings per work credit, SGA, trial work month, maximum federal SSI and PIA bend points. |
| `calculate_earnings_test` | How much the retirement earnings test withholds for a year and annual earnings. |

Every result has structured JSON, a one-paragraph summary, `as_of`, `source` (the Federal Register notice or the eCFR section) and `more` (a page on [mcpstamp.com](https://www.mcpstamp.com/servers/?utm_source=mcp&utm_medium=social-security-cola-2027-mcp)).

## What it knows that your model does not

- The 2027 COLA (3.6 percent) and the 2027 amounts. SSA published them on 2026-10-26, after most models were trained.
- The full retirement age rules as written. A January 1 birthday counts as the year before. You reach an age the day before your birthday. Before full retirement age you must be 62 for the whole month, so most people start the month after they turn 62.
- The exact reduction and delayed-credit arithmetic with SSA rounding. The two worked examples in 20 CFR 404.410 and 404.313 are test fixtures.

## Install

### Hosted (Claude.ai custom connector, ChatGPT developer mode)

Paste this URL. No token, no sign-up. It works now.

```
https://social-security-cola-2027-mcp.lipmichal.workers.dev/mcp
```

### Claude Code

```
claude mcp add --transport http ss-cola https://social-security-cola-2027-mcp.lipmichal.workers.dev/mcp
```

### Claude Desktop

Claude Desktop adds remote servers under Settings, Connectors, Add custom connector. Paste the URL above.

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ss-cola": { "url": "https://social-security-cola-2027-mcp.lipmichal.workers.dev/mcp" }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "ss-cola": { "type": "http", "url": "https://social-security-cola-2027-mcp.lipmichal.workers.dev/mcp" }
  }
}
```

### Local stdio (after npm release)

The npm package is not published yet. After it is, run it locally with Node 20 or newer:

```
claude mcp add ss-cola -- npx -y social-security-cola-2027-mcp
```

## Example prompts

- "What is the Social Security COLA for 2027?"
- "My benefit is $2,008 a month. What will it be in January 2027?"
- "I was born on July 15, 1960. What is my full retirement age and how much do I lose if I start at 62?"
- "My PIA is $2,400. What do I get if I claim at 64 and 6 months, or at 70?"
- "What is the Social Security earnings limit for 2027, and how much is withheld if I earn $40,000?"
- "What is the maximum taxable earnings for Social Security in 2027?"

## Data sources

Full list with fetch dates in [DATA_SOURCES.md](DATA_SOURCES.md).

- [Cost-of-Living Increase and Other Determinations for 2027](https://www.federalregister.gov/d/2026-21796), Federal Register, 2026-10-26, and the notices for earlier years.
- [20 CFR 404.409](https://www.ecfr.gov/current/title-20/chapter-III/part-404/section-404.409) full retirement age, [404.410](https://www.ecfr.gov/current/title-20/chapter-III/part-404/section-404.410) reduction, [404.313](https://www.ecfr.gov/current/title-20/chapter-III/part-404/section-404.313) delayed credits, [404.102](https://www.ecfr.gov/current/title-20/chapter-III/part-404/section-404.102) age, [404.311](https://www.ecfr.gov/current/title-20/chapter-III/part-404/section-404.311) first month.

## Limitations

- It does not read your earnings record. Use your SSA statement for your PIA.
- The COLA increase from a net payment is an estimate within about a dollar, because SSA applies the COLA to the PIA before the Medicare premium is taken out.
- Spousal and survivor amounts are shown as percents only. Family maximum and disability benefits are not modeled.
- Yearly limits cover 2023 to 2027. COLA history covers 1996 to 2027.

## More

More MCP servers that answer questions your assistant cannot answer alone are on [mcpstamp.com](https://www.mcpstamp.com/servers/?utm_source=mcp&utm_medium=social-security-cola-2027-mcp).

Part of the Zovo MCP collection: https://mcp.zovo.one

Built by [theluckystrike](https://github.com/theluckystrike).

## Development

```
npm install
npm test                              # builds, then runs the fixture tests and an offline stdio test
node scripts/stdio-transcript.mjs     # stdio round trip, writes .live/stdio-transcript.jsonl
```

## License

MIT
