---
description: Add a deal against a company already on file.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- add --name="Deal name" --company="Company" --stage="sourced" --currency=NZD --round-size=2000000 --source="Person who referred it" --next-step="First meeting" --next-step-due=YYYY-MM-DD --actor="Your name"`.

If the company is not on file, run add-org first.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
