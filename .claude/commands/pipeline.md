---
description: The open pipeline in stage order, with days in stage, days since anyone last spoke to the company, and the next step.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- pipeline`.

Group the answer by stage. Show money per currency; never add NZD to AUD.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
