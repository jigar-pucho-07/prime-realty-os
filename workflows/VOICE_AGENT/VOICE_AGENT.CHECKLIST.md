# Studio checklist — PR - VOICE_AGENT

File: `VOICE_AGENT.json`. Do the steps in order. Tick each box.

## 1. Import
- [ ] Studio → Flows → Import → pick the file above.

## 2. Store the call: transcript, duration, outcome (R10) (`step_call`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `POST`
  - **url**: `SET_IN_STUDIO_APP_URL/api/data/calls`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer SET_IN_STUDIO_INBOUND_TOKEN", "X-Flow": "VOICE_AGENT"}`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Lead_ID": "{{step_prep['call']['Lead_ID']}}", "Caller_Name": "{{step_prep['call']['Caller_Name']}}", "Phone": "{{step_prep['call']['Phone']}}", "Broker": "{{step_prep['call']['Broker']}}", "VAPI_Call_ID": "{{step_prep['call']['VAPI_Call_ID']}}", "Started_At": "{{step_prep['call']['Started_At']}}", "Duration_Sec": "{{step_prep['call']['Duration_Sec']}}", "Outcome": "{{step_prep['call']['Outcome']}}", "Property_Interest": "{{step_prep['call']['Property_Interest']}}", "Transcript": "{{step_prep['call']['Transcript']}}", "Recording_URL": "{{step_prep['call']['Recording_URL']}}"}}`

## 3. Say the next line + intent (ONE AI call) (`step_ai`, llm-ai)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **model**: `{"modelValue": "openai/gpt-4o-mini", "providerName": "OpenRouter"}`
  - **puchoModelKey**: `openai/gpt-4o-mini`
  - **puchoProviderName**: `OpenRouter`
  - **query**: `{{step_prep['prompt']}}`
  - **temperature**: `0.3`
  - **maxTokens**: `400`

## 4. Create the lead (new number, R1) (`step_new_book_lead`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `POST`
  - **url**: `SET_IN_STUDIO_APP_URL/api/data/leads`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer SET_IN_STUDIO_INBOUND_TOKEN", "X-Flow": "VOICE_AGENT"}`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Lead_ID": "{{step_finish['lead']['Lead_ID']}}", "Created_At": "{{step_finish['lead']['Created_At']}}", "Name": "{{step_finish['lead']['Name']}}", "Phone": "{{step_finish['lead']['Phone']}}", "Source": "{{step_finish['lead']['Source']}}", "Stage": "{{step_finish['lead']['Stage']}}", "Purpose": "{{step_finish['lead']['Purpose']}}", "Property_Type": "{{step_finish['lead']['Property_Type']}}", "BHK": "{{step_finish['lead']['BHK']}}", "Area_Pref": "{{step_finish['lead']['Area_Pref']}}", "Budget_Min_INR": "{{step_finish['lead']['Budget_Min_INR']}}", "Budget_Max_INR": "{{step_finish['lead']['Budget_Max_INR']}}", "Property_Interest": "{{step_finish['lead']['Property_Interest']}}", "Broker": "{{step_finish['lead']['Broker']}}", "AI_Mode": "{{step_finish['lead']['AI_Mode']}}", "Lang": "{{step_finish['lead']['Lang']}}", "Last_Message": "{{step_finish['lead']['Last_Message']}}", "Last_Message_At": "{{step_finish['lead']['Last_Message_At']}}", "Next_Followup_At": "{{step_finish['lead']['Next_Followup_At']}}", "Followup_Reason": "{{step_finish['lead']['Followup_Reason']}}", "Lost_Reason": "{{step_finish['lead']['Lost_Reason']}}", "Summary": "{{step_finish['lead']['Summary']}}", "History": "{{step_finish['lead']['History']}}"}}`

