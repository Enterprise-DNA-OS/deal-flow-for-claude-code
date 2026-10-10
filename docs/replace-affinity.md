# Moving from Affinity

Checked 10 October 2026 against Affinity's help article [How to export data from your Affinity lists](https://support.affinity.co/s/article/How-to-export-data-from-your-Affinity-lists).

## 1. Export each list

In Affinity, open the list, pick a saved view that shows the columns you want, click **Export**, then **Export view as CSV**. Affinity emails a download link and also posts it under Notifications. This works for People, Organization and Opportunity lists. If there is no Export button, an Enterprise admin has probably turned exporting off for your role. Affinity's article says Crunchbase fields are left out of exports and the Connections column does not export any data.

Save the files in `imports/` (it is ignored by Git).

## 2. Import in order: organizations, people, opportunities

```bash
npm run migrate
npm run deals -- import affinity --list=organizations --file=imports/organizations.csv --actor="Your name" --dry-run
npm run deals -- import affinity --list=organizations --file=imports/organizations.csv --actor="Your name"
npm run deals -- import affinity --list=people --file=imports/people.csv --actor="Your name"
npm run deals -- import affinity --list=opportunities --file=imports/opportunities.csv --map=imports/map.json --currency=NZD --actor="Your name" --dry-run
npm run deals -- import affinity --list=opportunities --file=imports/opportunities.csv --map=imports/map.json --currency=NZD --actor="Your name"
```

`--dry-run` checks the whole file and saves nothing. Without it, the file still saves all or nothing.

## What maps

Affinity's article lists these columns for list exports. The importer reads them by name:

| Affinity column | Becomes |
|---|---|
| Organization ID, Person ID, Opportunity ID | the record's Affinity id, so re-imports match the same record |
| Organization Name, Website | company name and website |
| Full Name, Primary Email (or the first of Email Addresses), Organizations | person name, email and company (when the company is already imported) |
| Opportunity Name, Organizations | deal name and its company (created if not yet on file) |
| Status | deal stage, through the status map below |
| Owners | owner (the first owner listed) |
| Amount | round size (`$` and commas are stripped) |
| Date Added, Close Date | added date and expected close date (YYYY-MM-DD; a date like 03/04/2026 is refused because day and month are ambiguous) |

Every original column, including list fields this system has no column for, is kept in the record's `source` field. Nothing is thrown away.

Multiple values in one cell (several owners or organizations) are split on semicolons or line breaks and the first is used. Check your file: if your export separates them another way, map it first.

## Statuses

Affinity statuses are set per list. These map without help: New, Sourced, Lead, To contact, Contacted, First meeting, Meeting, Qualified, Due diligence, Diligence, DD, IC, Investment committee, Term sheet, Closed, Invested, Portfolio, Won, Passed, Pass, Lost, Declined, Dead. Any other status stops the import and names the status. Add it to a map file:

```json
{ "statuses": { "Partner Review": "ic", "Inbound": "sourced" }, "columns": { "Organization Name": "Company" } }
```

`columns` maps one of the column names above to a different header in your file. See `fixtures/affinity-map.json`.

Imported passed deals get the reason "Imported as ... from Affinity; reason not in export". Replace it with the real reason when you know it.

## What does not carry over

- **Notes and the activity timeline.** Affinity offers "Export all notes in view" as a separate file. Its columns are not documented in the article, so this importer does not read it. Enterprise DNA maps it as part of a switch, or ask Claude Code to map your file into `touches`.
- **Automatic email and calendar capture, and relationship scores.** Affinity builds these from your inboxes. This system records touches you log. Connecting your mail and calendar is a custom build.
- **Attachments.** Keep the data room where it is; record where the signed NDA lives in the NDA's evidence.
- **Introductions.** Affinity offers "Export all introductions in view" for people and organization lists. Map it the same way as notes.
- **NDAs, committee decisions, portfolio figures and investor commitments.** Record them with `/nda`, `/ic`, `/kpi` and `/commit`, or import them from your own spreadsheets with `/customise`.

## Check it

Run `/pipeline` and compare the count per stage with Affinity. Run `/attention` and `/compliance` and fix what they find. Keep the original exports and a database backup. `npm run deals -- export` writes JSON copies of every table at any time.
