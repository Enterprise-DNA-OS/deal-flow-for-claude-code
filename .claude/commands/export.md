---
description: Write every table to JSON files in exports/.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- export`.

The originals stay in the database. Nothing is deleted.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
