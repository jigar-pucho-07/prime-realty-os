#!/usr/bin/env python3
"""build_primerealty_flows.py — the three custom flows of Prime Realty OS (method/ai-pipeline.md, the custom-flow path).

build_flows.py builds MESSAGES and VISITS from os.yaml. It cannot build these (an inbound flow there only captures, a schedule
there only syncs Tally), so they are written here with the kit's flowkit, and every rule lives in app/src/custom/agent/agent.js
(tests/agent.test.mjs), inlined into the CODE nodes by flowkit.inline_lib:

  PR - WA_AGENT     WhatsApp webhook → read leads · properties · brokers → prepare (CODE) → route skip | office | agent
                    → ONE llm-ai call → finish (CODE: declared keys, checks, broker, rows) → route new/old × book/talk
                    → lead POST|PATCH (+ PR - VISITS.schedule_visit on a booking) → messages → WhatsApp reply → Return
  PR - VOICE_AGENT  VAPI webhook → same reads → prepare → route skip | end-of-call (calls row) | turn → llm-ai → finish
                    → lead POST|PATCH (+ VISITS) → Return {response} to VAPI (sync)
  PR - FOLLOWUP_RUN schedule every 4 h → read follow-ups · leads · settings → plan (CODE) → loop: open | send template + patch +
                    message | status → agent_runs row → Return. No AI.

  python tools/build_primerealty_flows.py                 → workflows/<FLOW>/<FLOW>.json + .contract.json + samples
  python tools/build_primerealty_flows.py --deploy <env>  → deploy/flows/PR - <FLOW>.json with the placeholders filled from the
                                                            deploy env file (APP_ORIGIN, INBOUND_TOKEN, COMPANY_NAME) and
                                                            --visits-webhook / --whatsapp-account / --template followup_1=<id> …
Placeholders left in workflows/ (committed): SET_IN_STUDIO_APP_URL · SET_IN_STUDIO_INBOUND_TOKEN · SET_IN_STUDIO_COMPANY_NAME ·
SET_IN_STUDIO_WEBHOOK_VISITS · SET_IN_STUDIO_WHATSAPP_ACCOUNT_ID · SET_IN_STUDIO_TEMPLATE_ID_FOLLOWUP_1..3. A token never goes into git.
"""
import argparse, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.environ.get("PUCHO_OS_KIT", r"C:\pucho\kit")
sys.path.insert(0, os.path.join(KIT, "flow"))
import flowkit as fk  # noqa: E402

APP, TOKEN, COMPANY = "SET_IN_STUDIO_APP_URL", "SET_IN_STUDIO_INBOUND_TOKEN", "SET_IN_STUDIO_COMPANY_NAME"
VISITS_HOOK, WA_ACCOUNT = "SET_IN_STUDIO_WEBHOOK_VISITS", "SET_IN_STUDIO_WHATSAPP_ACCOUNT_ID"
LIB_DIR, APP_DIR = os.path.join(ROOT, "app", "src", "custom", "agent"), os.path.join(ROOT, "app")
CFG = {"agent_name": "Priya", "company_name": COMPANY, "city": "Bhopal"}   # the agent's name and language rule: changed here (os.yaml not_in_v1)

LEAD_COLS = ["Lead_ID", "Created_At", "Name", "Phone", "Source", "Stage", "Purpose", "Property_Type", "BHK", "Area_Pref", "Budget_Min_INR",
             "Budget_Max_INR", "Property_Interest", "Broker", "AI_Mode", "Lang", "Last_Message", "Last_Message_At", "Next_Followup_At",
             "Followup_Reason", "Lost_Reason", "Summary", "History"]
MSG_COLS = ["Lead_ID", "Lead_Name", "Phone", "Broker", "Channel", "Direction", "Sender", "Text", "Intent", "WA_Message_ID", "At"]
FU_COLS = ["Followup_ID", "Created_At", "Lead_ID", "Lead_Name", "Phone", "Broker", "Reason", "Property_Interest", "Count", "Max_Count",
           "Next_Due_At", "Last_Sent_At", "Status"]
