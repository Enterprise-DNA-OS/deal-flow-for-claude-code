---
description: Add a company: a target, portfolio company, investor, adviser or other.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- add-org --name="Company" --kind=target --country=NZ --sector="Software" --actor="Your name"`.

Use --listed=true for a company on a stock exchange, and --reporting-days=90 for a portfolio company.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
