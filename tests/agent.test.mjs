// tests/agent.test.mjs — the agent rules (app/src/custom/agent/agent.js) on Prime Realty's own sample data.
//   node --test tests/agent.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../app/src/custom/agent/agent.js';

const NOW = Date.parse('2026-11-03T09:00:00Z');   // 14:30 IST
const PROPS = [
  { Property_ID: 'PR-001', Name: '3BHK Luxury Apartment', Type: 'Residential', Config: '3 BHK', Area_Name: 'Kolar Road', Price_Min_INR: 6500000, Price_Max_INR: 7500000, Status: 'Available' },
  { Property_ID: 'PR-002', Name: '2BHK Modern Flat', Type: 'Residential', Config: '2 BHK', Area_Name: 'Habibganj', Price_Min_INR: 4200000, Price_Max_INR: 4800000, Status: 'Available' },
  { Property_ID: 'PR-003', Name: '4BHK Premium Villa', Type: 'Residential', Config: '4 BHK', Area_Name: 'Chinar Park', Price_Min_INR: 12000000, Price_Max_INR: 15000000, Status: 'Booked' },
  { Property_ID: 'PR-004', Name: 'Commercial Shop Space', Type: 'Commercial', Config: 'Shop', Area_Name: 'DB Mall Road', Price_Min_INR: 2500000, Price_Max_INR: 3500000, Status: 'Available' },
  { Property_ID: 'PR-005', Name: 'Plot 200 sq.yd', Type: 'Plot', Config: 'Plot', Area_Name: 'Misrod', Price_Min_INR: 1800000, Price_Max_INR: 2200000, Status: 'Available' },
];
const BROKERS = [
  { Broker_ID: 'BR-001', Name: 'Rajesh Kumar', Phone: '+919800111001', Specialty: 'Residential', Status: 'Active' },
  { Broker_ID: 'BR-002', Name: 'Sunil Sharma', Phone: '+919800122002', Specialty: 'Commercial', Status: 'Active' },
  { Broker_ID: 'BR-003', Name: 'Meena Verma', Phone: '+919800133003', Specialty: 'Plots', Status: 'Active' },
];
const LEADS = [
  { Lead_ID: 'LD-2026-0141', Name: 'Ramesh Singh', Phone: '+919876543210', Stage: 'Engaged', AI_Mode: 'On', Area_Pref: 'Kolar Road', BHK: '3 BHK', Property_Type: 'Residential', Budget_Max_INR: 7500000, History: 'C: Hello, mujhe 3BHK flat dekhna hai\nA: Namaste!', Broker: '' },
  { Lead_ID: 'LD-2026-0139', Name: 'Ankit Sharma', Phone: '+917654321098', Stage: 'Engaged', AI_Mode: 'Off', History: '' },
  { Lead_ID: 'LD-2026-0135', Name: 'Aman Tiwari', Phone: '+919988776655', Stage: 'Booked', AI_Mode: 'On', History: 'C: hi' },
];
const CFG = { agent_name: 'Priya', company_name: 'Prime Realty India', city: 'Bhopal' };
const meta = (from, text) => ({ entry: [{ changes: [{ value: { contacts: [{ profile: { name: 'Neha' } }], messages: [{ from, id: 'wamid.1', type: 'text', text: { body: text } }] } }] }] });

test('WhatsApp bodies: Meta message, Meta status, Twilio, flat relay', () => {
  assert.deepEqual(A.normaliseWhatsApp(meta('919876543210', 'Bhai 3BHK ka price?')), { kind: 'message', phone: '+919876543210', name: 'Neha', text: 'Bhai 3BHK ka price?', wa_id: 'wamid.1' });
  assert.equal(A.normaliseWhatsApp({ entry: [{ changes: [{ value: { statuses: [{ status: 'read' }] } }] }] }).kind, 'skip');
  assert.equal(A.normaliseWhatsApp({ From: 'whatsapp:+919876543210', Body: 'hi' }).phone, '+919876543210');
  assert.equal(A.normaliseWhatsApp({ from: '9876543210', text: 'hello', name: 'X' }).phone, '+919876543210');
  assert.equal(A.normaliseWhatsApp({}).kind, 'skip');
});