CALL_COLS = ["Lead_ID", "Caller_Name", "Phone", "Broker", "VAPI_Call_ID", "Started_At", "Duration_Sec", "Outcome", "Property_Interest", "Transcript", "Recording_URL"]
RUN_COLS = ["At", "Flow", "Trigger", "Lead_ID", "Status", "Duration_Ms", "Detail"]
VISIT_KEYS = ["action", "Lead_ID", "Name", "Phone", "Broker", "To", "Property_Name", "Visit_At", "Budget_INR", "Source", "Notes"]


def headers(flow):
    return {"Content-Type": "application/json", "Authorization": f"Bearer {TOKEN}", "X-Flow": flow}


def get(n, entity, flow):
    return fk.step(n, "http", "send_request", {"method": "GET", "url": f"{APP}/api/data/{entity}", "headers": headers(flow),
                                               "queryParams": {"select": "*"}, "authType": "NONE"}, f"Read {entity}")


def named(ref, cols):
    """The http JSON Body as named fields, one per column (a bare reference would leave Studio's JSON Body box empty)."""
    return {c: "{{" + ref + f"['{c}']" + "}}" for c in cols}


def post(n, entity, data, flow, disp):
    return fk.step(n, "http", "send_request", {"method": "POST", "url": f"{APP}/api/data/{entity}", "headers": headers(flow), "queryParams": {},
                                               "authType": "NONE", "body_type": "json", "body": {"data": data}}, disp)


def patch(n, entity, id_col, id_ref, data, flow, disp):
    return fk.step(n, "http", "send_request", {"method": "PATCH", "url": f"{APP}/api/data/{entity}", "headers": headers(flow),
                                               "queryParams": {id_col: "eq.{{" + id_ref + "}}"}, "authType": "NONE", "body_type": "json",
                                               "body": {"data": data}}, disp)


def call_visits(n, ref):
    """PR - VISITS.schedule_visit — the same action the office uses: booking row, lead → Visit Scheduled, broker template (R5, R7)."""
    data = {"app_url": APP, "inbound_token": TOKEN, "company_name": COMPANY, **{k: "{{" + ref + f"['{k}']" + "}}" for k in VISIT_KEYS}}
    return fk.step(n, "http", "send_request", {"method": "POST", "url": VISITS_HOOK, "headers": {"Content-Type": "application/json"},
                                               "queryParams": {}, "authType": "NONE", "body_type": "json", "body": {"data": data}},
                   "Book the visit: PR - VISITS.schedule_visit (booking, stage, broker alert)")


def lib(n, body, inputs, disp):
    return fk.code(n, fk.lib_code(body, prelude="const CFG = " + json.dumps(CFG) + ";"), inputs, disp)


def router_any(n, disp, branches):
    """A router whose branch matches when ANY of its conditions holds (one condition group each — golden_2's list-of-groups shape)."""
    r = fk.router(n, disp, [(name, conds[0] if conds else None, child) for name, conds, child in branches])
    for b, (_, conds, _) in zip(r["settings"]["branches"], branches):
        if conds: b["conditions"] = [[{**c, "caseSensitive": False}] for c in conds]
    return r


def receipt_gate(n, conds, done):
    """Free in credits: a webhook that is not a client's words (WhatsApp read/delivered receipts, VAPI status events — several per
    message) returns at once, before the three reads. Without it every receipt cost ~6 credits."""
    return router_any(n, "A receipt or status event? Return at once", [("receipt", conds, done), ("message", None, None)])


