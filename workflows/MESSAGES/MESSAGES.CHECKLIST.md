# Studio checklist — PR - MESSAGES

File: `MESSAGES.json`. Do the steps in order. Tick each box.

## 1. Import
- [ ] Studio → Flows → Import → pick the file above.

## 2. Insert messages: At, Lead_ID, Lead_Name, Phone, Broker, Channel +5 more (Message_ID numbered by the app) (`step_reply_insert`, http)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **method**: `POST`
  - **url**: `{{step_constants['app_url']}}/api/data/messages`
  - **headers**: `{"Content-Type": "application/json", "Authorization": "Bearer {{step_constants['inbound_token']}}", "X-Flow": "{{step_constants['flow']}}"}`
  - **authType**: `NONE`
  - **body_type**: `json`
  - **body**: `{"data": {"Message_ID": "{{step_reply_build['row']['Message_ID']}}", "At": "{{step_reply_build['row']['At']}}", "Lead_ID": "{{step_reply_build['row']['Lead_ID']}}", "Lead_Name": "{{step_reply_build['row']['Lead_Name']}}", "Phone": "{{step_reply_build['row']['Phone']}}", "Broker": "{{step_reply_build['row']['Broker']}}", "Channel": "{{step_reply_build['row']['Channel']}}", "Direction": "{{step_reply_build['row']['Direction']}}", "Sender": "{{step_reply_build['row']['Sender']}}", "Text": "{{step_reply_build['row']['Text']}}", "Intent": "{{step_reply_build['row']['Intent']}}", "WA_Message_ID": "{{step_reply_build['row']['WA_Message_ID']}}"}}`

## 3. Send WhatsApp to the client (`step_reply_send`, pucho-whatsapp)
- [ ] No connection to pick. Check each box below; paste the value if it is empty or different.
- [ ] A box that is a dropdown takes a `{{…}}` value only after you press its **ƒ** button. Press ƒ, then paste.
  - **account_id**: `{{step_constants['whatsapp_account_id']}}`
  - **to**: `{{step_reply_message['to_e164']}}`
  - **message**: `{{step_reply_message['text']}}`

## 4. Constants (`step_constants`, code)
- [ ] Open the step's code and replace each placeholder with the real value, then save:
  - `SET_IN_STUDIO_WHATSAPP_ACCOUNT_ID` → the client's WhatsApp account on Pucho WhatsApp: open any pucho-whatsapp step, pick the account in its **WhatsApp Account** dropdown, copy the value (the account's id) and paste it here — every send step reads it from this constant

## 5. Publish
- [ ] Press **Publish**. Edits do nothing until Studio says the flow is published.
- [ ] Self-check: open **Render the client message (CODE — fixed template, client's language)**. Its code has **47 lines** and line 1 is `// @ts-nocheck`. If not, paste it again and publish.
## 6. Test the trigger — one payload per action
- [ ] Open the trigger step → **Test** → paste a payload below → send. Studio then shows every later step's input filled in, and `{{trigger['body'][…]}}` picks resolve in the UI.
- [ ] After the test, open each **http** step: the **JSON Body** box lists the fields it writes (named, one per column). If a box is empty, the import did not take `body.data` — tell Claude.
- [ ] Test one update with an optional field left blank (e.g. no Close_Reason): the row's column must stay as it was. If it was blanked, tell Claude (the app would then need a skip-empty rule).
- [ ] Each test must end at a **Return** step with `ok: true` and the row it wrote; a run that stops earlier is a failed path.
- [ ] A WhatsApp **text** send reaches a number only inside Meta's 24-hour window after the customer last wrote; a reminder or a win-back must be a **template** send (`sends.template`) approved on whatsapp.pucho.ai.

**reply**
```json
{
  "action": "reply",
  "Lead_ID": "LD-2026-0141",
  "Lead_Name": "Ramesh Singh",
  "Phone": "+919876543210",
  "Broker": "Rajesh Kumar",
  "Text": "Hello, mujhe 3BHK flat dekhna hai Bhopal mein"
}
```

From a terminal (the app sends the same): `curl -X POST <webhook URL>/sync -H 'Content-Type: application/json' -d @payload.json`


## 7. Hand back
- [ ] Copy the webhook URL from the trigger step and send it to Claude.
- Claude adds `/sync` at the end when the app waits for the flow's answer. Do not add it yourself.
