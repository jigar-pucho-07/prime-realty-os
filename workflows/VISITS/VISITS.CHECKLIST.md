# Studio checklist — PR - VISITS

File: `VISITS.json`. Do the steps in order. Tick each box.

## 1. Import
- [ ] Studio → Flows → Import → pick the file above.

## 2. Insert bookings: Created_At, Lead_ID, Client_Name, Client_Phone, Property_Name, Broker +9 more (Booking_ID numbered by the app) (`step_schedule_visit_insert`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `POST`
  - **url**: `{{step_constants['app_url']}}/api/data/bookings`
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer {{step_constants['inbound_token']}}", "X-Flow": "{{step_constants['flow']}}"}`
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Booking_ID": "{{step_schedule_visit_build['row']['Booking_ID']}}", "Created_At": "{{step_schedule_visit_build['row']['Created_At']}}", "Lead_ID": "{{step_schedule_visit_build['row']['Lead_ID']}}", "Client_Name": "{{step_schedule_visit_build['row']['Client_Name']}}", "Client_Phone": "{{step_schedule_visit_build['row']['Client_Phone']}}", "Property_Name": "{{step_schedule_visit_build['row']['Property_Name']}}", "Broker": "{{step_schedule_visit_build['row']['Broker']}}", "Visit_At": "{{step_schedule_visit_build['row']['Visit_At']}}", "Budget_INR": "{{step_schedule_visit_build['row']['Budget_INR']}}", "Source": "{{step_schedule_visit_build['row']['Source']}}", "Created_By": "{{step_schedule_visit_build['row']['Created_By']}}", "Status": "{{step_schedule_visit_build['row']['Status']}}", "Deal_Value_INR": "{{step_schedule_visit_build['row']['Deal_Value_INR']}}", "Commission_INR": "{{step_schedule_visit_build['row']['Commission_INR']}}", "Cancel_Reason": "{{step_schedule_visit_build['row']['Cancel_Reason']}}", "Notes": "{{step_schedule_visit_build['row']['Notes']}}"}}`

## 3. Update leads (same call): Lead_ID, Name, Phone, Source, Stage, Property_Interest +1 more (`step_schedule_visit_also_update`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `PATCH`
  - **url**: `{{step_constants['app_url']}}/api/data/leads`
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer {{step_constants['inbound_token']}}", "X-Flow": "{{step_constants['flow']}}"}`
  - **queryParams**: `eq.{{step_schedule_visit_also_build['id']}}`
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Name": "{{step_schedule_visit_also_build['patch']['Name']}}", "Phone": "{{step_schedule_visit_also_build['patch']['Phone']}}", "Source": "{{step_schedule_visit_also_build['patch']['Source']}}", "Stage": "{{step_schedule_visit_also_build['patch']['Stage']}}", "Property_Interest": "{{step_schedule_visit_also_build['patch']['Property_Interest']}}", "Broker": "{{step_schedule_visit_also_build['patch']['Broker']}}"}}`

## 4. Send WhatsApp template "broker_visit_alert": client, phone, property, budget, visit (`step_schedule_visit_send`, pucho-whatsapp)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **account_id**: `{{step_constants['whatsapp_account_id']}}`
  - **to**: `{{step_schedule_visit_message['to_e164']}}`
  - **template_id**: `{{step_constants['whatsapp_templates']['schedule_visit']}}`
  - **template_variables**: `{"client": "{{step_schedule_visit_message['variables']['client']}}", "phone": "{{step_schedule_visit_message['variables']['phone']}}", "property": "{{step_schedule_visit_message['variables']['property']}}", "budget": "{{step_schedule_visit_message['variables']['budget']}}", "visit": "{{step_schedule_visit_message['variables']['visit']}}"}`

## 5. Send WhatsApp template "visit_confirmation": name, property, visit, broker (`step_confirm_client_send`, pucho-whatsapp)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **account_id**: `{{step_constants['whatsapp_account_id']}}`
  - **to**: `{{step_confirm_client_message['to_e164']}}`
  - **template_id**: `{{step_constants['whatsapp_templates']['confirm_client']}}`
  - **template_variables**: `{"name": "{{step_confirm_client_message['variables']['name']}}", "property": "{{step_confirm_client_message['variables']['property']}}", "visit": "{{step_confirm_client_message['variables']['visit']}}", "broker": "{{step_confirm_client_message['variables']['broker']}}"}`