def lead_writes(flow, extra_book, office=None, skip=None):
    """Route B: new/old lead × booking/talk. Every branch writes the lead; a booking branch also calls VISITS (after the lead exists).
    WA_AGENT also routes office (AI_Mode Off, R21) and skip here — one router level, so the booking path stays at 14 steps."""
    lead = named("step_finish['lead']", LEAD_COLS)
    lead_patch = {k: v for k, v in lead.items() if k != "Lead_ID"}
    post_l = lambda n: post(n, "leads", lead, flow, "Create the lead (new number, R1)")
    patch_l = lambda n: patch(n, "leads", "Lead_ID", "step_finish['lead_id']", lead_patch, flow, "Update the lead (requirement, history, stage)")
    lead_first = ([("skip", fk.TEXT_IS("{{step_finish['branch']}}", "skip"), skip)] if skip else []) + \
                 ([("office", fk.TEXT_IS("{{step_finish['branch']}}", "office"), office)] if office else [])
    branches = lead_first + [
        ("new_book", fk.TEXT_IS("{{step_finish['branch']}}", "new_book"), fk.chain(post_l("step_new_book_lead"), call_visits("step_new_book_visit", "step_finish['visit']"))),
        ("new_talk", fk.TEXT_IS("{{step_finish['branch']}}", "new_talk"), post_l("step_new_lead")),
        ("old_book", fk.TEXT_IS("{{step_finish['branch']}}", "old_book"), fk.chain(patch_l("step_old_book_lead"), call_visits("step_old_book_visit", "step_finish['visit']"))),
        ("old_talk", None, patch_l("step_old_lead")),
    ]
    return fk.router("step_lead_route", "Lead: new or known · booking or talk", branches)


def wa_agent():
    F = "WA_AGENT"
    t = fk.webhook_trigger("WhatsApp message (pucho-whatsapp inbound webhook)")
    reads = [get("step_leads", "leads", F), get("step_properties", "properties", F), get("step_brokers", "brokers", F)]
    prep = lib("step_prep", "return prepareTurn({ msg: normaliseWhatsApp(inputs.body), channel: 'whatsapp', leadList: inputs.leads, propertyList: inputs.properties, cfg: CFG, now: Date.now() });",
               {"body": "{{trigger['body']}}", "leads": "{{step_leads['body']}}", "properties": "{{step_properties['body']}}"},
               "Prepare: who is this, AI or office, matching inventory, the prompt (CODE)")
    office_msg = {"Lead_ID": "{{step_prep['lead_id']}}", "Lead_Name": "{{step_prep['lead_name']}}", "Phone": "{{step_prep['phone']}}", "Broker": "{{step_prep['broker']}}",
                  "Channel": "WhatsApp", "Direction": "In", "Sender": "Client", "Text": "{{step_prep['text']}}", "Intent": "other", "WA_Message_ID": "{{step_prep['wa_id']}}", "At": "{{step_prep['at']}}"}
    office = fk.chain(post("step_office_message", "messages", office_msg, F, "Store the client's message (office is answering, R21)"),
                      patch("step_office_lead", "leads", "Lead_ID", "step_prep['lead_id']", named("step_prep['office_patch']", ["Last_Message", "Last_Message_At", "History"]), F, "Update the lead's last message"),
                      fk.respond("step_office_done", {"ok": "true", "route": "office", "lead_id": "{{step_prep['lead_id']}}"}, "Return: stored for the office"))
    skip = fk.respond("step_skip_done", {"ok": "true", "route": "skip", "reason": "{{step_prep['reason']}}"}, "Return: nothing to answer")
    gate = receipt_gate("step_receipt", [fk.EXISTS("{{trigger['body']['entry'][0]['changes'][0]['value']['statuses'][0]['status']}}"),
                                         fk.EXISTS("{{trigger['body']['MessageStatus']}}")],
                        fk.respond("step_receipt_done", {"ok": "true", "route": "receipt"}, "Return: a receipt, nothing to do"))
    ai = fk.llm("step_ai", "{{step_prep['prompt']}}", "Write the reply + intent (ONE AI call)", model="standard", temp=0.4, tokens="700")
    # office / skip runs reach the model with a one-line prompt (prep sets it) and route out below without a reply: one router level
    finish = lib("step_finish", "if (inputs.prep.route !== 'agent') return { branch: inputs.prep.route };\n"
                 "return finishTurn({ ai: parseAgent(inputs.ai), prep: inputs.prep, brokerList: inputs.brokers, propertyList: inputs.properties, channel: 'whatsapp', now: Date.now() });",
                 {"ai": "{{step_ai['data']['response']}}", "prep": "{{step_prep}}", "brokers": "{{step_brokers['body']}}", "properties": "{{step_properties['body']}}"},
                 "Finish: declared keys only, check the visit, assign the broker, build the rows (CODE)")
    msgs = post("step_messages", "messages", [named("step_finish['msg_in']", MSG_COLS), named("step_finish['msg_out']", MSG_COLS)], F, "Store the client's message and the agent's reply")
    send = fk.step("step_send", "pucho-whatsapp", "send_text_message", {"account_id": WA_ACCOUNT, "to": "{{step_finish['to']}}", "message": "{{step_finish['reply']}}"}, "Send the reply on WhatsApp")
    done = fk.respond("step_done", {"ok": "true", "route": "agent", "lead_id": "{{step_finish['lead_id']}}", "intent": "{{step_finish['intent']}}"}, "Return: answered")
    fk.chain(t, gate, *reads, prep, ai, finish, lead_writes(F, True, office=office, skip=skip), msgs, send, done)
    return fk.flow("PR - WA_AGENT", "Prime Realty OS · WA_AGENT: a WhatsApp message → the AI agent answers in the client's language from available inventory, books visits through VISITS, or leaves it to the office.",
                   t, ["webhook", "http", "llm-ai", "pucho-whatsapp"])


