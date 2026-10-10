#!/usr/bin/env node
// The one CLI for Deal Flow for Claude Code. Human tables by default, --json for machines.
// Every mutation needs --actor and is written to the activity table with before and after.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv, pick } from './lib/csv.mjs';
import { table } from './lib/format.mjs';
import { page, table as htmlTable, writeOut } from './lib/render.mjs';

export const commands=['help','list','show','pipeline','stale','next-steps','intro-paths','sources','passes','ndas','ic-queue','portfolio','kpis-due','fundraise','certificates','attention','compliance','activity','weekly-review','add','add-org','add-person','update','move','pass','log','follow-up','resolve','nda','ic','kpi','commit','import','export','draft-ic-memo','draft-investor-update','draft-follow-up'];
export const STAGES=['sourced','first meeting','diligence','ic','term sheet','closed','passed'];
// Affinity list statuses are set per list. These are the common names; anything else needs --map.
export const STATUS_ALIASES={'new':'sourced','sourced':'sourced','lead':'sourced','to contact':'sourced','contacted':'first meeting','first meeting':'first meeting','meeting':'first meeting','qualified':'first meeting','due diligence':'diligence','diligence':'diligence','dd':'diligence','ic':'ic','investment committee':'ic','term sheet':'term sheet','term sheet issued':'term sheet','closed':'closed','invested':'closed','portfolio':'closed','won':'closed','passed':'passed','pass':'passed','lost':'passed','declined':'passed','dead':'passed'};
const ORDER=`array_position(ARRAY['sourced','first meeting','diligence','ic','term sheet','closed','passed'],stage)`;

const today=()=>new Date().toISOString().slice(0,10);
function need(v,k){if(v===undefined||v===null||v===true||String(v).trim()==='')throw Error(`Required: --${k}`);return String(v).trim();}
function num(v,k){const n=Number(need(v,k));if(!Number.isFinite(n)||n<0)throw Error(`${k} must be a number of 0 or more`);return n;}
function date(v,k){const s=need(v,k);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||new Date(s+'T00:00:00Z').toISOString().slice(0,10)!==s)throw Error(`${k} must be a real YYYY-MM-DD date`);return s;}
function cur(v){const s=need(v,'currency').toUpperCase();if(!/^[A-Z]{3}$/.test(s))throw Error('currency must be a three-letter code');return s;}
function bool(v,k){if(!['true','false'].includes(String(v)))throw Error(`${k} must be true or false`);return String(v)==='true';}
export function stage(v){const s=need(v,'stage').toLowerCase();const hit=STATUS_ALIASES[s];if(!hit)throw Error(`Unknown stage "${v}". Use one of: ${STAGES.join(', ')}`);return hit;}
function oneOf(v,k,list){const s=need(v,k).toLowerCase();if(!list.includes(s))throw Error(`${k} must be one of: ${list.join(', ')}`);return s;}