test('VAPI: a caller turn and an end-of-call report', () => {
  assert.deepEqual(A.normaliseVapi({ from: '+914321098765', transcript: 'Haan 4BHK villa chahiye', call_id: 'c1' }), { kind: 'turn', phone: '+914321098765', call_id: 'c1', text: 'Haan 4BHK villa chahiye' });
  const end = A.normaliseVapi({ message: { type: 'end-of-call-report', call: { id: 'c1', customer: { number: '+914321098765' } }, artifact: { transcript: 'AI: Namaste', recordingUrl: 'https://r/1.mp3' }, durationSeconds: 262 } });
  assert.equal(end.kind, 'end'); assert.equal(end.duration_sec, 262); assert.equal(end.recording_url, 'https://r/1.mp3');
});

test('rupees are parsed in code, never by the model', () => {
  assert.deepEqual(A.parseInr('70 lakh ke around'), { min: 6300000, max: 7000000 });
  assert.deepEqual(A.parseInr('65-75L'), { min: 6500000, max: 7500000 });
  assert.deepEqual(A.parseInr('1.2 cr'), { min: 10800000, max: 12000000 });
  assert.deepEqual(A.parseInr('₹72,00,000'), { min: 6480000, max: 7200000 });
  assert.deepEqual(A.parseInr('no idea'), { min: 0, max: 0 });
});

test('ids and lead lookup', () => {
  assert.equal(A.nextId('LD-', LEADS, 'Lead_ID', NOW), 'LD-2026-0142');
  assert.equal(A.nextId('FU-', [], 'Followup_ID', NOW), 'FU-2026-0001');
  assert.equal(A.findLead(LEADS, '919876543210').Lead_ID, 'LD-2026-0141');
  assert.equal(A.findLead(LEADS, '+911111111111'), null);
});

test('R4: only Available properties, the right type first', () => {
  const m = A.matchProperties(PROPS, A.wants({}, '4BHK villa chahiye Chinar Park mein', PROPS));
  assert.ok(m.every((p) => p.Status === 'Available'));   // the Booked villa is never offered
  assert.equal(A.matchProperties(PROPS, A.wants({}, 'shop chahiye DB Mall Road', PROPS))[0].Name, 'Commercial Shop Space');
  assert.equal(A.matchProperties(PROPS, A.wants({}, 'plot 200 gaj Misrod', PROPS))[0].Name, 'Plot 200 sq.yd');
});

test('R6: broker by specialty; the lead\'s own broker wins', () => {
  assert.equal(A.assignBroker(BROKERS, { Lead_ID: 'LD-2026-0001' }, 'Commercial').Name, 'Sunil Sharma');
  assert.equal(A.assignBroker(BROKERS, { Lead_ID: 'LD-2026-0001' }, 'Plot').Name, 'Meena Verma');
  assert.equal(A.assignBroker(BROKERS, { Lead_ID: 'LD-2026-0001', Broker: 'Meena Verma' }, 'Residential').Name, 'Meena Verma');
  assert.equal(A.assignBroker([], { Lead_ID: 'x' }, 'Plot'), null);
});

test('R21: a taken-over lead is stored, not answered', () => {
  const p = A.prepareTurn({ msg: A.normaliseWhatsApp(meta('917654321098', 'Kal aa sakta hoon?')), channel: 'whatsapp', leadList: LEADS, propertyList: PROPS, cfg: CFG, now: NOW });
  assert.equal(p.route, 'office'); assert.equal(p.lead_id, 'LD-2026-0139'); assert.match(p.office_patch.History, /^C: Kal aa sakta hoon\?$/);
});

