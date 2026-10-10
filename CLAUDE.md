# Deal Flow for Claude Code: operating instructions

This file is the brain. Claude Code reads it at the start of every session. It says who this is for, how work gets done, and the one right way to do each recurring job.

## Who this is for

- **Business:** [YOUR FUND OR FIRM]
- **Operator:** [YOUR NAME], [your role]
- **What matters most:** [for example: no deal goes quiet, every committed investor has a current certificate]

The system is for a deal team: a venture or private equity fund, an angel network, a family office, a corporate finance boutique or a business broker. The CLI is `scripts/deals.mjs` (`npm run deals -- <command>`); every command accepts `--json`.

Fill this in once. A worker with context knows. A worker without it guesses.

## How to work

1. **Take a brief, not a script.** The operator describes the outcome. You run the right command and present the answer.
2. **Read before you write.** Before drafting anything about a record, read its full history first.
3. **Plain language.** Short sentences. No filler. Numbers in tables.
4. **Silent success, loud problems.** No play-by-play. Say what broke and what you did about it.
5. **Stop at the line.** Anything that sends, deletes, or faces a customer waits for a yes in this session.

## Routing table: one right way for each recurring job

| When the operator asks for... | Use this |
|---|---|
| List every CLI command | `/help` |
| List every deal with its company, stage, owner and pipeline | `/list` |
| Everything on one deal | `/show` |
| The open pipeline in stage order, with days in stage, days since anyone last spoke to the company, and the next step | `/pipeline` |
| Open deals nobody has touched in more than 21 days, or ever | `/stale` |
| Next steps due in the next seven days, overdue first | `/next-steps` |
| Warm paths into a company | `/intro-paths` |
| Where deals come from and how far each source's deals get | `/sources` |
| Every deal we passed on, with the reason and the date | `/passes` |
| Every NDA with its status and expiry, flagged when it lapses within 30 days or a request has sat for 14 days | `/ndas` |
| Deals at investment committee or term sheet, with the last committee decision and its conditions | `/ic-queue` |
| Each portfolio company | `/portfolio` |
| Portfolio companies whose reporting is overdue or who have never reported | `/kpis-due` |
| Fund commitments by fund, currency and status (target, soft, committed, declined) | `/fundraise` |
| Investor certificates | `/certificates` |
| Everything that needs a person this week | `/attention` |
| Record checks against the rules in docs/compliance.md | `/compliance` |
| The last 100 changes | `/activity` |
| The Monday pipeline meeting in one run | `/weekly-review` |
| Add a deal against a company already on file | `/add` |
| Add a company | `/add-org` |
| Add a person, optionally at a company | `/add-person` |
| Change a deal's owner, amounts, currency, next step, close date or restricted-list flag | `/update` |
| Move a deal to another stage | `/move` |
| Pass on a deal, with the reason | `/pass` |
| Record a meeting, call, email, note or introduction against a deal, company or person | `/log` |
| Set a dated follow-up on a deal or company | `/follow-up` |
| Close a follow-up with the evidence that it is done | `/resolve` |
| Record an NDA | `/nda` |
| Record an investment committee decision | `/ic` |
| Record a figure a portfolio company reported | `/kpi` |
| Record or change an investor's commitment to a fund, and their certificate | `/commit` |
| Bring an Affinity list export across | `/import` |
| Write every table to JSON files in exports/ | `/export` |
| Draft an investment committee memo for one deal into drafts/ | `/draft-ic-memo` |
| Draft the quarterly investor update for a fund into drafts/ | `/draft-investor-update` |
| Draft a short follow-up email to the founder on a deal into drafts/ | `/draft-follow-up` |
| Committee memos, investor statements, portfolio reports | `/docs` |
| Read-only pages | `/view` |
| A new field, stage or rule | `/customise` |
| A new read-only page | `/new-view` |

If an ask fits nothing here, run the CLI directly (`npm run <cli> -- --help`) and then propose a new command for it.

## Hard rules

- Never send email or messages from here. Draft to `drafts/`, a person sends.
- Never delete records without an explicit yes in this session. Prefer marking closed or archived.
- Never invent a record. If a name is ambiguous, list the candidates and ask.
- The database is the source of truth. If the answer is not in it, say so.

## Deal team rules

- Monday: `/weekly-review`. Before committee: `/ic-queue`, then `/show` and `/draft-ic-memo` for each deal.
- Every change needs `--actor`. Moves, updates, NDAs, figures and commitments also need `--evidence`. Never invent either.
- Never add amounts across currencies. NZD and AUD stay on separate lines.
- An introduction is a touch with `--kind=intro` and `--connector`. Never suggest contacting someone the records do not show we know.
- A deal on a listed company goes on the restricted list (`update --restricted=true`) the day it starts. Nothing here trades or advises on trading.
- Investor certificates are relied on for two years. Flag an expired one; never mark it current without a new signed certificate and its date.
- `/compliance` is a record check against docs/compliance.md, not legal advice. If a rule looks out of date, say so and stop.
- Use PGlite locally or `DATABASE_URL` for Postgres with a trusted operator role. Row level security is on with no public policies: this is not a multi-tenant app. `npm run seed` refuses a shared Postgres. Run `npm test` before every commit.

## Where things live

- `scripts/` the CLI. `scripts/lib/db.mjs` picks `DATABASE_URL` (Postgres, Supabase) or the embedded database in `.data/`.
- `supabase/migrations/` the schema, plain SQL. `npm run migrate` applies it.
- `.claude/commands/` the slash commands. Add one every time the same ask comes twice.
- `docs/` the thesis and the guide for moving off Affinity.

Built by Enterprise DNA. Installed and run for you as part of Omni: https://enterprisedna.co/omni/instead-of/affinity