const MATCH={
 deal:{table:'deals',label:r=>`${r.id} ${r.name} (${r.stage})`,sql:`SELECT d.* FROM deals d JOIN orgs o ON o.id=d.org_id WHERE d.id::text LIKE $2 OR lower(d.name)=lower($1) OR lower(d.name) LIKE $3 OR lower(o.name)=lower($1) ORDER BY d.name`},
 org:{table:'orgs',label:r=>`${r.id} ${r.name} (${r.kind})`,sql:`SELECT * FROM orgs WHERE id::text LIKE $2 OR lower(name)=lower($1) OR lower(name) LIKE $3 ORDER BY name`},
 person:{table:'people',label:r=>`${r.id} ${r.full_name} ${r.email||''}`,sql:`SELECT * FROM people WHERE id::text LIKE $2 OR lower(email)=lower($1) OR lower(full_name)=lower($1) OR lower(full_name) LIKE $3 ORDER BY full_name`}
};
// Exact name wins over a partial one, so "Tidewater Seed" never collides with "Tidewater Seed Extension".
export async function match(db,kind,ref){
 ref=need(ref,kind==='deal'?'ref':kind==='org'?'company':'person');const m=MATCH[kind];
 const rows=await db.query(m.sql,[ref,/^[0-9a-f-]{4,}$/i.test(ref)?ref.toLowerCase()+'%':'no-id-match',`%${ref.toLowerCase().replace(/[%_\\]/g,'\\$&')}%`]);
 const exact=rows.filter(r=>[r.name,r.full_name,r.email].some(x=>x&&x.toLowerCase()===ref.toLowerCase()));
 const hit=exact.length===1?exact:rows;
 if(hit.length!==1)throw Error(hit.length?`Ambiguous ${kind} "${ref}". Use the full name or an id:\n${hit.map(m.label).join('\n')}`:`No ${kind} matches "${ref}"`);
 return hit[0];
}
async function tx(db,fn,dry=false){await db.exec('BEGIN');try{const r=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return r;}catch(e){await db.exec('ROLLBACK');throw e;}}
async function audit(db,record,id,action,actor,before,after,evidence){await db.query('INSERT INTO activity(record,record_id,action,actor,before_data,after_data,evidence) VALUES($1,$2,$3,$4,$5,$6,$7)',[record,id,action,actor,before?JSON.stringify(before):null,after?JSON.stringify(after):null,evidence]);}
async function insert(db,t,row){const k=Object.keys(row);return (await db.query(`INSERT INTO ${t}(${k.join(',')}) VALUES(${k.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING *`,Object.values(row)))[0];}
async function patch(db,t,id,row){const k=Object.keys(row);return (await db.query(`UPDATE ${t} SET ${k.map((x,i)=>`${x}=$${i+1}`).join(',')} WHERE id=$${k.length+1} RETURNING *`,[...Object.values(row),id]))[0];}

const reads={
 list:`SELECT d.id,d.name AS deal,o.name AS company,d.stage,d.owner,d.pipeline FROM deals d JOIN orgs o ON o.id=d.org_id ORDER BY ${ORDER},d.name`,
 pipeline:`SELECT deal,company,stage,owner,currency,round_size,our_cheque,days_in_stage,days_quiet,next_step,next_step_due FROM v_pipeline ORDER BY ${ORDER},days_in_stage DESC`,
 stale:`SELECT deal,company,stage,owner,last_touch,days_quiet FROM v_pipeline WHERE last_touch IS NULL OR days_quiet>21 ORDER BY days_quiet DESC NULLS FIRST,deal`,
 'next-steps':`SELECT deal,owner,next_step,next_step_due,next_step_due-current_date AS days_left FROM v_pipeline WHERE next_step_due<=current_date+7 ORDER BY next_step_due,deal`,
 sources:`SELECT * FROM v_sources ORDER BY invested DESC,reached_diligence DESC,deals DESC,source`,
 passes:`SELECT d.name AS deal,o.name AS company,d.stage_since AS passed_on,d.pass_reason,d.owner FROM deals d JOIN orgs o ON o.id=d.org_id WHERE d.stage='passed' ORDER BY d.stage_since DESC,d.name`,
 ndas:`SELECT company,deal,status,signed_on,expires_on,state FROM v_ndas ORDER BY expires_on NULLS LAST,company`,
 'ic-queue':`SELECT d.name AS deal,d.stage,d.currency,d.our_cheque,i.met_on AS last_ic,i.decision,i.conditions FROM deals d LEFT JOIN LATERAL (SELECT * FROM ic_decisions WHERE deal_id=d.id ORDER BY met_on DESC,created_at DESC LIMIT 1) i ON true WHERE d.stage IN ('ic','term sheet') ORDER BY d.stage_since,d.name`,
 portfolio:`SELECT p.company,p.owner,p.last_period,p.last_received,p.next_due,p.reporting,(SELECT string_agg(metric||' '||value||' '||unit,'; ' ORDER BY metric) FROM kpis k WHERE k.org_id=p.id AND k.period=p.last_period) AS latest_figures FROM v_portfolio p ORDER BY p.company`,
 'kpis-due':`SELECT company,owner,last_received,next_due,reporting FROM v_portfolio WHERE reporting<>'on time' ORDER BY next_due NULLS FIRST,company`,
 fundraise:`SELECT * FROM v_fundraise ORDER BY fund,currency,array_position(ARRAY['committed','soft','target','declined'],status)`,
 certificates:`SELECT investor,country,fund,status,certificate,certificate_on,relied_on_until,certificate_state FROM v_certificates ORDER BY relied_on_until NULLS FIRST,investor`,
 attention:`SELECT item,issue,detail FROM v_attention ORDER BY issue,item`,
 compliance:`SELECT rule,item,finding FROM v_compliance ORDER BY rule,item`,
 activity:`SELECT created_at,record,action,actor,evidence FROM activity ORDER BY created_at DESC,id DESC LIMIT 100`
};