## 6. Update bookings: Client_Name, Client_Phone, Property_Name, Broker, Visit_At, Notes (`step_confirm_client_update`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `PATCH`
  - **url**: `{{step_constants['app_url']}}/api/data/bookings`
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer {{step_constants['inbound_token']}}", "X-Flow": "{{step_constants['flow']}}"}`
  - **queryParams**: `eq.{{trigger['body']['Booking_ID']}}`
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Client_Name": "{{step_confirm_client_build['patch']['Client_Name']}}", "Client_Phone": "{{step_confirm_client_build['patch']['Client_Phone']}}", "Property_Name": "{{step_confirm_client_build['patch']['Property_Name']}}", "Broker": "{{step_confirm_client_build['patch']['Broker']}}", "Visit_At": "{{step_confirm_client_build['patch']['Visit_At']}}", "Notes": "{{step_confirm_client_build['patch']['Notes']}}"}}`

## 7. Constants (`step_constants`, code)
- [ ] Open the step's code and replace each placeholder with the real value, then save:
  - `SET_IN_STUDIO_TEMPLATE_ID_CONFIRM_CLIENT` → the approved template's id: open the **Send Template Message** step, pick the template in the **Template** dropdown (the name is in `whatsapp_template_names`), copy the value and paste it here. The template must be approved on whatsapp.pucho.ai first; its {{1}}, {{2}}… must match the variables the step fills
  - `SET_IN_STUDIO_TEMPLATE_ID_SCHEDULE_VISIT` → the approved template's id: open the **Send Template Message** step, pick the template in the **Template** dropdown (the name is in `whatsapp_template_names`), copy the value and paste it here. The template must be approved on whatsapp.pucho.ai first; its {{1}}, {{2}}… must match the variables the step fills
  - `SET_IN_STUDIO_WHATSAPP_ACCOUNT_ID` → the client's WhatsApp account on Pucho WhatsApp: open any pucho-whatsapp step, pick the account in its **WhatsApp Account** dropdown, copy the value (the account's id) and paste it here — every send step reads it from this constant

## 8. Publish
- [ ] Press **Publish**. Edits do nothing until Studio says the flow is published.
- [ ] Self-check: open **Build the patch (rules in CODE)**. Its code has **10 lines** and line 1 is `// @ts-nocheck`. If not, paste it again and publish.
## 9. Test the trigger — one payload per action
- [ ] Open the trigger step → **Test** → paste a payload below → send. Studio then shows every later step's input filled in, and `{{trigger['body'][…]}}` picks resolve in the UI.
- [ ] After the test, open each **http** step: the **JSON Body** box lists the fields it writes (named, one per column). If a box is empty, the import did not take `body.data` — tell Claude.
- [ ] Test one update with an optional field left blank (e.g. no Close_Reason): the row's column must stay as it was. If it was blanked, tell Claude (the app would then need a skip-empty rule).
- [ ] Each test must end at a **Return** step with `ok: true` and the row it wrote; a run that stops earlier is a failed path.
- [ ] A WhatsApp **text** send reaches a number only inside Meta's 24-hour window after the customer last wrote; a reminder or a win-back must be a **template** send (`sends.template`) approved on whatsapp.pucho.ai.

**schedule_visit**
```json
{
  "action": "schedule_visit",
  "Lead_ID": "LD-2026-0141",
  "Name": "Ramesh Singh",
  "Phone": "+919876543210",
  "Broker": "Rajesh Kumar",
  "Property_Name": "3BHK Luxury Apartment",
  "Visit_At": "2026-08-08T11:00:00+05:30",
  "Budget_INR": 7200000,
  "Source": "WhatsApp",
  "Notes": "<Notes>",
  "To": "<To>"
}
```

**confirm_client**
```json
{
  "action": "confirm_client",
  "Booking_ID": "BK-2026-1042",
  "Client_Name": "Ramesh Singh",
  "Client_Phone": "+919876543210",
  "Property_Name": "3BHK Luxury Apartment",
  "Visit_At": "2026-08-08T11:00:00+05:30",
  "Broker": "Rajesh Kumar"
}
```

From a terminal (the app sends the same): `curl -X POST <webhook URL>/sync -H 'Content-Type: application/json' -d @payload.json`


## 10. Hand back
- [ ] Copy the webhook URL from the trigger step and send it to Claude.
- Claude adds `/sync` at the end when the app waits for the flow's answer. Do not add it yourself.
