<h1 align="center">Deal Flow for Claude Code</h1>

<p align="center">
  <strong>The open-source deal flow system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Affinity data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=affinity">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/affinity?utm_source=github&utm_medium=readme&utm_campaign=affinity">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-affinity">Instead of Affinity</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

Deal Flow for Claude Code does the job you pay Affinity for, as a Postgres database and a set of agent commands. There is no web front end. You open the folder in [Claude Code](https://claude.com/claude-code) (or Codex, OpenCode, Cursor: see `AGENTS.md`) and ask for what you want in plain language. It runs the right query, and it can answer questions the Affinity dashboard cannot.

Affinity's own pricing page lists its Advanced plan at $2,700 per user per year, billed annually, so a ten-person deal team pays $27,000 a year before add-ons ([Affinity pricing](https://www.affinity.co/pricing), checked 10 October 2026; the page does not name the currency). Every partner, associate and analyst who needs to see the pipeline is another seat.

Want the same thing with a web front end, or built on a different stack? That is a customisation, and it is exactly what Enterprise DNA does: [book a call](https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=affinity).

It is for venture and private equity funds, angel networks, family offices, corporate finance boutiques and business brokers in New Zealand and Australia. It holds the companies you track, the people you know there, every deal and its stage, every meeting and introduction, NDAs, investment committee decisions, the figures portfolio companies send you, and who has committed to your fund. On top of that sit the jobs a deal team does every week: the Monday pipeline meeting, chasing deals that have gone quiet, finding a warm introduction, preparing committee, chasing portfolio reporting and keeping investor certificates current.

### Ten questions this answers today

1. Which open deals has nobody spoken to anyone at in three weeks? `/stale`
2. Who do we already know at this company, and who introduced us? `/intro-paths`
3. Which referrers send us deals that reach diligence, and which never do? `/sources`
4. Which NDAs lapse in the next 30 days? `/ndas`
5. What did the committee ask for last time, and is it answered? `/ic-queue`
6. Which portfolio companies are late with their figures? `/kpis-due`
7. Which committed investors are relying on a certificate older than two years? `/certificates`
8. Is any open deal on a listed company missing from the restricted list? `/compliance`
9. Why did we pass on this founder last time? `/passes`
10. How much is soft and how much is committed, per currency, for Fund II? `/fundraise`

These are working commands on the demo data, not claims about what Affinity can or cannot report.

## Why no front end

- The front end was only ever there because the database was hard to talk to. That is no longer true.
- Your data sits in plain Postgres tables you own. Any tool can read them. No export, no lock-in.
- No seats, no tiers, no add-ons. Read [docs/why-no-front-end.md](docs/why-no-front-end.md) for the honest trade-offs too.

## Quick start

Sixty seconds, no database install (an embedded Postgres runs inside Node):

```bash
git clone https://github.com/Enterprise-DNA-OS/deal-flow-for-claude-code.git
cd deal-flow-for-claude-code
npm install
npm run demo
```

Then open the folder in Claude Code and type `/weekly-review`: the Monday pipeline meeting in one answer. Or ask in plain words: "which deals have gone quiet?"

The demo is a fictional NZ and AU seed fund with eight deals, two portfolio companies and four investors. It is deliberately untidy: a deal gone quiet for a month, an overdue next step, an NDA about to lapse, a listed target missing from the restricted list, a late portfolio report and an expired investor certificate. Dates move with today.

`npm test` runs every command against a temporary database and must print PASS. `npm run view` writes the read-only pages to `views/`; `npm run docs` writes committee memos, investor statements and portfolio reports to `docs-out/`.

### Use it with your own Postgres or Supabase

Copy `.env.example` to `.env`, set `DATABASE_URL`, then `npm run migrate`. Same commands, shared data, no per-seat fee.

## The commands

Every command runs `npm run deals -- <command>`, takes `--json`, and matches deals, companies and people by full name, part of a name or the start of an id. An ambiguous name lists the candidates and stops. Every change needs `--actor` and lands in the activity log with what it was before.

| Command | What it does |
|---|---|
| `/help` | List every CLI command. |
| `/list` | List every deal with its company, stage, owner and pipeline. |
| `/show` | Everything on one deal: the record, every touch with anyone at the company, NDAs, committee decisions and follow-ups. |
| `/pipeline` | The open pipeline in stage order, with days in stage, days since anyone last spoke to the company, and the next step. |
| `/stale` | Open deals nobody has touched in more than 21 days, or ever. |
| `/next-steps` | Next steps due in the next seven days, overdue first. |
| `/intro-paths` | Warm paths into a company: who we know there, who on the team last spoke to them, and who introduced us. |
| `/sources` | Where deals come from and how far each source's deals get: diligence, invested, passed. |
| `/passes` | Every deal we passed on, with the reason and the date. |
| `/ndas` | Every NDA with its status and expiry, flagged when it lapses within 30 days or a request has sat for 14 days. |
| `/ic-queue` | Deals at investment committee or term sheet, with the last committee decision and its conditions. |
| `/portfolio` | Each portfolio company: last figures received, when the next set is due, and whether it is late. |
| `/kpis-due` | Portfolio companies whose reporting is overdue or who have never reported. |
| `/fundraise` | Fund commitments by fund, currency and status (target, soft, committed, declined). |
| `/certificates` | Investor certificates: type, date signed, the date the two-year reliance runs out, and the state. |
| `/attention` | Everything that needs a person this week: quiet deals, overdue next steps and follow-ups, NDAs about to lapse, late portfolio reports, certificates about to run out. |
| `/compliance` | Record checks against the rules in docs/compliance.md: investor certificates, the restricted list for listed companies, NDAs before diligence, committee records, and privacy reviews. |
| `/activity` | The last 100 changes: who changed what, with the evidence they gave. |
| `/weekly-review` | The Monday pipeline meeting in one run: pipeline, attention, next steps and the fundraise. |
| `/add` | Add a deal against a company already on file. |
| `/add-org` | Add a company: a target, portfolio company, investor, adviser or other. |
| `/add-person` | Add a person, optionally at a company. |
| `/update` | Change a deal's owner, amounts, currency, next step, close date or restricted-list flag. |
| `/move` | Move a deal to another stage: sourced, first meeting, diligence, ic, term sheet, closed. |
| `/pass` | Pass on a deal, with the reason. |
| `/log` | Record a meeting, call, email, note or introduction against a deal, company or person. |
| `/follow-up` | Set a dated follow-up on a deal or company. |
| `/resolve` | Close a follow-up with the evidence that it is done. |
| `/nda` | Record an NDA: requested, signed, returned or expired. |
| `/ic` | Record an investment committee decision: invest, decline or more information. |
| `/kpi` | Record a figure a portfolio company reported. |
| `/commit` | Record or change an investor's commitment to a fund, and their certificate. |
| `/import` | Bring an Affinity list export across: organizations, people, then opportunities. |
| `/export` | Write every table to JSON files in exports/. |
| `/draft-ic-memo` | Draft an investment committee memo for one deal into drafts/. |
| `/draft-investor-update` | Draft the quarterly investor update for a fund into drafts/. |
| `/draft-follow-up` | Draft a short follow-up email to the founder on a deal into drafts/. |
| `/docs` | Committee memos, investor statements and portfolio reports in your brand. |
| `/view` | Read-only pages: the Monday meeting, portfolio, fundraise, record checks. |
| `/customise` | Add a field, rename a stage or change a rule in plain words: migration written, applied and tested. |
| `/new-view` | Add a read-only page from a description. |

### Your first hour: ten things to ask for

1. "Put our fund name and logo on the committee memo." (brand.json)
2. "Do a test import of our Affinity opportunities list without saving it."
3. "Our Affinity statuses are Inbound, Partner Review, DD, IC, Closed and Pass. Map them."
4. "Which deals have gone quiet, and who owns them?"
5. "Who do we know at Tidewater, and who introduced us?"
6. "Add a field for the lead investor on each deal." (/customise)
7. "Rename the stages to match ours." (/customise)
8. "Draft the committee memo for Ferncliff."
9. "Which investors need a new certificate before the next close?"
10. "Write the Monday review and save it to drafts."

## Instead of Affinity

Affinity exports each list (organizations, people, opportunities) as a CSV from the list view. Bring them across in that order:

```bash
npm run deals -- import affinity --list=organizations --file=imports/organizations.csv --actor="Your name" --dry-run
npm run deals -- import affinity --list=organizations --file=imports/organizations.csv --actor="Your name"
npm run deals -- import affinity --list=people --file=imports/people.csv --actor="Your name"
npm run deals -- import affinity --list=opportunities --file=imports/opportunities.csv --map=imports/map.json --actor="Your name"
```

The whole file is checked before anything is saved; one bad row saves nothing. Every original column is kept on the record. Running the same file twice changes nothing; a changed row needs `--update`. Notes, the activity timeline, attachments and relationship scores do not come across in a list export: [what maps and what does not](docs/replace-affinity.md).

## Compliance, documents and views

`/compliance` checks the records against the rules a NZ or AU deal team works under: wholesale and eligible investor certificates (FMC Act Schedule 1), sophisticated investor accountant certificates (Corporations Act s708(8)(c)), a restricted list for deals on listed companies, NDAs before diligence, a committee decision before a term sheet, and privacy retention reviews (NZ IPP 9, AU APP 11.2). Each rule and its source: [docs/compliance.md](docs/compliance.md). It is a record check, not legal advice.

Verification: CI runs `npm test` on Node 20 and 22 on Linux and Windows, plus a job against PostgreSQL 17. `TEST_DATABASE_URL` must name an empty, disposable database. [Why this target was chosen](docs/research.md).

## Architecture

```
deal-flow-for-claude-code/
  CLAUDE.md                 how the operator wants this run (routing table + house rules)
  AGENTS.md                 the same, for Codex / OpenCode / Cursor / Gemini CLI
  .claude/commands/         the slash commands
  scripts/                  the CLI the commands drive
  scripts/lib/db.mjs        one adapter: DATABASE_URL (pg) or embedded PGlite
  supabase/migrations/      plain SQL schema
  supabase/seed.sql         demo data
  docs/                     the thesis and the migration guide
```

## Built for coding agents

The database, CLI and command recipes work with Claude Code, Codex, OpenCode or Cursor. Ask your coding agent for a new command and have it implement and test the change against the same records.

## Contributing

Issues and pull requests are welcome. Keep the shape: plain SQL, a small CLI, a slash command per recurring job, no front end.

## Want it installed and run for you?

Enterprise DNA installs Deal Flow for Claude Code for your business, migrates your Affinity data, connects it to the rest of your tools, and runs it for you as part of **Omni**, our managed Command Center. One setup fee, then a monthly retainer.

- Book a call: [enterprisedna.co/omni/book](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=affinity)
- Read more: [enterprisedna.co/omni/instead-of/affinity](https://enterprisedna.co/omni/instead-of/affinity?utm_source=github&utm_medium=readme&utm_campaign=affinity)

## License

MIT. Copyright (c) 2026 Enterprise DNA.