// Affinity's documented list export columns (support.affinity.co, "How to export data from your Affinity lists").
const AFFINITY={
 organizations:{id:'Organization ID',name:'Organization Name',fields:['Affinity Row ID','Organization ID','Organization Name','Website','Date Added','Amount','Owners','Status','Time in Current Status','People']},
 opportunities:{id:'Opportunity ID',name:'Opportunity Name',fields:['Affinity Row ID','Opportunity ID','Opportunity Name','Close Date','Date Added','Amount','Owners','Status','Time in Current Status','People','Organizations']},
 people:{id:'Person ID',name:'Full Name',fields:['Affinity Row ID','Person ID','Full Name','First Name','Last Name','Email Addresses','Primary Email','Date Added','Amount','Owners','Status','Time in Current Status','Organizations']}
};
const first=v=>String(v||'').split(/;|\r?\n/).map(s=>s.trim()).filter(Boolean)[0]||null;
function affinityDate(v,k){const s=String(v||'').trim();if(!s)return null;const iso=s.slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(iso))return date(iso,k);const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(m)throw Error(`${k} "${s}" is day/month ambiguous; re-export with ISO dates or map it first`);throw Error(`${k} "${s}" is not a date`);}
function affinityAmount(v){const s=String(v||'').replace(/[$,\s]|NZD|AUD|USD/gi,'');if(!s)return null;const n=Number(s);if(!Number.isFinite(n)||n<0)throw Error(`Amount "${v}" is not a number`);return n;}

