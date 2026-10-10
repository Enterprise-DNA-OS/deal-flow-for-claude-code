---
description: Change a deal's owner, amounts, currency, next step, close date or restricted-list flag.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- update --ref="Deal" --next-step="Send term sheet" --next-step-due=YYYY-MM-DD --actor="Your name" --evidence="Why"`.

Use --restricted=true as soon as a deal on a listed company starts. `null` clears an optional field.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