def voice_agent():
    F = "VOICE_AGENT"
    t = fk.webhook_trigger("VAPI server message (caller turn or end-of-call report)")
    reads = [get("step_leads", "leads", F), get("step_properties", "properties", F), get("step_brokers", "brokers", F)]
    prep = lib("step_prep", "const msg = normaliseVapi(inputs.body); const now = Date.now();\n"
               "if (msg.kind === 'end') return { route: 'end', call: callRow({ msg, leadList: inputs.leads, now }) };\n"
               "return prepareTurn({ msg, channel: 'voice', leadList: inputs.leads, propertyList: inputs.properties, cfg: CFG, now });",
               {"body": "{{trigger['body']}}", "leads": "{{step_leads['body']}}", "properties": "{{step_properties['body']}}"},
               "Prepare: caller turn or end of call, matching inventory, the prompt (CODE)")
    end = fk.chain(post("step_call", "calls", named("step_prep['call']", CALL_COLS), F, "Store the call: transcript, duration, outcome (R10)"),
                   fk.respond("step_end_done", {"ok": "true", "route": "end"}, "Return: call stored"))
    skip = fk.respond("step_skip_done", {"response": "", "route": "skip"}, "Return: nothing to answer")
    route = fk.router("step_route", "Caller turn, end of call, or nothing", [
        ("skip", fk.TEXT_IS("{{step_prep['route']}}", "skip"), skip), ("end", fk.TEXT_IS("{{step_prep['route']}}", "end"), end), ("turn", None, None)])
    gate = receipt_gate("step_receipt", [fk.TEXT_IS("{{trigger['body']['message']['type']}}", t_) for t_ in ("status-update", "speech-update", "hang", "user-interrupted", "transcript")],
                        fk.respond("step_receipt_done", {"response": "", "route": "status"}, "Return: a VAPI status event, nothing to say"))
    ai = fk.llm("step_ai", "{{step_prep['prompt']}}", "Say the next line + intent (ONE AI call)", model="standard", temp=0.3, tokens="400")
    finish = lib("step_finish", "return finishTurn({ ai: parseAgent(inputs.ai), prep: inputs.prep, brokerList: inputs.brokers, propertyList: inputs.properties, channel: 'voice', now: Date.now() });",
                 {"ai": "{{step_ai['data']['response']}}", "prep": "{{step_prep}}", "brokers": "{{step_brokers['body']}}", "properties": "{{step_properties['body']}}"},
                 "Finish: declared keys only, check the visit, assign the broker, build the lead (CODE)")
    done = fk.respond("step_done", {"response": "{{step_finish['reply']}}", "lead_id": "{{step_finish['lead_id']}}", "intent": "{{step_finish['intent']}}"}, "Return the spoken reply to VAPI")
    fk.chain(t, gate, *reads, prep, route, ai, finish, lead_writes(F, True), done)
    return fk.flow("PR - VOICE_AGENT", "Prime Realty OS · VOICE_AGENT: each VAPI caller turn → the AI agent's spoken reply (sync); bookings through VISITS; the end-of-call report → a calls row.",
                   t, ["webhook", "http", "llm-ai"])