async function importAffinity(db,o,actor){
 const list=oneOf(o.list,'list',Object.keys(AFFINITY));const spec=AFFINITY[list];
 const filename=path.resolve(need(o.file,'file'));const input=fs.readFileSync(filename,'utf8');const rows=parseCsv(input);if(!rows.length)throw Error('No data rows');
 const map=o.map?JSON.parse(fs.readFileSync(path.resolve(o.map),'utf8')):{};
 const statuses=Object.fromEntries(Object.entries(map.statuses||{}).map(([k,v])=>[k.toLowerCase(),stage(v)]));
 const cols=map.columns||{};const col=(row,name)=>pick(row,...(cols[name]?[cols[name]]:[]),name);
 if(!Object.keys(rows[0]).some(h=>h===spec.id||h===cols[spec.id]))throw Error(`This file has no "${spec.id}" column. Is it an Affinity ${list} list export? Columns found: ${Object.keys(rows[0]).join(', ')}`);
 const currency=o.currency?cur(o.currency):'NZD';const seen=new Set();let inserted=0,updated=0,unchanged=0;
 return tx(db,async()=>{
  for(const [i,row] of rows.entries()){
   const line=i+2,aid=need(col(row,spec.id),`${spec.id} in row ${line}`);if(seen.has(aid))throw Error(`Duplicate ${spec.id} ${aid} in row ${line}`);seen.add(aid);
   const name=need(col(row,spec.name),`${spec.name} in row ${line}`);let t,out;
   if(list==='organizations'){t='orgs';out={name,website:col(row,'Website')||null,owner:first(col(row,'Owners'))};}
   if(list==='people'){t='people';const email=first(col(row,'Primary Email'))||first(col(row,'Email Addresses'));const orgName=first(col(row,'Organizations'));
    const org=orgName?(await db.query('SELECT id FROM orgs WHERE lower(name)=lower($1)',[orgName]))[0]:null;
    out={full_name:name,email:email||null,org_id:org?.id||null,owner:first(col(row,'Owners'))};}
   if(list==='opportunities'){t='deals';const raw=String(col(row,'Status')||'').trim();const st=raw?(statuses[raw.toLowerCase()]||STATUS_ALIASES[raw.toLowerCase()]):'sourced';
    if(!st)throw Error(`Row ${line}: Affinity status "${raw}" has no stage. Add it to the map file under "statuses"`);
    const orgName=first(col(row,'Organizations'))||name;let org=(await db.query('SELECT * FROM orgs WHERE lower(name)=lower($1)',[orgName]))[0];
    if(!org){org=await insert(db,'orgs',{name:orgName,source:JSON.stringify({created_by_import:path.basename(filename)})});await audit(db,'orgs',org.id,'import affinity company',actor,null,org,path.basename(filename));}
    out={name,org_id:org.id,stage:st,owner:first(col(row,'Owners')),round_size:affinityAmount(col(row,'Amount')),currency,
     added_on:affinityDate(col(row,'Date Added'),'Date Added')||today(),close_date:affinityDate(col(row,'Close Date'),'Close Date')};
    if(st==='passed')out.pass_reason=`Imported as "${raw}" from Affinity; reason not in export`;}
   const old=(await db.query(`SELECT * FROM ${t} WHERE affinity_id=$1`,[aid]))[0];
   const same=old&&Object.entries(out).every(([k,v])=>String(old[k]??'')===String(v??''))&&JSON.stringify(Object.entries(old.source).sort())===JSON.stringify(Object.entries(row).sort());
   if(same){unchanged++;continue;}
   if(old&&!o.update)throw Error(`Row ${line} (${name}) differs from the record already imported. Review it, then re-run with --update`);
   let rec;
   if(old){if(t==='deals'&&out.stage===old.stage)delete out.added_on;if(t==='deals'&&out.stage!==old.stage)out.stage_since=today();rec=await patch(db,t,old.id,{...out,source:JSON.stringify(row)});updated++;}
   else{rec=await insert(db,t,{...out,affinity_id:aid,source:JSON.stringify(row)});inserted++;}
   await audit(db,t,rec.id,`import affinity ${list}`,actor,old,rec,path.basename(filename));
  }
  await db.query('INSERT INTO imports(filename,sha256,kind,row_count,actor) VALUES($1,$2,$3,$4,$5)',[path.basename(filename),createHash('sha256').update(input).digest('hex'),`affinity ${list}`,rows.length,actor]);
  return {list,rows:rows.length,inserted,updated,unchanged,dry_run:Boolean(o['dry-run'])};
 },Boolean(o['dry-run']));
}

function draftFile(name,html){return writeOut('drafts',`${name}-${Date.now()}`,html);}

