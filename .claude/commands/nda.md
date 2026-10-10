---
description: Record an NDA: requested, signed, returned or expired.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- nda --company="Company" --deal="Deal" --status=signed --signed=YYYY-MM-DD --expires=YYYY-MM-DD --evidence="Where the signed copy is" --actor="Your name"`.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
