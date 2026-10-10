---
description: Record an investment committee decision: invest, decline or more information.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- ic --ref="Deal" --decision="invest" --amount=500000 --currency=NZD --present="Who was in the room" --conditions="Any conditions" --met=YYYY-MM-DD --actor="Your name"`.

An invest decision needs an amount and currency. Record exactly what the committee decided, nothing more.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