export async function run(db,cmd,o={},args=[]){
 if(!commands.includes(cmd))throw Error(`Unknown command "${cmd}". Run help for the list`);
 if(cmd==='help')return commands.map(command=>({command}));
 if(cmd==='intro-paths'){if(o.ref){const d=await match(db,'deal',o.ref);return db.query('SELECT deal,company,person,title,last_spoke_with_us,last_touch,introduced_by FROM v_intro_paths WHERE deal_id=$1 ORDER BY last_touch DESC NULLS LAST',[d.id]);}
  return db.query('SELECT deal,company,person,title,last_spoke_with_us,last_touch,introduced_by FROM v_intro_paths ORDER BY deal,last_touch DESC NULLS LAST');}
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='show'){const d=await match(db,'deal',o.ref);return {
  deal:(await db.query('SELECT d.*,o.name AS company FROM deals d JOIN orgs o ON o.id=d.org_id WHERE d.id=$1',[d.id]))[0],
  touches:await db.query('SELECT t.happened_on,t.kind,p.full_name AS person,t.summary,t.actor FROM touches t LEFT JOIN people p ON p.id=t.person_id WHERE t.deal_id=$1 OR t.org_id=$2 OR t.person_id IN (SELECT id FROM people WHERE org_id=$2) ORDER BY t.happened_on DESC',[d.id,d.org_id]),
  ndas:await db.query('SELECT status,signed_on,expires_on,state FROM v_ndas WHERE org_id=$1',[d.org_id]),
  committee:await db.query('SELECT met_on,decision,amount,currency,conditions,present FROM ic_decisions WHERE deal_id=$1 ORDER BY met_on',[d.id]),
  follow_ups:await db.query('SELECT id,note,due,resolved FROM follow_ups WHERE deal_id=$1 ORDER BY due',[d.id])};}
 if(cmd==='weekly-review')return {pipeline:await run(db,'pipeline'),attention:await run(db,'attention'),next_steps:await run(db,'next-steps'),fundraise:await run(db,'fundraise')};
 if(cmd==='export'){
  const dir=path.resolve(o.out||path.join(REPO_ROOT,'exports',new Date().toISOString().replace(/[:.]/g,'-')));fs.mkdirSync(dir,{recursive:true});const out=[];
  for(const t of ['orgs','people','deals','touches','ndas','ic_decisions','kpis','commitments','follow_ups','activity','imports']){const file=path.join(dir,t+'.json');if(fs.existsSync(file))throw Error(`Export already exists: ${file}`);const rows=await db.query(`SELECT * FROM ${t} ORDER BY id`);fs.writeFileSync(file,JSON.stringify(rows,null,2)+'\n');out.push({records:t,count:rows.length,file});}
  return out;
 }
 if(cmd==='draft-ic-memo'){const s=await run(db,'show',{ref:o.ref});const d=s.deal;
  const file=draftFile(`ic-memo-${d.id.slice(0,8)}`,page({title:`Investment committee memo: ${d.name}`,subtitle:'DRAFT for the deal lead to complete. Nothing has been sent.',sections:[
   {title:'The deal',html:htmlTable([{company:d.company,stage:d.stage,currency:d.currency,round_size:d.round_size,our_cheque:d.our_cheque,pre_money:d.pre_money,owner:d.owner}])},
   {title:'Thesis and risks',html:'<p>For the deal lead to write. Every claim needs a source in the deal folder.</p>'},
   {title:'Every touch so far',html:htmlTable(s.touches)},{title:'Confidentiality',html:htmlTable(s.ndas)},{title:'Earlier committee decisions',html:htmlTable(s.committee)}]}));
  return {file,deal:d.name};}
 if(cmd==='draft-investor-update'){const fund=need(o.fund,'fund');
  const commits=await db.query(`SELECT o.name AS investor,c.status,c.amount,c.currency FROM commitments c JOIN orgs o ON o.id=c.investor_id WHERE c.fund=$1 AND c.status IN ('soft','committed') ORDER BY o.name`,[fund]);
  if(!commits.length)throw Error(`No soft or committed investors in "${fund}"`);
  const file=draftFile(`investor-update-${fund.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,page({title:`${fund}: quarterly investor update`,subtitle:'DRAFT. Check every figure before it goes out. Nothing has been sent.',sections:[
   {title:'Portfolio reporting',html:htmlTable(await run(db,'portfolio'))},{title:'New investments this quarter',html:htmlTable(await db.query(`SELECT d.name AS deal,d.currency,d.our_cheque,d.stage_since AS closed_on FROM deals d WHERE d.stage='closed' AND d.stage_since>=current_date-92 ORDER BY d.stage_since`))},
   {title:'Pipeline by stage',html:htmlTable(await db.query(`SELECT stage,count(*) AS deals FROM v_pipeline GROUP BY stage ORDER BY ${ORDER}`))},{title:'Recipients (for the sender to confirm)',html:htmlTable(commits)}]}));
  return {file,fund,recipients:commits.length};}
 if(cmd==='draft-follow-up'){const s=await run(db,'show',{ref:o.ref});const d=s.deal;const last=s.touches[0];
  const person=(await db.query('SELECT full_name,email FROM people WHERE org_id=$1 ORDER BY created_at LIMIT 1',[d.org_id]))[0];
  const body=`To: ${person?.email||'(no contact on file)'}\nSubject: ${d.name}: next step\n\nHi ${person?.full_name?.split(' ')[0]||'there'},\n\n${last?`Thanks again for the ${last.kind} on ${last.happened_on}.`:'Following up on our conversation.'} ${d.next_step?`The next step on our side is: ${d.next_step.charAt(0).toLowerCase()+d.next_step.slice(1)}.`:'What would be most useful from us next?'}\n\n${d.owner||''}\n\nDRAFT. Not sent. Edit before sending.\n`;
  const file=path.join(path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts'),`follow-up-${d.id.slice(0,8)}-${Date.now()}.txt`);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,body);return {file,to:person?.email||null};}

 const actor=need(o.actor,'actor');
 if(cmd==='import'){if(args[0]!=='affinity')throw Error('Import supports: import affinity --list=organizations|opportunities|people --file=...');return importAffinity(db,o,actor);}
 return tx(db,async()=>{
  if(cmd==='add-org'){const row={name:need(o.name,'name'),kind:o.kind?oneOf(o.kind,'kind',['target','portfolio','investor','adviser','other']):'target'};
   if(o.country){row.country=need(o.country,'country').toUpperCase();if(!/^[A-Z]{2}$/.test(row.country))throw Error('country must be a two-letter code such as NZ or AU');}
   for(const k of ['website','sector','owner'])if(o[k]!==undefined)row[k]=need(o[k],k);if(o.listed!==undefined)row.listed=bool(o.listed,'listed');
   if(o['reporting-days']!==undefined){row.reporting_days=num(o['reporting-days'],'reporting-days');if(!Number.isInteger(row.reporting_days)||row.reporting_days<1)throw Error('reporting-days must be a whole number above 0');}
   const r=await insert(db,'orgs',row);await audit(db,'orgs',r.id,cmd,actor,null,r,'manual entry');return r;}
  if(cmd==='add-person'){const row={full_name:need(o.name,'name')};if(o.email)row.email=need(o.email,'email');if(o.company)row.org_id=(await match(db,'org',o.company)).id;
   for(const k of ['title','owner'])if(o[k]!==undefined)row[k]=need(o[k],k);const r=await insert(db,'people',row);await audit(db,'people',r.id,cmd,actor,null,r,'manual entry');return r;}
  if(cmd==='add'){const org=await match(db,'org',o.company);const row={name:need(o.name,'name'),org_id:org.id,owner:need(o.owner??actor,'owner')};
   if(o.stage){row.stage=stage(o.stage);if(row.stage==='passed')throw Error('Add the deal, then use pass with a reason');}
   if(o.currency)row.currency=cur(o.currency);for(const k of ['round-size','our-cheque','pre-money'])if(o[k]!==undefined)row[k.replace(/-/g,'_')]=num(o[k],k);
   if(o.source)row.source_person_id=(await match(db,'person',o.source)).id;if(o['source-note'])row.source_note=need(o['source-note'],'source-note');
   if(o['next-step']){row.next_step=need(o['next-step'],'next-step');row.next_step_due=date(o['next-step-due'],'next-step-due');}
   const r=await insert(db,'deals',row);await audit(db,'deals',r.id,cmd,actor,null,r,'manual entry');return r;}
  if(cmd==='resolve'){const ref=need(o['follow-up'],'follow-up');const f=await db.query('SELECT * FROM follow_ups WHERE id::text LIKE $1',[ref.toLowerCase()+'%']);
   if(f.length!==1)throw Error(f.length?`More than one follow-up starts with ${ref}: ${f.map(x=>x.id).join(', ')}`:`No follow-up ${ref}`);
   const r=await patch(db,'follow_ups',f[0].id,{resolved:true});await audit(db,'follow_ups',r.id,cmd,actor,f[0],r,need(o.evidence,'evidence'));return r;}
  if(cmd==='nda'){const org=await match(db,'org',o.company);const row={org_id:org.id,status:oneOf(o.status,'status',['requested','signed','returned','expired']),evidence:need(o.evidence,'evidence')};
   if(o.deal)row.deal_id=(await match(db,'deal',o.deal)).id;if(o.signed)row.signed_on=date(o.signed,'signed');if(o.expires)row.expires_on=date(o.expires,'expires');
   if(row.status==='signed'&&!row.signed_on)throw Error('A signed NDA needs --signed=YYYY-MM-DD');const r=await insert(db,'ndas',row);await audit(db,'ndas',r.id,cmd,actor,null,r,row.evidence);return r;}
  if(cmd==='kpi'){const org=await match(db,'org',o.company);if(org.kind!=='portfolio')throw Error(`${org.name} is not a portfolio company`);
   const row={org_id:org.id,period:date(o.period,'period'),metric:need(o.metric,'metric'),value:Number(need(o.value,'value')),unit:need(o.unit,'unit'),received_on:o.received?date(o.received,'received'):today(),evidence:need(o.evidence,'evidence')};
   if(!Number.isFinite(row.value))throw Error('value must be a number');if(row.received_on>today())throw Error('received cannot be in the future');
   const old=(await db.query('SELECT * FROM kpis WHERE org_id=$1 AND period=$2 AND metric=$3',[org.id,row.period,row.metric]))[0];
   if(old&&!o.update)throw Error(`${row.metric} for ${row.period} is already recorded (${old.value}). Re-run with --update to replace it`);
   const r=old?await patch(db,'kpis',old.id,row):await insert(db,'kpis',row);await audit(db,'kpis',r.id,cmd,actor,old,r,row.evidence);return r;}
  if(cmd==='commit'){const inv=await match(db,'org',o.investor);if(inv.kind!=='investor')throw Error(`${inv.name} is not an investor. Add it with add-org --kind=investor`);
   const fund=need(o.fund,'fund');const old=(await db.query('SELECT * FROM commitments WHERE investor_id=$1 AND fund=$2',[inv.id,fund]))[0];const row={};
   if(o.status||!old)row.status=oneOf(o.status,'status',['target','soft','committed','declined']);if(o.amount!==undefined)row.amount=num(o.amount,'amount');if(o.currency)row.currency=cur(o.currency);
   if(o.certificate){row.certificate=oneOf(o.certificate,'certificate',['none','nz-safe-harbour','nz-eligible','au-s708-accountant','other']);if(row.certificate!=='none')row.certificate_on=date(o['certificate-on'],'certificate-on');else row.certificate_on=null;}
   if(o['next-step-due'])row.next_step_due=date(o['next-step-due'],'next-step-due');if(o.owner)row.owner=need(o.owner,'owner');
   if(!Object.keys(row).length)throw Error('Nothing to change');
   const r=old?await patch(db,'commitments',old.id,row):await insert(db,'commitments',{investor_id:inv.id,fund,...row});await audit(db,'commitments',r.id,cmd,actor,old,r,need(o.evidence,'evidence'));return r;}
  if(cmd==='log'){const row={kind:oneOf(o.kind??'note','kind',['meeting','call','email','note','intro']),summary:need(o.summary,'summary'),happened_on:o.date?date(o.date,'date'):today(),actor};
   if(row.happened_on>today())throw Error('A touch cannot be in the future; use follow-up for planned work');
   if(o.ref)row.deal_id=(await match(db,'deal',o.ref)).id;if(o.company)row.org_id=(await match(db,'org',o.company)).id;if(o.person)row.person_id=(await match(db,'person',o.person)).id;
   if(!row.deal_id&&!row.org_id&&!row.person_id)throw Error('Say what this touch is about: --ref (deal), --company or --person');
   if(o.connector){if(row.kind!=='intro')throw Error('--connector only applies to --kind=intro');row.connector_id=(await match(db,'person',o.connector)).id;}
   const r=await insert(db,'touches',row);await audit(db,'touches',r.id,cmd,actor,null,r,row.summary);return r;}
  if(cmd==='follow-up'){const row={note:need(o.note,'note'),due:date(o.due,'due'),actor};if(o.ref)row.deal_id=(await match(db,'deal',o.ref)).id;if(o.company)row.org_id=(await match(db,'org',o.company)).id;
   if(!row.deal_id&&!row.org_id)throw Error('Say what this follow-up is about: --ref (deal) or --company');const r=await insert(db,'follow_ups',row);await audit(db,'follow_ups',r.id,cmd,actor,null,r,row.note);return r;}
  let d=await match(db,'deal',o.ref);d=(await db.query('SELECT * FROM deals WHERE id=$1 FOR UPDATE',[d.id]))[0];
  if(cmd==='move'){const st=stage(o.stage);if(st==='passed')throw Error('Use pass with --reason to pass on a deal');if(st===d.stage)throw Error(`${d.name} is already at ${st}`);
   const r=await patch(db,'deals',d.id,{stage:st,stage_since:today()});await audit(db,'deals',d.id,cmd,actor,d,r,need(o.evidence,'evidence'));return r;}
  if(cmd==='pass'){if(d.stage==='passed')throw Error(`${d.name} is already passed`);const r=await patch(db,'deals',d.id,{stage:'passed',stage_since:today(),pass_reason:need(o.reason,'reason'),next_step:null,next_step_due:null});
   await audit(db,'deals',d.id,cmd,actor,d,r,o.reason);return r;}
  if(cmd==='ic'){const row={deal_id:d.id,met_on:date(o.met??today(),'met'),decision:oneOf(o.decision,'decision',['invest','decline','more information']),present:need(o.present,'present'),actor};
   if(o.amount!==undefined)row.amount=num(o.amount,'amount');if(o.currency)row.currency=cur(o.currency);if(o.conditions)row.conditions=need(o.conditions,'conditions');
   if(row.decision==='invest'&&(row.amount===undefined||!row.currency))throw Error('An invest decision needs --amount and --currency');
   const r=await insert(db,'ic_decisions',row);await audit(db,'ic_decisions',r.id,cmd,actor,null,r,`Committee of ${row.present}`);return r;}
  if(cmd==='update'){const row={};
   for(const k of ['owner','pipeline','next-step','source-note'])if(o[k]!==undefined)row[k.replace(/-/g,'_')]=o[k]==='null'?null:need(o[k],k);
   for(const k of ['round-size','our-cheque','pre-money'])if(o[k]!==undefined)row[k.replace(/-/g,'_')]=o[k]==='null'?null:num(o[k],k);
   for(const k of ['next-step-due','close-date'])if(o[k]!==undefined)row[k.replace(/-/g,'_')]=o[k]==='null'?null:date(o[k],k);
   if(o.currency)row.currency=cur(o.currency);if(o.restricted!==undefined)row.restricted=bool(o.restricted,'restricted');if(o.name)row.name=need(o.name,'name');
   if(!Object.keys(row).length)throw Error('No fields to change');const r=await patch(db,'deals',d.id,row);await audit(db,'deals',d.id,cmd,actor,d,r,need(o.evidence,'evidence'));return r;}
  throw Error(`Unsupported command ${cmd}`);
 });
}

const FLAGS=new Set(['json','ref','actor','name','company','person','email','title','owner','kind','country','website','sector','listed','reporting-days','stage','currency','round-size','our-cheque','pre-money','source','source-note','next-step','next-step-due','close-date','pipeline','restricted','evidence','reason','summary','date','connector','note','due','follow-up','status','signed','expires','deal','met','decision','amount','conditions','present','period','metric','value','unit','received','investor','fund','certificate','certificate-on','update','file','list','map','dry-run','out']);
const BOOL=new Set(['json','update','dry-run']);
export function parse(argv){const args=[],o={};for(let i=0;i<argv.length;i++){const a=argv[i];if(!a.startsWith('--')){args.push(a);continue;}
 const eq=a.indexOf('=');const k=eq<0?a.slice(2):a.slice(2,eq);if(!FLAGS.has(k))throw Error(`Unknown flag --${k}`);
 if(BOOL.has(k)){if(eq>=0)throw Error(`--${k} takes no value`);o[k]=true;continue;}
 const v=eq>=0?a.slice(eq+1):argv[++i];if(v===undefined||(eq<0&&v.startsWith('--')))throw Error(`Missing value for --${k}`);o[k]=v;}
 return {cmd:args.shift()||'help',args,o};}
function display(result){
 if(Array.isArray(result))return result.length?table(result,Object.keys(result[0]).map(key=>({key,label:key,width:60,format:v=>v&&typeof v==='object'?JSON.stringify(v):v}))):'(none)';
 return Object.entries(result).map(([k,v])=>Array.isArray(v)?`\n${k.replace(/_/g,' ')}\n${display(v)}`:v&&typeof v==='object'?`\n${k}\n${display([v])}`:`${k}: ${v}`).join('\n').trim();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{const {cmd,args,o}=parse(process.argv.slice(2));db=await getDb();const r=await run(db,cmd,o,args);console.log(o.json?JSON.stringify(r,null,2):display(r));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