## 5. Book the visit: PR - VISITS.schedule_visit (booking, stage, broker alert) (`step_new_book_visit`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `POST`
  - **url**: `SET_IN_STUDIO_WEBHOOK_VISITS`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `application/json`
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"app_url": "SET_IN_STUDIO_APP_URL", "inbound_token": "SET_IN_STUDIO_INBOUND_TOKEN", "company_name": "SET_IN_STUDIO_COMPANY_NAME", "action": "{{step_finish['visit']['action']}}", "Lead_ID": "{{step_finish['visit']['Lead_ID']}}", "Name": "{{step_finish['visit']['Name']}}", "Phone": "{{step_finish['visit']['Phone']}}", "Broker": "{{step_finish['visit']['Broker']}}", "To": "{{step_finish['visit']['To']}}", "Property_Name": "{{step_finish['visit']['Property_Name']}}", "Visit_At": "{{step_finish['visit']['Visit_At']}}", "Budget_INR": "{{step_finish['visit']['Budget_INR']}}", "Source": "{{step_finish['visit']['Source']}}", "Notes": "{{step_finish['visit']['Notes']}}"}}`  ← **replace with the real value** (Claude bakes it in once you send it)

## 6. Create the lead (new number, R1) (`step_new_lead`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `POST`
  - **url**: `SET_IN_STUDIO_APP_URL/api/data/leads`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer SET_IN_STUDIO_INBOUND_TOKEN", "X-Flow": "VOICE_AGENT"}`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Lead_ID": "{{step_finish['lead']['Lead_ID']}}", "Created_At": "{{step_finish['lead']['Created_At']}}", "Name": "{{step_finish['lead']['Name']}}", "Phone": "{{step_finish['lead']['Phone']}}", "Source": "{{step_finish['lead']['Source']}}", "Stage": "{{step_finish['lead']['Stage']}}", "Purpose": "{{step_finish['lead']['Purpose']}}", "Property_Type": "{{step_finish['lead']['Property_Type']}}", "BHK": "{{step_finish['lead']['BHK']}}", "Area_Pref": "{{step_finish['lead']['Area_Pref']}}", "Budget_Min_INR": "{{step_finish['lead']['Budget_Min_INR']}}", "Budget_Max_INR": "{{step_finish['lead']['Budget_Max_INR']}}", "Property_Interest": "{{step_finish['lead']['Property_Interest']}}", "Broker": "{{step_finish['lead']['Broker']}}", "AI_Mode": "{{step_finish['lead']['AI_Mode']}}", "Lang": "{{step_finish['lead']['Lang']}}", "Last_Message": "{{step_finish['lead']['Last_Message']}}", "Last_Message_At": "{{step_finish['lead']['Last_Message_At']}}", "Next_Followup_At": "{{step_finish['lead']['Next_Followup_At']}}", "Followup_Reason": "{{step_finish['lead']['Followup_Reason']}}", "Lost_Reason": "{{step_finish['lead']['Lost_Reason']}}", "Summary": "{{step_finish['lead']['Summary']}}", "History": "{{step_finish['lead']['History']}}"}}`

## 7. Update the lead (requirement, history, stage) (`step_old_book_lead`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `PATCH`
  - **url**: `SET_IN_STUDIO_APP_URL/api/data/leads`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer SET_IN_STUDIO_INBOUND_TOKEN", "X-Flow": "VOICE_AGENT"}`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **queryParams**: `eq.{{step_finish['lead_id']}}`
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Created_At": "{{step_finish['lead']['Created_At']}}", "Name": "{{step_finish['lead']['Name']}}", "Phone": "{{step_finish['lead']['Phone']}}", "Source": "{{step_finish['lead']['Source']}}", "Stage": "{{step_finish['lead']['Stage']}}", "Purpose": "{{step_finish['lead']['Purpose']}}", "Property_Type": "{{step_finish['lead']['Property_Type']}}", "BHK": "{{step_finish['lead']['BHK']}}", "Area_Pref": "{{step_finish['lead']['Area_Pref']}}", "Budget_Min_INR": "{{step_finish['lead']['Budget_Min_INR']}}", "Budget_Max_INR": "{{step_finish['lead']['Budget_Max_INR']}}", "Property_Interest": "{{step_finish['lead']['Property_Interest']}}", "Broker": "{{step_finish['lead']['Broker']}}", "AI_Mode": "{{step_finish['lead']['AI_Mode']}}", "Lang": "{{step_finish['lead']['Lang']}}", "Last_Message": "{{step_finish['lead']['Last_Message']}}", "Last_Message_At": "{{step_finish['lead']['Last_Message_At']}}", "Next_Followup_At": "{{step_finish['lead']['Next_Followup_At']}}", "Followup_Reason": "{{step_finish['lead']['Followup_Reason']}}", "Lost_Reason": "{{step_finish['lead']['Lost_Reason']}}", "Summary": "{{step_finish['lead']['Summary']}}", "History": "{{step_finish['lead']['History']}}"}}`