test('R1: a new number becomes a new lead; the prompt carries the data rule and only Available rows', () => {
  const p = A.prepareTurn({ msg: A.normaliseWhatsApp(meta('919000000001', '3BHK Kolar Road 70 lakh')), channel: 'whatsapp', leadList: LEADS, propertyList: PROPS, cfg: CFG, now: NOW });
  assert.equal(p.route, 'agent'); assert.equal(p.is_new, true); assert.equal(p.lead.Lead_ID, 'LD-2026-0142'); assert.equal(p.lead.Phone, '+919000000001');
  assert.ok(p.prompt.startsWith('DATA RULE')); assert.match(p.prompt, /Reply ONLY with JSON/); assert.match(p.prompt, /3BHK Luxury Apartment/);
  assert.doesNotMatch(p.prompt, /4BHK Premium Villa/);
});

test('model output: declared keys only, unknown intent → ask, garbage → safe question', () => {
  const a = A.parseAgent('```json\n{"intent":"book_visit","reply":"ok","owner":"me","price":"1"}\n```');
  assert.equal(a.intent, 'book_visit'); assert.equal(a.owner, undefined); assert.equal(a.price, undefined);
  assert.equal(A.parseAgent('{"intent":"delete_all"}').intent, 'ask');
  const prep = A.prepareTurn({ msg: { kind: 'message', phone: '+919876543210', text: 'hi' }, channel: 'whatsapp', leadList: LEADS, propertyList: PROPS, cfg: CFG, now: NOW });
  const f = A.finishTurn({ ai: A.parseAgent('not json at all'), prep, brokerList: BROKERS, propertyList: PROPS, channel: 'whatsapp', now: NOW });
  assert.equal(f.intent, 'ask'); assert.match(f.reply, /Namaste/);
});

test('R5/R6: an agreed visit → the VISITS call with the specialist broker; a vague one → a check question', () => {
  const prep = A.prepareTurn({ msg: { kind: 'message', phone: '+919876543210', text: 'Saturday 11 baje Kolar Road wala dekhna hai' }, channel: 'whatsapp', leadList: LEADS, propertyList: PROPS, cfg: CFG, now: NOW });
  const ok = A.finishTurn({ ai: A.parseAgent(JSON.stringify({ intent: 'book_visit', reply: 'Done! Rajesh ji call karenge.', property_name: '3BHK Luxury Apartment', visit_at: '2026-11-07 11:00', budget_text: '70 lakh' })), prep, brokerList: BROKERS, propertyList: PROPS, channel: 'whatsapp', now: NOW });
  assert.equal(ok.branch, 'old_book'); assert.equal(ok.visit.Broker, 'Rajesh Kumar'); assert.equal(ok.visit.To, '+919800111001');
  assert.equal(ok.visit.Visit_At, '2026-11-07T05:30:00.000Z'); assert.equal(ok.lead.Stage, 'Engaged'); assert.equal(ok.lead.Budget_Max_INR, 7000000);
  const vague = A.finishTurn({ ai: A.parseAgent(JSON.stringify({ intent: 'book_visit', reply: 'Booked!', property_name: '4BHK Premium Villa', visit_at: 'kal' })), prep, brokerList: BROKERS, propertyList: PROPS, channel: 'whatsapp', now: NOW });
  assert.equal(vague.intent, 'ask'); assert.equal(vague.visit, null); assert.doesNotMatch(vague.reply, /Booked!/);
});

test('a booked client asking for another visit is answered and flagged, never auto-booked', () => {
  const prep = A.prepareTurn({ msg: { kind: 'message', phone: '+919988776655', text: 'ek aur plot dikhao Sunday 10 baje' }, channel: 'whatsapp', leadList: LEADS, propertyList: PROPS, cfg: CFG, now: NOW });
  const f = A.finishTurn({ ai: A.parseAgent(JSON.stringify({ intent: 'book_visit', reply: 'Zaroor!', property_name: 'Plot 200 sq.yd', visit_at: '2026-11-08 10:00' })), prep, brokerList: BROKERS, propertyList: PROPS, channel: 'whatsapp', now: NOW });
  assert.equal(f.visit, null); assert.equal(f.lead.Stage, 'Booked'); assert.match(f.lead.Summary, /office to book by hand/);
});

