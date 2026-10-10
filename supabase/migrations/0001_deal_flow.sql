-- Deal Flow for Claude Code: companies, people, deals, touches, NDAs, investment committee,
-- portfolio reporting and fund commitments. Plain Postgres; runs the same on PGlite.
CREATE FUNCTION touch_updated() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;

CREATE TABLE orgs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(trim(name))>0),
 website text, sector text, country text CHECK(country IS NULL OR country ~ '^[A-Z]{2}$'),
 kind text NOT NULL DEFAULT 'target' CHECK(kind IN ('target','portfolio','investor','adviser','other')),
 listed boolean NOT NULL DEFAULT false, reporting_days integer CHECK(reporting_days>0), owner text,
 affinity_id text UNIQUE, source jsonb NOT NULL DEFAULT '{}', active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX orgs_name ON orgs(lower(name));

CREATE TABLE people (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), full_name text NOT NULL CHECK(length(trim(full_name))>0),
 email text CHECK(email IS NULL OR email ~ '^[^@\s]+@[^@\s]+$'), org_id uuid REFERENCES orgs(id), title text, owner text,
 privacy_reviewed_on date, affinity_id text UNIQUE, source jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX people_email ON people(lower(email)) WHERE email IS NOT NULL;

CREATE TABLE deals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(trim(name))>0),
 org_id uuid NOT NULL REFERENCES orgs(id), pipeline text NOT NULL DEFAULT 'Main',
 stage text NOT NULL DEFAULT 'sourced' CHECK(stage IN ('sourced','first meeting','diligence','ic','term sheet','closed','passed')),
 stage_since date NOT NULL DEFAULT current_date, owner text,
 source_person_id uuid REFERENCES people(id), source_note text,
 currency text NOT NULL DEFAULT 'NZD' CHECK(currency ~ '^[A-Z]{3}$'),
 round_size numeric CHECK(round_size>=0), our_cheque numeric CHECK(our_cheque>=0), pre_money numeric CHECK(pre_money>=0),
 next_step text, next_step_due date, pass_reason text, restricted boolean NOT NULL DEFAULT false,
 added_on date NOT NULL DEFAULT current_date, close_date date,
 affinity_id text UNIQUE, source jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(stage<>'passed' OR pass_reason IS NOT NULL)
);
CREATE UNIQUE INDEX deals_name ON deals(lower(name));

CREATE TABLE touches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), deal_id uuid REFERENCES deals(id), org_id uuid REFERENCES orgs(id),
 person_id uuid REFERENCES people(id), kind text NOT NULL CHECK(kind IN ('meeting','call','email','note','intro')),
 happened_on date NOT NULL, summary text NOT NULL, actor text NOT NULL, connector_id uuid REFERENCES people(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(deal_id IS NOT NULL OR org_id IS NOT NULL OR person_id IS NOT NULL)
);

CREATE TABLE ndas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES orgs(id), deal_id uuid REFERENCES deals(id),
 status text NOT NULL CHECK(status IN ('requested','signed','returned','expired')), signed_on date, expires_on date,
 evidence text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(status<>'signed' OR signed_on IS NOT NULL), CHECK(expires_on IS NULL OR signed_on IS NULL OR expires_on>=signed_on)
);

CREATE TABLE ic_decisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), deal_id uuid NOT NULL REFERENCES deals(id), met_on date NOT NULL,
 decision text NOT NULL CHECK(decision IN ('invest','decline','more information')), amount numeric CHECK(amount>=0),
 currency text CHECK(currency IS NULL OR currency ~ '^[A-Z]{3}$'), conditions text, present text NOT NULL, actor text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(decision<>'invest' OR (amount IS NOT NULL AND currency IS NOT NULL))
);

CREATE TABLE kpis (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_id uuid NOT NULL REFERENCES orgs(id), period date NOT NULL,
 metric text NOT NULL, value numeric NOT NULL, unit text NOT NULL, received_on date NOT NULL, evidence text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(org_id,period,metric)
);

CREATE TABLE commitments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), investor_id uuid NOT NULL REFERENCES orgs(id), fund text NOT NULL,
 status text NOT NULL CHECK(status IN ('target','soft','committed','declined')), amount numeric CHECK(amount>=0),
 currency text NOT NULL DEFAULT 'NZD' CHECK(currency ~ '^[A-Z]{3}$'),
 certificate text NOT NULL DEFAULT 'none' CHECK(certificate IN ('none','nz-safe-harbour','nz-eligible','au-s708-accountant','other')),
 certificate_on date, owner text, next_step_due date,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(investor_id,fund),
 CHECK(certificate='none' OR certificate_on IS NOT NULL)
);

