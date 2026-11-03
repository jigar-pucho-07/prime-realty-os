# 01 — PRD · Prime Realty OS
_Generated 2026-11-03 from os.yaml._

**Client:** Prime Realty India, Bhopal  
**Outcome:** Every WhatsApp and phone enquiry answered by the AI agent at once, booked for a site visit with the right broker, and followed up until it closes.  
**Languages:** en, hi · **Volume:** ~1140 events/month · **Operating cost:** see `docs/estimate.md` (credits/month, workflow-wise)

## Pages
- **overview** `/` — Leads, site visits and bookings this month — and what needs a person now
- **inbox** `/inbox` — Every WhatsApp and call conversation — take over from the AI agent and reply by hand
- **leads** `/leads` — Every lead from WhatsApp and calls, from first message to booked or lost
- **visits** `/site-visits` — Every site visit and booking — confirm, record the outcome, see the broker log
- **inventory** `/inventory` — Every property the AI agent may offer — only Available ones are offered
- **followups** `/follow-ups` — Clients who said busy or "baad mein" — the agent nudges them up to three times
- **calls** `/calls` — Calls the AI voice agent answered, with transcript and outcome
- **brokers** `/brokers` — The brokers the AI agent assigns visits to, by specialty, with their visits and closures
- **ai_agents** `/ai-agents` — The WhatsApp agent, the voice agent and the follow-up scheduler — recent runs and failures
- **agent_settings** `/agent-settings` — The agent's name and language, follow-up timing and company details
- **my_visits** `/my-visits` — The visits assigned to me — call the client and record the outcome
- **my_leads** `/my-leads` — Leads assigned to me, with the full conversation
- **my_followups** `/my-follow-ups` — My clients who asked to be contacted later
- **settings** `/settings` — Profile and password
- **users** `/users` — Everyone who can sign in, and what each role may open

## Workflows
- **MESSAGES** — trigger `webhook.catch_webhook`; writes messages, audit_log
  - `reply` — model none, ~4s, ~7 credits; payload Lead_ID, Lead_Name, Phone, Broker, Text → result sent
- **VISITS** — trigger `webhook.catch_webhook`; writes bookings, leads, audit_log
  - `schedule_visit` — model none, ~5s, ~7 credits; payload Lead_ID, Name, Phone, Broker, Property_Name, Visit_At, Budget_INR, Source, Notes, To → result Booking_ID
  - `confirm_client` — model none, ~4s, ~7 credits; payload Booking_ID, Client_Name, Client_Phone, Property_Name, Visit_At, Broker → result sent

## Rules in code
- PR - WA_AGENT (custom flow, step 6): a WhatsApp message from a phone not in leads creates the lead (Source WhatsApp, Stage New, AI_Mode On); a known phone attaches to its lead — dedupe on Phone in CODE
- PR - WA_AGENT: one llm-ai call writes the reply in the client's language (Hinglish / Hindi / English, from agent_settings.agent_language) and returns {intent, fields, reply}; the parse step keeps only those keys
- PR - WA_AGENT: matching inventory is chosen in CODE before the AI call — properties with Status=Available whose Type, Config, Area_Name and price range fit the lead's stated area, budget, BHK and type; the prompt sees only those rows
- PR - WA_AGENT / VOICE_AGENT: intent book_visit with a property and a date inserts a bookings row (Created_By AI agent, Status Scheduled) and moves the lead to Visit Scheduled
- Broker assignment (CODE): property Type Residential → Residential specialist, Commercial → Commercial, Plot → Plots; among Active brokers of that specialty, the one with fewest Scheduled visits; tie → alphabetical
- PR - WA_AGENT / VOICE_AGENT: a new booking sends the approved template broker_visit_alert to the assigned broker's phone (client name, phone, property, budget, visit time)
- PR - WA_AGENT / VOICE_AGENT: intent later (busy, baad mein, call later) inserts a followups row: Count 0, Max_Count = agent_settings.followup_max, Next_Due_At = now + followup_delay_hours
- PR - FOLLOWUP_RUN (schedule, every 4 h): each Pending follow-up with Next_Due_At ≤ now and Count < Max_Count gets template followup_1 / followup_2 / followup_3 by Count (CODE), then Count + 1, Last_Sent_At = now, Next_Due_At += followup_interval_hours; Count = Max_Count → Completed. No AI
- PR - VOICE_AGENT (custom flow, step 6): each VAPI caller turn gets one llm-ai answer returned synchronously to VAPI; the end-of-call report writes the calls row (transcript, duration, outcome, recording URL)
- PR - WA_AGENT: a lead with AI_Mode=Off gets no AI reply — the message is stored and shown in the Inbox only
- PR - WA_AGENT: any inbound message from a lead with a Pending follow-up sets that follow-up to Replied (no further nudges)
- PR - WA_AGENT / VOICE_AGENT / FOLLOWUP_RUN write an agent_runs row for every failed run and FOLLOWUP_RUN one row per run (counts sent / completed)
- Every flow write goes through /api/data with the shared INBOUND_TOKEN; messages and followups carry the lead's Broker so a broker's scope covers them
- Lead budget, property price and deal values are stored in rupees; ₹ L / Cr is display only (D10)

## Not in v1
- Meta Ads lead-form capture — needs a Graph API fetch of the lead's details (X1)
- Telegram broker alerts — brokers are alerted on WhatsApp (X2)
- Google Sheets as the record — replaced by this database (X3)
- Sending property photos, videos and virtual tours on WhatsApp — needs media hosting (X4)
- Excel export — the kernel CSV export covers inventory and calls (X5)
- API keys and tokens on any screen — connections live in Pucho Studio (X6)

## Success metric
Site visits booked per month and lead → booking conversion (sample 142 → 38, 27 %)