test('R8: "baad mein" sets the follow-up reason on the lead', () => {
  const prep = A.prepareTurn({ msg: { kind: 'message', phone: '+919876543210', text: 'Abhi busy hoon, baad mein baat karte hain' }, channel: 'whatsapp', leadList: LEADS, propertyList: PROPS, cfg: CFG, now: NOW });
  const f = A.finishTurn({ ai: A.parseAgent('{"intent":"later","reply":"Bilkul ji!"}'), prep, brokerList: BROKERS, propertyList: PROPS, channel: 'whatsapp', now: NOW });
  assert.equal(f.lead.Followup_Reason, 'Busy'); assert.equal(f.lead.Next_Followup_At, '2026-11-04T09:00:00.000Z'); assert.match(f.lead.History, /A: Bilkul ji!$/);
});

test('R9/R22: follow-up run opens, sends, completes and marks replies', () => {
  const settings = [{ Key: 'followup_delay_hours', Value: '24' }, { Key: 'followup_interval_hours', Value: '24' }, { Key: 'followup_max', Value: '3' }, { Key: 'office_phone', Value: '+91 755 400 0000' }];
  const leads = [
    { Lead_ID: 'LD-1', Name: 'Mohit Jain', Phone: '+914321098765', Stage: 'Engaged', Followup_Reason: 'Asked for later', Last_Message_At: '2026-11-01T09:00:00Z' },   // opens + due now
    { Lead_ID: 'LD-2', Name: 'Kavita Rao', Phone: '+919900011122', Stage: 'Engaged', Last_Message_At: '2026-11-03T08:00:00Z' },                                   // wrote back
    { Lead_ID: 'LD-3', Name: 'Sunita', Phone: '+919900033344', Stage: 'Engaged', Last_Message_At: '2026-10-01T08:00:00Z' },
  ];
  const fus = [
    { Followup_ID: 'FU-2026-0022', Lead_ID: 'LD-2', Lead_Name: 'Kavita Rao', Phone: '+919900011122', Count: 1, Max_Count: 3, Status: 'Pending', Created_At: '2026-11-01T00:00:00Z', Last_Sent_At: '2026-11-02T00:00:00Z', Next_Due_At: '2026-11-03T00:00:00Z' },
    { Followup_ID: 'FU-2026-0023', Lead_ID: 'LD-3', Lead_Name: 'Sunita', Phone: '+919900033344', Count: 2, Max_Count: 3, Status: 'Pending', Created_At: '2026-10-02T00:00:00Z', Last_Sent_At: '2026-11-01T00:00:00Z', Next_Due_At: '2026-11-02T00:00:00Z' },
  ];
  const plan = A.followupPlan({ followupList: fus, leadList: leads, settingList: settings, now: NOW });
  const by = (op) => plan.ops.filter((o) => o.op === op);
  assert.equal(by('open').length, 1); assert.equal(by('open')[0].row.Followup_ID, 'FU-2026-0024');
  assert.deepEqual(by('status').map((o) => [o.id, o.Status]), [['FU-2026-0022', 'Replied']]);
  const sends = by('send').map((o) => [o.id, o.template, o.patch.Status]);
  assert.deepEqual(sends, [['FU-2026-0023', 'followup_3', 'Completed'], ['FU-2026-0024', 'followup_1', 'Pending']].sort());
  assert.equal(plan.run.Detail, '1 opened, 2 sent, 1 replied, 1 completed');
  // a second run the same minute opens nothing new for LD-1 (its follow-up exists)
  assert.equal(A.followupPlan({ followupList: [...fus, by('open')[0].row], leadList: leads, settingList: settings, now: NOW }).ops.filter((o) => o.op === 'open').length, 0);
});

test('the end of a call becomes a calls row with an outcome from the record', () => {
  const r = A.callRow({ msg: { phone: '+919876543210', call_id: 'c9', transcript: 'x', duration_sec: 90 }, leadList: [{ ...LEADS[0], Stage: 'Visit Scheduled' }], now: NOW });
  assert.equal(r.Outcome, 'Booking'); assert.equal(r.Lead_ID, 'LD-2026-0141'); assert.equal(r.VAPI_Call_ID, 'c9');
});
