---
description: Record a meeting, call, email, note or introduction against a deal, company or person.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- log --ref="Deal" --kind=meeting --summary="What was said" --date=YYYY-MM-DD --actor="Your name"`.

For an introduction use --kind=intro --person="Who we met" --connector="Who introduced us".

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