## 8. Book the visit: PR - VISITS.schedule_visit (booking, stage, broker alert) (`step_old_book_visit`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `POST`
  - **url**: `SET_IN_STUDIO_WEBHOOK_VISITS`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `application/json`
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"app_url": "SET_IN_STUDIO_APP_URL", "inbound_token": "SET_IN_STUDIO_INBOUND_TOKEN", "company_name": "SET_IN_STUDIO_COMPANY_NAME", "action": "{{step_finish['visit']['action']}}", "Lead_ID": "{{step_finish['visit']['Lead_ID']}}", "Name": "{{step_finish['visit']['Name']}}", "Phone": "{{step_finish['visit']['Phone']}}", "Broker": "{{step_finish['visit']['Broker']}}", "To": "{{step_finish['visit']['To']}}", "Property_Name": "{{step_finish['visit']['Property_Name']}}", "Visit_At": "{{step_finish['visit']['Visit_At']}}", "Budget_INR": "{{step_finish['visit']['Budget_INR']}}", "Source": "{{step_finish['visit']['Source']}}", "Notes": "{{step_finish['visit']['Notes']}}"}}`  ← **replace with the real value** (Claude bakes it in once you send it)

## 9. Update the lead (requirement, history, stage) (`step_old_lead`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `PATCH`
  - **url**: `SET_IN_STUDIO_APP_URL/api/data/leads`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer SET_IN_STUDIO_INBOUND_TOKEN", "X-Flow": "VOICE_AGENT"}`  ← **replace with the real value** (Claude bakes it in once you send it)
  - **queryParams**: `eq.{{step_finish['lead_id']}}`
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Created_At": "{{step_finish['lead']['Created_At']}}", "Name": "{{step_finish['lead']['Name']}}", "Phone": "{{step_finish['lead']['Phone']}}", "Source": "{{step_finish['lead']['Source']}}", "Stage": "{{step_finish['lead']['Stage']}}", "Purpose": "{{step_finish['lead']['Purpose']}}", "Property_Type": "{{step_finish['lead']['Property_Type']}}", "BHK": "{{step_finish['lead']['BHK']}}", "Area_Pref": "{{step_finish['lead']['Area_Pref']}}", "Budget_Min_INR": "{{step_finish['lead']['Budget_Min_INR']}}", "Budget_Max_INR": "{{step_finish['lead']['Budget_Max_INR']}}", "Property_Interest": "{{step_finish['lead']['Property_Interest']}}", "Broker": "{{step_finish['lead']['Broker']}}", "AI_Mode": "{{step_finish['lead']['AI_Mode']}}", "Lang": "{{step_finish['lead']['Lang']}}", "Last_Message": "{{step_finish['lead']['Last_Message']}}", "Last_Message_At": "{{step_finish['lead']['Last_Message_At']}}", "Next_Followup_At": "{{step_finish['lead']['Next_Followup_At']}}", "Followup_Reason": "{{step_finish['lead']['Followup_Reason']}}", "Lost_Reason": "{{step_finish['lead']['Lost_Reason']}}", "Summary": "{{step_finish['lead']['Summary']}}", "History": "{{step_finish['lead']['History']}}"}}`

## 10. Prepare: caller turn or end of call, matching inventory, the prompt (CODE) (`step_prep`, code)
- [ ] Open the step's code and replace each placeholder with the real value, then save:
  - `SET_IN_STUDIO_COMPANY_NAME` → the real value

## 11. Publish
- [ ] Press **Publish**. Edits do nothing until Studio says the flow is published.
- [ ] Self-check: open **Finish: declared keys only, check the visit, assign the broker, build the lead (CODE)**. Its code has **244 lines** and line 1 is `// @ts-nocheck`. If not, paste it again and publish.

## 12. Hand back
- [ ] Copy the webhook URL from the trigger step and send it to Claude.
- Claude adds `/sync` at the end when the app waits for the flow's answer. Do not add it yourself.