def loop(n, items_ref, first, disp):
    """LOOP_ON_ITEMS — confirmed by the tech team (workflow-rules § 1.20), not yet in a golden export: the CHECKLIST asks to check it."""
    return {"name": n, "skip": False, "type": "LOOP_ON_ITEMS", "valid": True, "displayName": disp,
            "settings": {"items": items_ref, "sampleData": {}}, "firstLoopAction": first, "nextAction": None}


def followup_run():
    F = "FOLLOWUP_RUN"
    t = fk.schedule_trigger("0 */4 * * *", "Every 4 hours (IST)")
    reads = [get("step_followups", "followups", F), get("step_leads", "leads", F), get("step_settings", "agent_settings", F)]
    tpl = {"followup_1": "SET_IN_STUDIO_TEMPLATE_ID_FOLLOWUP_1", "followup_2": "SET_IN_STUDIO_TEMPLATE_ID_FOLLOWUP_2", "followup_3": "SET_IN_STUDIO_TEMPLATE_ID_FOLLOWUP_3"}
    plan = fk.code("step_plan", fk.lib_code("const plan = followupPlan({ followupList: inputs.followups, leadList: inputs.leads, settingList: inputs.setting_rows, now: Date.now() });\n"
                                            "for (const o of plan.ops) if (o.op === 'send') o.template_id = TEMPLATES[o.template] || '';\nreturn plan;",
                                            prelude="const TEMPLATES = " + json.dumps(tpl) + ";"),
                   {"followups": "{{step_followups['body']}}", "leads": "{{step_leads['body']}}", "setting_rows": "{{step_settings['body']}}"},   # not "settings": flowkit.inline_lib reads any dict key `settings` as a step's
                   "Plan: open, reply-check, due nudges, completion (CODE, no AI)")
    I = "step_each['item']"
    open_ = post("step_open", "followups", named(I + "['row']", FU_COLS), F, "Open the follow-up (R8)")
    send = fk.chain(
        fk.step("step_nudge", "pucho-whatsapp", "send_template_message", {"account_id": WA_ACCOUNT, "to": "{{" + I + "['to']}}", "template_id": "{{" + I + "['template_id']}}",
                "template_variables": {"name": "{{" + I + "['vars']['name']}}", "property": "{{" + I + "['vars']['property']}}", "office_phone": "{{" + I + "['vars']['office_phone']}}"}},
                "Send the follow-up template (R9)"),
        patch("step_nudge_patch", "followups", "Followup_ID", I + "['id']", named(I + "['patch']", ["Count", "Last_Sent_At", "Next_Due_At", "Status"]), F, "Count the nudge, set the next one"),
        post("step_nudge_message", "messages", named(I + "['message']", MSG_COLS), F, "Show the nudge in the Inbox"))
    status = patch("step_status", "followups", "Followup_ID", I + "['id']", {"Status": "{{" + I + "['Status']}}"}, F, "Mark Replied / Completed / Stopped (R22)")
    each = fk.router("step_op", "What to do with this follow-up", [
        ("open", fk.TEXT_IS("{{" + I + "['op']}}", "open"), open_), ("send", fk.TEXT_IS("{{" + I + "['op']}}", "send"), send), ("status", None, status)])
    lp = loop("step_each", "{{step_plan['ops']}}", each, "For each follow-up action")
    run = post("step_run", "agent_runs", named("step_plan['run']", RUN_COLS), F, "Log this run on the AI agents page (R17)")
    done = fk.respond("step_done", {"ok": "true", "detail": "{{step_plan['run']['Detail']}}"}, "Return: run summary")
    fk.chain(t, *reads, plan, lp, run, done)
    return fk.flow("PR - FOLLOWUP_RUN", "Prime Realty OS · FOLLOWUP_RUN: every 4 h — open follow-ups for clients who said later, stop on a reply, send template nudges 1–3, complete after the last. No AI.",
                   t, ["schedule", "http", "pucho-whatsapp", "webhook"])


