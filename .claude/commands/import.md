---
description: Bring an Affinity list export across: organizations, people, then opportunities.
---

Read CLAUDE.md first. Add `--json` when you need to read the result yourself. Resolve deal, company and person names with `list` or `show`; if a name is ambiguous, show the candidates and ask. Never invent an actor, a date, an amount, a decision or evidence.

Run `npm run deals -- import affinity --list=organizations --file="imports/organizations.csv" --actor="Your name" --dry-run`.

Always run with --dry-run first and show the counts. Import organizations, then people, then opportunities. Statuses that are not standard need a map file (docs/replace-affinity.md). Changed rows need --update after the operator has reviewed them.

Nothing here sends, deletes or publishes. Drafts go to drafts/ for a person to send.
