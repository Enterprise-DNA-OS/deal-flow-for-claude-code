-- Fictional demo: a small NZ and AU seed fund, Harbour Seed Partners. Dates are relative to today.
-- Deliberately untidy: a deal gone quiet, an overdue next step, an NDA about to lapse, a listed target
-- missing from the restricted list, a late portfolio report, an expired investor certificate.
INSERT INTO orgs(id,name,website,sector,country,kind,listed,reporting_days,owner) VALUES
('10000000-0000-4000-8000-000000000001','Tidewater Analytics','tidewater.example','Software','NZ','target',false,NULL,'Aroha'),
('10000000-0000-4000-8000-000000000002','Kowhai Robotics','kowhai.example','Robotics','NZ','target',false,NULL,'Ben'),
('10000000-0000-4000-8000-000000000003','Southern Grid Energy','southerngrid.example','Energy','AU','target',true,NULL,'Aroha'),
('10000000-0000-4000-8000-000000000004','Ferncliff Health','ferncliff.example','Health','AU','target',false,NULL,'Ben'),
('10000000-0000-4000-8000-000000000005','Paddock Labs','paddock.example','Agritech','NZ','portfolio',false,90,'Aroha'),
('10000000-0000-4000-8000-000000000006','Larchmont Software','larchmont.example','Software','AU','portfolio',false,90,'Ben'),
('10000000-0000-4000-8000-000000000007','Rata Foods','rata.example','Food','NZ','target',false,NULL,'Ben'),
('10000000-0000-4000-8000-000000000008','Brightline Logistics','brightline.example','Logistics','AU','target',false,NULL,'Aroha'),
('10000000-0000-4000-8000-000000000009','Moana Corporate Finance','moanacf.example','Advisory','NZ','adviser',false,NULL,'Aroha'),
('10000000-0000-4000-8000-000000000010','Waitakere Family Office','waitakere.example','Family office','NZ','investor',false,NULL,'Aroha'),
('10000000-0000-4000-8000-000000000011','Coral Bay Super Fund','coralbay.example','Superannuation','AU','investor',false,NULL,'Ben'),
('10000000-0000-4000-8000-000000000012','Hilltop Angels Trust','hilltop.example','Angel network','NZ','investor',false,NULL,'Aroha'),
('10000000-0000-4000-8000-000000000013','Ironbark Capital','ironbark.example','Fund of funds','AU','investor',false,NULL,'Ben')
ON CONFLICT DO NOTHING;

INSERT INTO people(id,full_name,email,org_id,title,owner,created_at) VALUES
('20000000-0000-4000-8000-000000000001','Mere Tane','mere@tidewater.example','10000000-0000-4000-8000-000000000001','Founder and CEO','Aroha',now()),
('20000000-0000-4000-8000-000000000002','Sam Okafor','sam@kowhai.example','10000000-0000-4000-8000-000000000002','Founder','Ben',now()),
('20000000-0000-4000-8000-000000000003','Lucy Chen','lucy@southerngrid.example','10000000-0000-4000-8000-000000000003','CFO','Aroha',now()),
('20000000-0000-4000-8000-000000000004','Daniel Ross','daniel@ferncliff.example','10000000-0000-4000-8000-000000000004','Founder and CEO','Ben',now()),
('20000000-0000-4000-8000-000000000005','Hemi Walker','hemi@paddock.example','10000000-0000-4000-8000-000000000005','CEO','Aroha',now()),
('20000000-0000-4000-8000-000000000006','Grace Lin','grace@larchmont.example','10000000-0000-4000-8000-000000000006','CEO','Ben',now()),
('20000000-0000-4000-8000-000000000007','Priya Raman','priya@moanacf.example','10000000-0000-4000-8000-000000000009','Director','Aroha',now()),
('20000000-0000-4000-8000-000000000008','Tom Bradley','tom@rata.example','10000000-0000-4000-8000-000000000007','Founder','Ben',now()),
('20000000-0000-4000-8000-000000000009','Graham Hollis','graham@brightline.example','10000000-0000-4000-8000-000000000008','Former COO','Aroha',now()-interval '5 years')
ON CONFLICT DO NOTHING;

