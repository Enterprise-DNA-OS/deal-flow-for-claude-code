---
description: Record or change an investor's commitment to a fund, and their certificate.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- commit --investor="Investor" --fund="Fund II" --status=soft --amount=1000000 --currency=NZD --certificate=nz-safe-harbour --certificate-on=YYYY-MM-DD --evidence="Source" --actor="Your name"`.

Certificate types: none, nz-safe-harbour, nz-eligible, au-s708-accountant, other.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
