---
description: Close a follow-up with the evidence that it is done.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- resolve --follow-up=<id prefix> --evidence="What was done" --actor="Your name"`.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
