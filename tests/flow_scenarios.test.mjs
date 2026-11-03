// tests/flow_scenarios.test.mjs — run the BUILT custom flows (workflows/*.json, library inlined) the way Studio would, with
// the kit's simulator and fakes that answer the app's /api/data reads with Prime Realty demo rows and the model with fixed JSON.
//   node --test tests/flow_scenarios.test.mjs        (needs PUCHO_OS_KIT or the kit at C:\pucho\kit)
// flow_sim answers every /api/data GET with an empty table, so here each read URL is pointed at a fake host first (test only).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KIT = process.env.PUCHO_OS_KIT || 'C:\\pucho\\kit';
const { simulate } = await import(pathToFileURL(path.join(KIT, 'flow', 'flow_sim.mjs')).href);

const DATA = {
  leads: [
    { Lead_ID: 'LD-2026-0141', Name: 'Ramesh Singh', Phone: '+919876543210', Stage: 'Engaged', AI_Mode: 'On', Area_Pref: 'Kolar Road', BHK: '3 BHK', Property_Type: 'Residential', History: 'C: 3BHK chahiye', Broker: '', Source: 'WhatsApp', Created_At: '2026-10-20T10:00:00Z' },
    { Lead_ID: 'LD-2026-0139', Name: 'Ankit Sharma', Phone: '+917654321098', Stage: 'Engaged', AI_Mode: 'Off', History: '', Broker: '' },
  ],
  properties: [
    { Name: '3BHK Luxury Apartment', Type: 'Residential', Config: '3 BHK', Area_Name: 'Kolar Road', Price_Min_INR: 6500000, Price_Max_INR: 7500000, Status: 'Available' },
    { Name: 'Plot 200 sq.yd', Type: 'Plot', Config: 'Plot', Area_Name: 'Misrod', Price_Min_INR: 1800000, Price_Max_INR: 2200000, Status: 'Available' },
  ],
  brokers: [
    { Name: 'Rajesh Kumar', Phone: '+919800111001', Specialty: 'Residential', Status: 'Active' },
    { Name: 'Meena Verma', Phone: '+919800133003', Specialty: 'Plots', Status: 'Active' },
  ],
  followups: [{ Followup_ID: 'FU-2026-0023', Lead_ID: 'LD-2026-0141', Lead_Name: 'Ramesh Singh', Phone: '+919876543210', Count: 1, Max_Count: 3, Status: 'Pending', Created_At: '2026-10-01T00:00:00Z', Last_Sent_At: '2026-10-02T00:00:00Z', Next_Due_At: '2026-10-03T00:00:00Z' }],
  agent_settings: [{ Key: 'followup_max', Value: '3' }, { Key: 'office_phone', Value: '+91 755 400 0000' }],
};