INSERT INTO deals(id,name,org_id,stage,stage_since,owner,source_person_id,source_note,currency,round_size,our_cheque,pre_money,next_step,next_step_due,pass_reason,added_on) VALUES
('30000000-0000-4000-8000-000000000001','Tidewater Seed','10000000-0000-4000-8000-000000000001','diligence',current_date-12,'Aroha','20000000-0000-4000-8000-000000000007',NULL,'NZD',2500000,750000,9000000,'Customer reference calls',current_date+5,NULL,current_date-60),
('30000000-0000-4000-8000-000000000002','Kowhai Robotics Series A','10000000-0000-4000-8000-000000000002','first meeting',current_date-40,'Ben',NULL,'Inbound via website','NZD',6000000,1000000,NULL,'Send data room request',current_date-4,NULL,current_date-45),
('30000000-0000-4000-8000-000000000003','Southern Grid placement','10000000-0000-4000-8000-000000000003','diligence',current_date-9,'Aroha','20000000-0000-4000-8000-000000000007',NULL,'AUD',15000000,500000,NULL,'Model review with CFO',current_date+2,NULL,current_date-20),
('30000000-0000-4000-8000-000000000004','Ferncliff Health Seed','10000000-0000-4000-8000-000000000004','ic',current_date-6,'Ben',NULL,'Partner network','AUD',3000000,600000,12000000,'Answer committee questions on reimbursement',current_date+3,NULL,current_date-70),
('30000000-0000-4000-8000-000000000005','Paddock Labs Seed','10000000-0000-4000-8000-000000000005','closed',current_date-400,'Aroha','20000000-0000-4000-8000-000000000007',NULL,'NZD',2000000,500000,6000000,NULL,NULL,NULL,current_date-480),
('30000000-0000-4000-8000-000000000006','Larchmont Pre-Series A','10000000-0000-4000-8000-000000000006','closed',current_date-200,'Ben',NULL,'Co-investor referral','AUD',4000000,800000,16000000,NULL,NULL,NULL,current_date-260),
('30000000-0000-4000-8000-000000000007','Rata Foods Seed','10000000-0000-4000-8000-000000000007','passed',current_date-15,'Ben',NULL,'Inbound via website','NZD',1500000,NULL,NULL,NULL,NULL,'Valuation above our range for the revenue',current_date-50),
('30000000-0000-4000-8000-000000000008','Brightline Series A','10000000-0000-4000-8000-000000000008','sourced',current_date-3,'Aroha',NULL,'Conference list','AUD',8000000,NULL,NULL,NULL,NULL,NULL,current_date-3)
ON CONFLICT DO NOTHING;

INSERT INTO touches(id,deal_id,org_id,person_id,kind,happened_on,summary,actor,connector_id) VALUES
('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',NULL,'20000000-0000-4000-8000-000000000001','intro',current_date-60,'Priya introduced Mere after the Moana sell-side review','Aroha','20000000-0000-4000-8000-000000000007'),
('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001',NULL,'20000000-0000-4000-8000-000000000001','meeting',current_date-3,'Walked through cohort retention; churn under 2 percent a month','Aroha',NULL),
('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002',NULL,'20000000-0000-4000-8000-000000000002','meeting',current_date-30,'First meeting; hardware margins still unclear','Ben',NULL),
('40000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000003',NULL,'20000000-0000-4000-8000-000000000003','call',current_date-5,'CFO call on the placement timetable','Aroha',NULL),
('40000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000004',NULL,'20000000-0000-4000-8000-000000000004','meeting',current_date-6,'Presented to the investment committee','Ben',NULL),
('40000000-0000-4000-8000-000000000006',NULL,'10000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000005','call',current_date-20,'Quarterly catch-up; board pack late','Aroha',NULL),
('40000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000007',NULL,'20000000-0000-4000-8000-000000000008','email',current_date-15,'Sent the pass note','Ben',NULL),
('40000000-0000-4000-8000-000000000008',NULL,NULL,'20000000-0000-4000-8000-000000000009','meeting',current_date-1500,'Coffee at the logistics summit','Aroha',NULL)
ON CONFLICT DO NOTHING;

INSERT INTO ndas(id,org_id,deal_id,status,signed_on,expires_on,evidence) VALUES
('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','signed',current_date-50,current_date+20,'Countersigned PDF in deal folder'),
('50000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000004','signed',current_date-65,current_date+300,'Countersigned PDF in deal folder')
ON CONFLICT DO NOTHING;

INSERT INTO ic_decisions(id,deal_id,met_on,decision,amount,currency,conditions,present,actor) VALUES
('60000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000005',current_date-410,'invest',500000,'NZD','Board seat; quarterly reporting within 30 days of quarter end','Aroha, Ben, Kate','Aroha'),
('60000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000004',current_date-6,'more information',NULL,NULL,'Reimbursement pathway and two clinician references','Aroha, Ben, Kate','Ben')
ON CONFLICT DO NOTHING;

INSERT INTO kpis(id,org_id,period,metric,value,unit,received_on,evidence) VALUES
('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000005',current_date-130,'Revenue',182000,'NZD',current_date-100,'Board pack'),
('70000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000005',current_date-130,'Cash',940000,'NZD',current_date-100,'Board pack'),
('70000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000006',current_date-40,'Revenue',415000,'AUD',current_date-20,'Monthly update email'),
('70000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000006',current_date-40,'Cash',2100000,'AUD',current_date-20,'Monthly update email')
ON CONFLICT DO NOTHING;

INSERT INTO commitments(id,investor_id,fund,status,amount,currency,certificate,certificate_on,owner,next_step_due) VALUES
('80000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000010','Fund II','committed',2000000,'NZD','nz-safe-harbour',current_date-750,'Aroha',NULL),
('80000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000011','Fund II','soft',3000000,'AUD','au-s708-accountant',current_date-700,'Ben',current_date+10),
('80000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000012','Fund II','committed',750000,'NZD','none',NULL,'Aroha',NULL),
('80000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000013','Fund II','target',5000000,'AUD','none',NULL,'Ben',current_date-3)
ON CONFLICT DO NOTHING;

INSERT INTO follow_ups(id,deal_id,org_id,note,due,actor) VALUES
('90000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002',NULL,'Ask for the hardware bill of materials',current_date-2,'Ben')
ON CONFLICT DO NOTHING;
