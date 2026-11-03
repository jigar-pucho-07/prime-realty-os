# VISITS
trigger: `webhook.catch_webhook` {}
constants: `{}`
writes: bookings, leads, audit_log

Shape: trigger → `step_constants` → [`step_router` on action →] `step_<action>_ai` → `step_<action>_build` (parse + row, CODE) → `step_<action>_insert|update` (http → the app's /api/data, named fields under body.data) → `step_<action>_done` (Return: ok, id, row).
Built by `scripts/build_flows.py` (flow/flowkit.py); the JSON lands beside this file as `VISITS.json`; the CHECKLIST carries a test payload per action.

### `schedule_visit`  (model: none, ~5s, ~7 credits, 20 runs/month)
payload: `{"Lead_ID": "string", "Name": "string", "Phone": "string", "Broker": "string", "Property_Name": "string", "Visit_At": "string", "Budget_INR": "number", "Source": "string", "Notes": "string", "To": "string"}`
result: `{"Booking_ID": "string"}`
sends: pucho-whatsapp.send_template_message

### `confirm_client`  (model: none, ~4s, ~7 credits, 38 runs/month)
payload: `{"Booking_ID": "string", "Client_Name": "string", "Client_Phone": "string", "Property_Name": "string", "Visit_At": "string", "Broker": "string"}`
result: `{"sent": "boolean"}`
sends: pucho-whatsapp.send_template_message