function load(name) {
  const fl = JSON.parse(fs.readFileSync(path.join(ROOT, 'workflows', name, `${name}.json`), 'utf8'));
  const walk = (n) => { if (!n || typeof n !== 'object') return; const i = n.settings?.input; if (i?.method === 'GET') i.url = String(i.url).replace('/api/data/', '/sim-read/'); for (const v of Object.values(n)) walk(v); };
  walk(fl.template.trigger); return fl;
}
function fakes(ai, sent) {
  return async (piece, inputs) => {
    if (piece === 'http:send_request' && /\/sim-read\//.test(inputs.url)) return { status: 200, body: DATA[String(inputs.url).split('/sim-read/')[1]] ?? [] };
    if (piece === 'http:send_request') { sent.push({ url: inputs.url, data: inputs.body?.data }); return { status: 200, body: { ok: 'true' } }; }
    if (piece === 'llm-ai:askLlm') return { data: { response: JSON.stringify(ai) } };
    if (piece.startsWith('pucho-whatsapp:')) { sent.push({ whatsapp: piece, ...inputs }); return { id: 'wamid.SIM' }; }
    return undefined;
  };
}
const meta = (from, text) => ({ entry: [{ changes: [{ value: { contacts: [{ profile: { name: 'Neha' } }], messages: [{ from, id: 'wamid.T', type: 'text', text: { body: text } }] } }] }] });
const ok = (r) => assert.deepEqual(r.failures, [], r.failures.join('\n'));
const tomorrow11 = () => { const d = new Date(Date.now() + 330 * 60000 + 864e5); return d.toISOString().slice(0, 10) + ' 11:00'; };

test('WA: a new number asking → new lead, two messages, a WhatsApp reply', async () => {
  const sent = []; const r = await simulate(load('WA_AGENT'), meta('919812300001', 'Hello, 3BHK chahiye Kolar Road mein, budget 70 lakh'), fakes({ intent: 'ask', reply: 'Namaste! Kolar Road pe 3BHK ₹65–75L mein hai.' }, sent));
  ok(r); assert.ok(r.trace.includes('step_lead_route→new_talk'));
  const lead = r.writes.find((w) => w.step === 'step_new_lead').rows[0];
  assert.equal(lead.Lead_ID, 'LD-2026-0142'); assert.equal(lead.Phone, '+919812300001'); assert.equal(lead.Budget_Max_INR, 7000000);
  assert.equal(r.writes.find((w) => w.step === 'step_messages').rows.length, 2);
  assert.equal(sent.find((s) => s.whatsapp).to, '+919812300001');
  assert.equal(r.responses.at(-1).route, 'agent');
});

test('WA: a known client agreeing a visit → lead patched, VISITS called with the specialist broker', async () => {
  const sent = []; const r = await simulate(load('WA_AGENT'), meta('919876543210', 'Kal 11 baje Kolar Road wala dekhne aaunga'),
    fakes({ intent: 'book_visit', reply: 'Done! Rajesh ji aapko call karenge.', property_name: '3BHK Luxury Apartment', visit_at: tomorrow11() }, sent));
  ok(r); assert.ok(r.trace.includes('step_lead_route→old_book'));
  const visit = sent.find((s) => s.url === 'SET_IN_STUDIO_WEBHOOK_VISITS').data;
  assert.equal(visit.action, 'schedule_visit'); assert.equal(visit.Broker, 'Rajesh Kumar'); assert.equal(visit.To, '+919800111001'); assert.equal(visit.Lead_ID, 'LD-2026-0141');
  assert.ok(r.writes.some((w) => w.step === 'step_old_book_lead' && w.method === 'PATCH'));
});

test('WA: a taken-over client → stored for the office, no reply sent (R21)', async () => {
  const sent = []; let prompt = ''; const base = fakes({ intent: 'ask', reply: 'x' }, sent);
  const r = await simulate(load('WA_AGENT'), meta('917654321098', 'Kal aa sakta hoon?'), async (p, i, n) => { if (p === 'llm-ai:askLlm') prompt = i.query; return base(p, i, n); });
  ok(r); assert.ok(r.trace.includes('step_lead_route→office')); assert.equal(prompt, 'Reply ONLY with JSON: {}');   // the client's words never reach the model
  assert.equal(sent.filter((s) => s.whatsapp).length, 0); assert.equal(r.responses.at(-1).route, 'office');
  assert.equal(r.writes.find((w) => w.step === 'step_office_message').rows[0].Text, 'Kal aa sakta hoon?');
});

test('WA: a read receipt → returned at the gate: no read, no write, no AI (2 credits)', async () => {
  const sent = []; const r = await simulate(load('WA_AGENT'), { entry: [{ changes: [{ value: { statuses: [{ status: 'read' }] } }] }] }, fakes({}, sent));
  ok(r); assert.deepEqual(r.trace, ['step_receipt→receipt', 'step_receipt_done(webhook:return_response)']); assert.equal(sent.length, 0);
});

test('VOICE: a status event → returned at the gate', async () => {
  const r = await simulate(load('VOICE_AGENT'), { message: { type: 'speech-update', status: 'started' } }, fakes({}, []));
  ok(r); assert.equal(r.trace[0], 'step_receipt→receipt'); assert.equal(r.trace.length, 2);
});

test('VOICE: a caller turn → spoken reply returned; end of call → calls row', async () => {
  const sent = []; const r = await simulate(load('VOICE_AGENT'), { from: '+919812300002', call_id: 'c1', transcript: 'Misrod mein plot chahiye' }, fakes({ intent: 'ask', reply: 'Ji, Misrod mein 200 gaj ka plot hai. Kab dekhna chahenge?' }, sent));
  ok(r); assert.match(r.responses.at(-1).response, /Misrod/); assert.ok(r.trace.includes('step_lead_route→new_talk'));
  const e = await simulate(load('VOICE_AGENT'), { message: { type: 'end-of-call-report', call: { id: 'c1', customer: { number: '+919876543210' } }, artifact: { transcript: 'AI: Namaste' }, durationSeconds: 95 } }, fakes({}, []));
  ok(e); const call = e.writes.find((w) => w.step === 'step_call').rows[0]; assert.equal(call.Lead_ID, 'LD-2026-0141'); assert.equal(call.Duration_Sec, 95);
});

test('FOLLOWUP_RUN: the due nudge is sent as a template, counted, shown in the Inbox, and the run is logged', async () => {
  const sent = []; const r = await simulate(load('FOLLOWUP_RUN'), {}, fakes({}, sent));
  ok(r); const nudge = sent.find((s) => s.whatsapp === 'pucho-whatsapp:send_template_message');
  assert.equal(nudge.to, '+919876543210'); assert.equal(nudge.template_id, 'SET_IN_STUDIO_TEMPLATE_ID_FOLLOWUP_2');
  assert.equal(r.writes.find((w) => w.step === 'step_nudge_patch').rows[0].Count, 2);
  assert.ok(r.writes.some((w) => w.step === 'step_run' && /1 sent/.test(w.rows[0].Detail)));
});