CONTRACTS = {
    "WA_AGENT": ["receive=webhook:trigger", "respond=webhook:respond", "read_leads=step_leads:http:read", "read_inventory=step_properties:http:read", "think=step_ai:llm-ai:read",
                 "create_lead=step_new_lead:http:write", "update_lead=step_old_lead:http:write", "book_visit=step_old_book_visit:http:write",
                 "store_messages=step_messages:http:write", "office_message=step_office_message:http:write", "reply=step_send:pucho-whatsapp:write"],
    "VOICE_AGENT": ["receive=webhook:trigger", "respond=webhook:respond", "think=step_ai:llm-ai:read", "create_lead=step_new_lead:http:write",
                    "update_lead=step_old_lead:http:write", "book_visit=step_new_book_visit:http:write", "store_call=step_call:http:write"],
    "FOLLOWUP_RUN": ["schedule=schedule:trigger", "respond=webhook:respond", "open=step_open:http:write", "nudge=step_nudge:pucho-whatsapp:write",
                     "count=step_nudge_patch:http:write", "status=step_status:http:write", "log=step_run:http:write"],
}
COVERS = {"WA_AGENT": ["R1", "R2", "R3", "R4", "R5", "R6", "R20", "R21"], "VOICE_AGENT": ["R10", "R5", "R6"], "FOLLOWUP_RUN": ["R8", "R9", "R17", "R22"]}
SAMPLES = {
    "WA_AGENT": {"message": {"entry": [{"changes": [{"value": {"contacts": [{"profile": {"name": "Neha Gupta"}}], "messages": [{"from": "919812300001", "id": "wamid.TEST1", "type": "text", "text": {"body": "Hello, 3BHK chahiye Kolar Road mein, budget 70 lakh"}}]}}]}]},
                 "status": {"entry": [{"changes": [{"value": {"statuses": [{"id": "wamid.X", "status": "read"}]}}]}]}},
    "VOICE_AGENT": {"turn": {"from": "+919812300002", "call_id": "call-test-1", "transcript": "Haan, mujhe Misrod mein plot chahiye, investment ke liye"},
                    "end": {"message": {"type": "end-of-call-report", "call": {"id": "call-test-1", "customer": {"number": "+919812300002"}}, "artifact": {"transcript": "AI: Namaste\nUser: plot chahiye", "recordingUrl": ""}, "durationSeconds": 95}}},
    "FOLLOWUP_RUN": {"run": {}},
}