CREATE TABLE follow_ups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), deal_id uuid REFERENCES deals(id), org_id uuid REFERENCES orgs(id),
 note text NOT NULL, due date NOT NULL, resolved boolean NOT NULL DEFAULT false, actor text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(deal_id IS NOT NULL OR org_id IS NOT NULL)
);

CREATE TABLE activity (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), record text NOT NULL, record_id uuid, action text NOT NULL, actor text NOT NULL,
 before_data jsonb, after_data jsonb, evidence text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE imports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), filename text NOT NULL, sha256 text NOT NULL, kind text NOT NULL,
 row_count integer NOT NULL, actor text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['orgs','people','deals','touches','ndas','ic_decisions','kpis','commitments','follow_ups','activity','imports'] LOOP
 EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated()',t);
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON %I FROM public',t);
END LOOP; END $$;
CREATE INDEX touches_deal ON touches(deal_id,happened_on);
CREATE INDEX touches_org ON touches(org_id,happened_on);
CREATE INDEX touches_person ON touches(person_id,happened_on);

-- The last time anyone on the team touched a deal: the deal itself, its company, or anyone at the company.
CREATE VIEW v_pipeline AS
SELECT d.id, d.name AS deal, o.name AS company, d.pipeline, d.stage, d.owner, d.currency, d.round_size, d.our_cheque,
 current_date-d.stage_since AS days_in_stage, lt.last_touch, current_date-lt.last_touch AS days_quiet,
 d.next_step, d.next_step_due, o.listed, d.restricted, d.added_on
FROM deals d JOIN orgs o ON o.id=d.org_id
LEFT JOIN LATERAL (SELECT max(t.happened_on) AS last_touch FROM touches t
 WHERE t.deal_id=d.id OR t.org_id=d.org_id OR t.person_id IN (SELECT p.id FROM people p WHERE p.org_id=d.org_id)) lt ON true
WHERE d.stage NOT IN ('closed','passed');

CREATE VIEW v_ndas AS
SELECT n.id, o.name AS company, d.name AS deal, n.status, n.signed_on, n.expires_on,
 CASE WHEN n.status='signed' AND n.expires_on<current_date THEN 'lapsed'
  WHEN n.status='signed' AND n.expires_on<=current_date+30 THEN 'expires within 30 days'
  WHEN n.status='requested' AND n.created_at<now()-interval '14 days' THEN 'requested over 14 days ago'
  ELSE 'ok' END AS state, n.org_id, n.deal_id
FROM ndas n JOIN orgs o ON o.id=n.org_id LEFT JOIN deals d ON d.id=n.deal_id;

-- Portfolio reporting: the latest figures each portfolio company sent and when the next set is due.
CREATE VIEW v_portfolio AS
SELECT o.id, o.name AS company, o.owner, o.reporting_days, k.last_received, k.last_period,
 k.last_received+o.reporting_days AS next_due,
 CASE WHEN k.last_received IS NULL THEN 'never reported' WHEN k.last_received+o.reporting_days<current_date THEN 'overdue' ELSE 'on time' END AS reporting
FROM orgs o LEFT JOIN LATERAL (SELECT max(received_on) last_received, max(period) last_period FROM kpis WHERE org_id=o.id) k ON true
WHERE o.kind='portfolio' AND o.active;

-- Investor certificates under the NZ FMC Act Schedule 1 and AU s708(8)(c) are relied on for two years.
CREATE VIEW v_certificates AS
SELECT c.id, o.name AS investor, o.country, c.fund, c.status, c.amount, c.currency, c.certificate, c.certificate_on,
 (c.certificate_on+interval '2 years')::date AS relied_on_until,
 CASE WHEN c.certificate='none' THEN 'no certificate'
  WHEN (c.certificate_on+interval '2 years')::date<current_date THEN 'expired'
  WHEN (c.certificate_on+interval '2 years')::date<=current_date+60 THEN 'expires within 60 days'
  ELSE 'current' END AS certificate_state
FROM commitments c JOIN orgs o ON o.id=c.investor_id WHERE c.status<>'declined';

