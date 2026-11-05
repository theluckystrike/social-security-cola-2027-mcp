# Data sources

All sources below were fetched on 2026-11-05 while building version 1.0.0. www.ssa.gov answered 403 to the build host, so every amount is copied from the SSA notices as published in the Federal Register and from 20 CFR part 404 on eCFR. The COLA tool also reads the Federal Register API at call time to spot a newer notice.

| Data | URL | Notes |
|---|---|---|
| 2027 COLA (3.6 percent), wage base $192,300, earnings test $2,130 and $5,660 a month, QC $1,970, SGA $1,770 and $2,950, TWP $1,270, SSI $1,029 and $1,544, bend points $1,340 and $8,077, AWI 2025 $72,800.33 | https://www.federalregister.gov/d/2026-21796 (raw text https://www.federalregister.gov/documents/full_text/text/2026/10/26/2026-21796.txt) | "Cost-of-Living Increase and Other Determinations for 2027", 91 FR 67380, 2026-10-26. |
| 2023 to 2026 amounts | https://www.federalregister.gov/d/2025-19763, https://www.federalregister.gov/d/2024-24871, https://www.federalregister.gov/d/2023-23317, https://www.federalregister.gov/d/2022-23073 | Same notice for each year. |
| COLA 1996 to 2022 and wage base 1996 to 2022 | Federal Register API list of all 35 SSA notices: https://www.federalregister.gov/api/v1/documents.json?conditions[term]="Cost-of-Living Increase and Other Determinations"&conditions[agencies][]=social-security-administration | Raw text of each notice read for the COLA percent and contribution and benefit base. The December 2017 republication (2017-27105, base $128,400) replaces the October 2017 notice ($128,700). |
| Full retirement age tables | https://www.ecfr.gov/current/title-20/chapter-III/part-404/section-404.409 | Retirement and spouse table (a) and widow or widower table (b). |
| Early retirement reduction | https://www.ecfr.gov/current/title-20/chapter-III/part-404/section-404.410 | 5/9 of 1 percent for each of the first 36 months, 5/12 of 1 percent after; spouse 25/36 of 1 percent. Worked example $980.50 to $751.70 is a test fixture. |
| Delayed retirement credits | https://www.ecfr.gov/current/title-20/chapter-III/part-404/section-404.313 | Credit table by birth date; 2/3 of 1 percent a month after 1/1/1943. Worked example $782.60 to $825.60 is a test fixture. |
| Age definition | https://www.ecfr.gov/current/title-20/chapter-III/part-404/section-404.102 | You reach an age on the day before your birthday. |
| First month of entitlement | https://www.ecfr.gov/current/title-20/chapter-III/part-404/section-404.311 | Before full retirement age, the first month throughout which you meet all requirements. |

Test fixtures in `test/fixtures/` are a trimmed Federal Register API response saved on 2026-11-05 and one hand-made response that stands in for a future 2028 notice.
