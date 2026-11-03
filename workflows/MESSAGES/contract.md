# MESSAGES
trigger: `webhook.catch_webhook` {}
constants: `{}`
writes: messages, audit_log

Shape: trigger → `step_constants` → [`step_router` on action →] `step_<action>_ai` → `step_<action>_build` (parse + row, CODE) → `step_<action>_insert|update` (http → the app's /api/data, named fields under body.data) → `step_<action>_done` (Return: ok, id, row).
Built by `scripts/build_flows.py` (flow/flowkit.py); the JSON lands beside this file as `MESSAGES.json`; the CHECKLIST carries a test payload per action.

### `reply`  (model: none, ~4s, ~7 credits, 200 runs/month)
payload: `{"Lead_ID": "string", "Lead_Name": "string", "Phone": "string", "Broker": "string", "Text": "string"}`
result: `{"sent": "boolean"}`
rules: Only inside the 24-hour window after the client's last message; outside it the composer is disabled and says why
sends: pucho-whatsapp.send_text_message