def build():
    flows = {"WA_AGENT": wa_agent(), "VOICE_AGENT": voice_agent(), "FOLLOWUP_RUN": followup_run()}
    fk.inline_lib(list(flows.values()), lib_dir=LIB_DIR, app_dir=APP_DIR)
    for name, fl in flows.items():
        mark_lib(fl)
        d = os.path.join(ROOT, "workflows", name)
        fk.save(fl, os.path.join(d, f"{name}.json"))
        pieces = sorted({p.replace("@puchoaistudio/tool-", "") for p in fl["pieces"]})
        names = sorted(set(re.findall(r'"(?:actionName|triggerName)": "([^"]+)"', json.dumps(fl))))
        json.dump({"flow": name, "covers": COVERS[name], "connections": "portable", "fire_and_forget": False, "allow_pieces": pieces, "allow_names": names,
                   "require_capabilities": CONTRACTS[name], "unverified_outputs": [], "custom": True}, open(os.path.join(d, f"{name}.contract.json"), "w", encoding="utf-8", newline="\n"), indent=2)
        for act, body in SAMPLES[name].items():
            p = os.path.join(ROOT, "workflows", "samples", f"{name}.{act}.md")
            open(p, "w", encoding="utf-8", newline="\n").write(f"# {name} · {act} — test payload (paste into the trigger's test data in Studio)\n\n```json\n{json.dumps(body, indent=2, ensure_ascii=False)}\n```\n")
        print(f"built workflows/{name}/{name}.json")


def mark_lib(node):
    """A bundled library is the app's tested code, not flow logic: mark it the way the kit marks renderMessage.js (complexity.py)."""
    if isinstance(node, dict):
        sc = (node.get("settings") or {}).get("sourceCode")
        if sc and "export const code" in sc["code"] and "// end lib" not in sc["code"] and "\nfunction " in sc["code"]:
            head, _, tail = sc["code"].rpartition("export const code")
            sc["code"] = "// @ts-nocheck\n// lib: app/src/custom/agent/agent.js (bundled by flowkit.inline_lib; tests/agent.test.mjs)\n" + head.replace("// @ts-nocheck\n", "") + "// end lib\nexport const code" + tail
        for v in node.values(): mark_lib(v)
    elif isinstance(node, list):
        for v in node: mark_lib(v)


def deploy(env_path, a):
    env = dict(l.split("=", 1) for l in open(env_path, encoding="utf-8").read().splitlines() if "=" in l and not l.startswith("#"))
    fill = {APP: env.get("APP_ORIGIN", "").rstrip("/"), TOKEN: env.get("INBOUND_TOKEN", ""), COMPANY: env.get("COMPANY_NAME", "Prime Realty India")}
    if a.visits_webhook: fill[VISITS_HOOK] = a.visits_webhook
    if a.whatsapp_account: fill[WA_ACCOUNT] = a.whatsapp_account
    for kv in a.template or []: k, v = kv.split("=", 1); fill[f"SET_IN_STUDIO_TEMPLATE_ID_{k.upper()}"] = v
    out = os.path.join(ROOT, "deploy", "flows"); os.makedirs(out, exist_ok=True)
    for name in ("WA_AGENT", "VOICE_AGENT", "FOLLOWUP_RUN"):
        text = open(os.path.join(ROOT, "workflows", name, f"{name}.json"), encoding="utf-8").read()
        for ph, v in fill.items():
            if v: text = text.replace(ph, json.dumps(v)[1:-1])
        left = sorted(set(re.findall(r"SET_IN_STUDIO_[A-Z0-9_]+", text)))
        open(os.path.join(out, f"PR - {name}.json"), "w", encoding="utf-8", newline="\n").write(text)
        print(f"deploy/flows/PR - {name}.json" + (f" — still to set in Studio: {', '.join(left)}" if left else ""))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--deploy", metavar="ENV_FILE"); ap.add_argument("--visits-webhook"); ap.add_argument("--whatsapp-account")
    ap.add_argument("--template", action="append", metavar="followup_1=<id>"); a = ap.parse_args()
    deploy(a.deploy, a) if a.deploy else build()
