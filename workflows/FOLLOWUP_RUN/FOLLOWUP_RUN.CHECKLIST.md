# Studio checklist — PR - FOLLOWUP_RUN

File: `FOLLOWUP_RUN.json`. Do the steps in order. Tick each box.

## 1. Import
- [ ] Studio → Flows → Import → pick the file above.

## 2. Trigger — Every 4 hours (IST)
- [ ] Pick the connection for **schedule**.

## 3. Open the follow-up (R8) (`step_open`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `POST`
  - **url**: `SET_IN_STUDIO_APP_URL/api/data/followups`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer SET_IN_STUDIO_INBOUND_TOKEN", "X-Flow": "FOLLOWUP_RUN"}`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Followup_ID": "{{step_each['item']['row']['Followup_ID']}}", "Created_At": "{{step_each['item']['row']['Created_At']}}", "Lead_ID": "{{step_each['item']['row']['Lead_ID']}}", "Lead_Name": "{{step_each['item']['row']['Lead_Name']}}", "Phone": "{{step_each['item']['row']['Phone']}}", "Broker": "{{step_each['item']['row']['Broker']}}", "Reason": "{{step_each['item']['row']['Reason']}}", "Property_Interest": "{{step_each['item']['row']['Property_Interest']}}", "Count": "{{step_each['item']['row']['Count']}}", "Max_Count": "{{step_each['item']['row']['Max_Count']}}", "Next_Due_At": "{{step_each['item']['row']['Next_Due_At']}}", "Last_Sent_At": "{{step_each['item']['row']['Last_Sent_At']}}", "Status": "{{step_each['item']['row']['Status']}}"}}`

## 4. Send the follow-up template (R9) (`step_nudge`, pucho-whatsapp)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **account_id**: `SET_IN_STUDIO_WHATSAPP_ACCOUNT_ID`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **to**: `{{step_each['item']['to']}}`
  - **template_id**: `{{step_each['item']['template_id']}}`
  - **template_variables**: `{"name": "{{step_each['item']['vars']['name']}}", "property": "{{step_each['item']['vars']['property']}}", "office_phone": "{{step_each['item']['vars']['office_phone']}}"}`

## 5. Count the nudge, set the next one (`step_nudge_patch`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `PATCH`
  - **url**: `SET_IN_STUDIO_APP_URL/api/data/followups`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer SET_IN_STUDIO_INBOUND_TOKEN", "X-Flow": "FOLLOWUP_RUN"}`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **queryParams**: `eq.{{step_each['item']['id']}}`
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Count": "{{step_each['item']['patch']['Count']}}", "Last_Sent_At": "{{step_each['item']['patch']['Last_Sent_At']}}", "Next_Due_At": "{{step_each['item']['patch']['Next_Due_At']}}", "Status": "{{step_each['item']['patch']['Status']}}"}}`

## 6. Show the nudge in the Inbox (`step_nudge_message`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `POST`
  - **url**: `SET_IN_STUDIO_APP_URL/api/data/messages`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer SET_IN_STUDIO_INBOUND_TOKEN", "X-Flow": "FOLLOWUP_RUN"}`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Lead_ID": "{{step_each['item']['message']['Lead_ID']}}", "Lead_Name": "{{step_each['item']['message']['Lead_Name']}}", "Phone": "{{step_each['item']['message']['Phone']}}", "Broker": "{{step_each['item']['message']['Broker']}}", "Channel": "{{step_each['item']['message']['Channel']}}", "Direction": "{{step_each['item']['message']['Direction']}}", "Sender": "{{step_each['item']['message']['Sender']}}", "Text": "{{step_each['item']['message']['Text']}}", "Intent": "{{step_each['item']['message']['Intent']}}", "WA_Message_ID": "{{step_each['item']['message']['WA_Message_ID']}}", "At": "{{step_each['item']['message']['At']}}"}}`

## 7. Mark Replied / Completed / Stopped (R22) (`step_status`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `PATCH`
  - **url**: `SET_IN_STUDIO_APP_URL/api/data/followups`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer SET_IN_STUDIO_INBOUND_TOKEN", "X-Flow": "FOLLOWUP_RUN"}`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **queryParams**: `eq.{{step_each['item']['id']}}`
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Status": "{{step_each['item']['Status']}}"}}`

## 8. Log this run on the AI agents page (R17) (`step_run`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `POST`
  - **url**: `SET_IN_STUDIO_APP_URL/api/data/agent_runs`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer SET_IN_STUDIO_INBOUND_TOKEN", "X-Flow": "FOLLOWUP_RUN"}`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"At": "{{step_plan['run']['At']}}", "Flow": "{{step_plan['run']['Flow']}}", "Trigger": "{{step_plan['run']['Trigger']}}", "Lead_ID": "{{step_plan['run']['Lead_ID']}}", "Status": "{{step_plan['run']['Status']}}", "Duration_Ms": "{{step_plan['run']['Duration_Ms']}}", "Detail": "{{step_plan['run']['Detail']}}"}}`

## 9. Plan: open, reply-check, due nudges, completion (CODE, no AI) (`step_plan`, code)
- [ ] Open the step's code and replace each placeholder with the real value, then save:
  - `SET_IN_STUDIO_TEMPLATE_ID_FOLLOWUP_` → the approved template's id: open the **Send Template Message** step, pick the template in the **Template** dropdown (the name is in `whatsapp_template_names`), copy the value and paste it here. The template must be approved on whatsapp.pucho.ai first; its {{1}}, {{2}}… must match the variables the step fills

## 10. Publish
- [ ] Press **Publish**. Edits do nothing until Studio says the flow is published.
- [ ] Self-check: open **Plan: open, reply-check, due nudges, completion (CODE, no AI)**. Its code has **181 lines** and line 1 is `// @ts-nocheck`. If not, paste it again and publish.

## 11. Hand back
- [ ] Copy the webhook URL from the trigger step and send it to Claude.
- Claude adds `/sync` at the end when the app waits for the flow's answer. Do not add it yourself.