CREATE VIEW v_attention AS
 SELECT id AS deal_id, deal AS item, 'gone quiet' AS issue, coalesce(days_quiet::text||' days since last touch','never touched') AS detail FROM v_pipeline WHERE last_touch IS NULL OR days_quiet>21
 UNION ALL SELECT id, deal, 'next step overdue', next_step||' (due '||next_step_due||')' FROM v_pipeline WHERE next_step_due<current_date
 UNION ALL SELECT id, deal, 'no next step', stage FROM v_pipeline WHERE next_step IS NULL OR next_step_due IS NULL
 UNION ALL SELECT d.id, coalesce(d.name,o.name), 'follow-up overdue', f.note||' (due '||f.due||')' FROM follow_ups f
  LEFT JOIN deals d ON d.id=f.deal_id LEFT JOIN orgs o ON o.id=f.org_id WHERE NOT f.resolved AND f.due<current_date
 UNION ALL SELECT deal_id, company, 'NDA '||state, coalesce(deal,company) FROM v_ndas WHERE state<>'ok'
 UNION ALL SELECT NULL, company, 'portfolio report '||reporting, coalesce('due '||next_due,'no figures on file') FROM v_portfolio WHERE reporting<>'on time'
 UNION ALL SELECT NULL, investor||' / '||fund, 'certificate '||certificate_state, certificate FROM v_certificates WHERE certificate_state IN ('expired','expires within 60 days') AND status IN ('soft','committed')
 UNION ALL SELECT NULL, o.name||' / '||c.fund, 'investor next step overdue', c.status FROM commitments c JOIN orgs o ON o.id=c.investor_id WHERE c.status IN ('target','soft') AND c.next_step_due<current_date;

CREATE VIEW v_compliance AS
 SELECT investor AS item, 'NZ-FMCA-CERT' AS rule, 'Wholesale or eligible investor certificate older than two years' AS finding FROM v_certificates
  WHERE certificate IN ('nz-safe-harbour','nz-eligible') AND certificate_state='expired' AND status IN ('soft','committed')
 UNION ALL SELECT investor, 'AU-S708-CERT', 'Accountant certificate older than two years' FROM v_certificates
  WHERE certificate='au-s708-accountant' AND certificate_state='expired' AND status IN ('soft','committed')
 UNION ALL SELECT investor, 'CERT-MISSING', 'Committed investor with no certificate on file' FROM v_certificates WHERE certificate='none' AND status='committed'
 UNION ALL SELECT p.deal, 'INSIDER-LIST', 'Open deal on a listed company is not on the restricted list' FROM v_pipeline p WHERE p.listed AND NOT p.restricted
 UNION ALL SELECT p.deal, 'NDA-DILIGENCE', 'Deal in diligence or later without a signed, current NDA' FROM v_pipeline p JOIN deals d ON d.id=p.id
  WHERE p.stage IN ('diligence','ic','term sheet') AND NOT EXISTS(SELECT 1 FROM ndas n WHERE n.org_id=d.org_id AND n.status='signed' AND (n.expires_on IS NULL OR n.expires_on>=current_date))
 UNION ALL SELECT d.name, 'IC-RECORD', 'Term sheet or close without a recorded invest decision' FROM deals d
  WHERE d.stage IN ('term sheet','closed') AND NOT EXISTS(SELECT 1 FROM ic_decisions i WHERE i.deal_id=d.id AND i.decision='invest')
 UNION ALL SELECT p.full_name, 'PRIVACY-REVIEW', 'No touch in three years and no retention review on file' FROM people p
  WHERE coalesce((SELECT max(happened_on) FROM touches t WHERE t.person_id=p.id), p.created_at::date)<current_date-1095
  AND (p.privacy_reviewed_on IS NULL OR p.privacy_reviewed_on<current_date-1095);

-- Where deals come from, and how far they get.
CREATE VIEW v_sources AS
SELECT coalesce(p.full_name, d.source_note, 'unknown') AS source, count(*) AS deals,
 count(*) FILTER(WHERE d.stage IN ('diligence','ic','term sheet','closed')) AS reached_diligence,
 count(*) FILTER(WHERE d.stage='closed') AS invested, count(*) FILTER(WHERE d.stage='passed') AS passed
FROM deals d LEFT JOIN people p ON p.id=d.source_person_id GROUP BY 1;

-- Warm paths into an open deal's company: people there, who on the team last spoke to them, and who introduced us.
CREATE VIEW v_intro_paths AS
SELECT v.id AS deal_id, v.deal, v.company, p.full_name AS person, p.title, t.actor AS last_spoke_with_us, t.happened_on AS last_touch, c.full_name AS introduced_by
FROM v_pipeline v JOIN deals d ON d.id=v.id JOIN people p ON p.org_id=d.org_id
LEFT JOIN LATERAL (SELECT actor, happened_on, connector_id FROM touches WHERE person_id=p.id ORDER BY happened_on DESC, created_at DESC LIMIT 1) t ON true
LEFT JOIN LATERAL (SELECT connector_id FROM touches WHERE person_id=p.id AND kind='intro' AND connector_id IS NOT NULL ORDER BY happened_on DESC LIMIT 1) i ON true
LEFT JOIN people c ON c.id=i.connector_id;

CREATE VIEW v_fundraise AS
SELECT fund, currency, status, count(*) AS investors, coalesce(sum(amount),0) AS amount FROM commitments GROUP BY fund,currency,status;

REVOKE ALL ON v_pipeline,v_ndas,v_portfolio,v_certificates,v_attention,v_compliance,v_sources,v_intro_paths,v_fundraise FROM public;
