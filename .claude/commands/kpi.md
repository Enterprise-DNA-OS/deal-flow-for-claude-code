---
description: Record a figure a portfolio company reported.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- kpi --company="Portfolio company" --period=YYYY-MM-DD --metric="Revenue" --value=180000 --unit=NZD --evidence="Board pack" --actor="Your name"`.

A figure already on file needs --update to replace it.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
