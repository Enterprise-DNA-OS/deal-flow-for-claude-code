---
description: Move a deal to another stage: sourced, first meeting, diligence, ic, term sheet, closed.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- move --ref="Deal" --stage="diligence" --actor="Your name" --evidence="What happened"`.

To pass, use /pass.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
