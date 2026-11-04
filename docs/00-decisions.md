# 00 — Decisions · Prime Realty OS
_Generated from os.yaml. The step-2 summary: roles and homes, journeys, entities, metrics, sections, actions, flows, overview, theme, tier, not in v1 (`method/os-decisions.md`)._

## D1 · Roles and homes
| role | lands on | pages | in their words |
|---|---|---|---|
| Office admin | `/` | overview, inbox, leads, visits, followups, inventory, calls, ai_agents, agent_settings, brokers, settings, users | Runs the desk: inbox, leads, site visits, inventory, brokers and the AI agent |
| Broker | `/my-visits` | my_visits, my_leads, my_followups, settings | Works the site visits and leads assigned to them |

## D2 · Journeys
- **admin** · Answer a client the AI handed over — lands on `inbox` · 3 steps: Inbox opens on the newest conversation → Take over → Type the reply and send
- **admin** · Book a site visit for a lead — lands on `leads` · 3 steps: Leads opens on the board → Book site visit on the lead → Pick property, broker and time — Book
- **admin** · Assign an unassigned lead — lands on `overview` · 3 steps: Dashboard opens on Needs action → Assign on the first Unassigned row → Pick the broker — Assign
- **broker** · Record how today's visit went — lands on `my_visits` · 3 steps: My site visits opens on Today → Call the client from the row → Visit outcome — Visited / Booked / Cancelled

## D3 · Entities
| entity | title | subtitle | owner | due | contact | stages |
|---|---|---|---|---|---|---|
| leads | Name | Area_Pref | Broker | Next_Followup_At | phone=Phone, whatsapp=Phone | New → Engaged → Visit Scheduled → Booked → Lost |
| properties | Name | Area_Name |  |  |  | Available → Under Negotiation → Booked → Sold |
| brokers | Name | Specialty |  |  | phone=Phone, whatsapp=Phone | Active → Inactive |
| bookings | Client_Name | Property_Name | Broker | Visit_At | phone=Client_Phone, whatsapp=Client_Phone | Scheduled → Visited → Booked → Cancelled |
| messages | Lead_Name |  |  |  |  |  |
| followups | Lead_Name |  | Broker | Next_Due_At | phone=Phone, whatsapp=Phone | Pending → Replied → Completed → Stopped |
| calls | Caller_Name |  | Broker |  | phone=Phone | Booking → Follow-up → Not interested → Info only |
| agent_runs | Flow |  |  |  |  | OK → Failed → Skipped |
| agent_settings | Key |  |  |  |  |  |
| audit_log |  |  |  |  |  |  |

Data: **PostgreSQL** (one database per client, single-tenant) · security: **§19 baseline** (`docs/security.md`)

## D4 · Metrics
| metric | label | entity | where | tone |
|---|---|---|---|---|
| `leads_month` | Leads this month | leads | `Created_At in month` | info |
| `unassigned` | Unassigned | leads | `Broker is empty and Stage not in [Booked, Lost]` | warn |
| `taken_over` | Taken over from AI | leads | `AI_Mode=Off and Stage not in [Booked, Lost]` | info |
| `visits_open` | Visits scheduled | bookings | `Status=Scheduled` | info |
| `visits_today` | Visits today | bookings | `Visit_At=today and Status=Scheduled` | warn |
| `booked_month` | Booked this month | bookings | `Status=Booked and Created_At in month` | ok |
| `pipeline_value` | Revenue pipeline | bookings | `Status in [Scheduled, Visited]` · sum Budget_INR | info |
| `followups_due` | Follow-ups due | followups | `Next_Due_At<=today and Status=Pending` | warn |
| `active_props` | Active properties | properties | `Status in [Available, Under Negotiation]` | info |
| `failed_runs` | Failed runs | agent_runs | `Status=Failed` | bad |

## D5 · Sections — the shape of each
| page | section | shape |
|---|---|---|
| Dashboard | Needs action | needs_action: unassigned · visits_today · followups_due |
| Inbox | custom | custom |
| Leads | kpis | kpis (strip) |
| Leads | leads | kanban / table; bulk assign_broker; drawer per row |
| Site visits | kpis | kpis (strip) |
| Site visits | bookings | table / kanban; drawer per row |
| Inventory | kpis | kpis (strip) |
| Inventory | properties | cards / table; drawer per row |
| Follow-ups | kpis | kpis (strip) |
| Follow-ups | followups | table; drawer per row |
| Call recordings | kpis | kpis (strip) |
| Call recordings | calls | table; drawer per row |
| Brokers | charts | charts: breakdown, breakdown |
| Brokers | brokers | cards / table; drawer per row |
| AI agents | kpis | kpis (strip) |
| AI agents | agent_runs | table; drawer per row |
| Agent settings | agent_settings | table; drawer per row |
| My site visits | Your site visits | queue: visits_today · Coming up · Visited — not closed |
| My leads | leads | table; drawer per row |
| My follow-ups | followups | table; drawer per row |

## D6 · Actions
| page | action | shape |
|---|---|---|
| Dashboard | Assign broker | edit: 1 field · direct |
| Dashboard | Visit outcome | status: 4 fields · direct |
| Dashboard | Stop follow-ups | status: 0 fields · direct |
| Inbox | Take over from the AI agent | status: 0 fields · direct |
| Inbox | Hand back to the AI agent | status: 0 fields · direct |
| Inbox | Send reply | custom: 0 fields · MESSAGES |
| Leads | Add lead | create: 7 fields · direct |
| Leads | Book site visit | custom: 5 fields · VISITS |
| Leads | Assign broker | edit: 1 field · direct |
| Leads | Record booking | status: 4 fields · direct |
| Leads | Mark lost | status: 2 fields · direct |
| Site visits | Visit outcome | status: 4 fields · direct |
| Site visits | Reschedule or reassign | edit: 2 fields · direct |
| Site visits | Send confirmation to client | status: 0 fields · VISITS |
| Inventory | Add property | create: 8 fields · direct |
| Inventory | Edit property | edit: 8 fields · direct |
| Inventory | Change status | status: 13 fields · direct |
| Follow-ups | Reschedule nudge | edit: 1 field · direct |
| Follow-ups | Stop follow-ups | status: 0 fields · direct |
| Brokers | Add broker | create: 6 fields · direct |
| Brokers | Edit broker | edit: 4 fields · direct |
| Agent settings | Change setting | edit: 1 field · direct |
| My site visits | Visit outcome | status: 4 fields · direct |

## D7 · Flows and AI
- **MESSAGES** — `webhook.catch_webhook`; actions reply; no model call
- **VISITS** — `webhook.catch_webhook`; actions schedule_visit, confirm_client; no model call
- Rules in code: PR - WA_AGENT (custom flow, step 6): a WhatsApp message from a phone not in leads creates the lead (Source WhatsApp, Stage New, AI_Mode On); a known phone attaches to its lead — dedupe on Phone in CODE; PR - WA_AGENT: one llm-ai call writes the reply in the client's language (Hinglish / Hindi / English, from agent_settings.agent_language) and returns {intent, fields, reply}; the parse step keeps only those keys; PR - WA_AGENT: matching inventory is chosen in CODE before the AI call — properties with Status=Available whose Type, Config, Area_Name and price range fit the lead's stated area, budget, BHK and type; the prompt sees only those rows; PR - WA_AGENT / VOICE_AGENT: intent book_visit with a property and a date calls PR - VISITS.schedule_visit (the same action the office uses): a bookings row with Status Scheduled, the lead moved to Visit Scheduled, the broker alerted; Broker assignment (CODE, app/src/custom/agent): the lead's broker if one is set; else property Type Residential → Residential specialist, Commercial → Commercial, Plot → Plots, among Active brokers; several of one specialty → rotated by the lead number; none → any Active broker; PR - VISITS.schedule_visit sends the approved template broker_visit_alert to the assigned broker's phone (client name, phone, property, budget, visit time) — for AI and office bookings alike; PR - WA_AGENT / VOICE_AGENT: intent later (busy, baad mein, call later) sets the lead's Followup_Reason and Next_Followup_At; PR - FOLLOWUP_RUN opens the followups row (Count 0, Max_Count = agent_settings.followup_max, Next_Due_At = client's last message + followup_delay_hours); PR - FOLLOWUP_RUN (schedule, every 4 h): each Pending follow-up with Next_Due_At ≤ now and Count < Max_Count gets template followup_1 / followup_2 / followup_3 by Count (CODE), then Count + 1, Last_Sent_At = now, Next_Due_At += followup_interval_hours; Count = Max_Count → Completed. No AI; PR - VOICE_AGENT (custom flow, step 6): each VAPI caller turn gets one llm-ai answer returned synchronously to VAPI; the end-of-call report writes the calls row (transcript, duration, outcome, recording URL); PR - WA_AGENT: a lead with AI_Mode=Off gets no AI reply — the message is stored and shown in the Inbox only; PR - FOLLOWUP_RUN: a Pending follow-up whose lead wrote after the last nudge (Last_Message_At > Last_Sent_At, else > Created_At) becomes Replied — no further nudges; PR - FOLLOWUP_RUN writes one agent_runs row per run (due, sent, replied, completed). WA_AGENT / VOICE_AGENT runs and their failures are in Studio's run history (no step left in their 14-step budget for a log write) ⚑ known gap; Every flow write goes through /api/data with the shared INBOUND_TOKEN; messages and followups carry the lead's Broker so a broker's scope covers them; Lead budget, property price and deal values are stored in rupees; ₹ L / Cr is display only (D10)

## D8 · Overview order
- Needs action (unassigned · visits_today · followups_due) → KPI strip → charts: funnel, breakdown → recent

## D9 · Shell & look
- Brand `#1A6BFF` → primary **brand** (red is overdue / lost / destructive only); mark: monogram
- Shell: admin → sidebar
- Look: tone pucho · face geist (login stays IBM Plex) · edges pucho · canvas paper · radius pucho · density comfortable · labels mono · sidebar light
- Direction: An office desk used all day: the inbox and the visit list first, numbers second

## D11 · Not in v1
- Meta Ads lead-form capture — needs a Graph API fetch of the lead's details (X1)
- Telegram broker alerts — brokers are alerted on WhatsApp (X2)
- Google Sheets as the record — replaced by this database (X3)
- Sending property photos, videos and virtual tours on WhatsApp — needs media hosting (X4)
- Excel export — the kernel CSV export covers inventory and calls (X5)
- API keys and tokens on any screen — connections live in Pucho Studio (X6)
- Changing the agent's name (Priya) and reply-language rule from the app — they are constants of PR - WA_AGENT / VOICE_AGENT, changed in Studio; a fourth read would push the booking path past the 14-step budget. Follow-up timing and company details stay in Agent settings

## Footprint (lean frontend, v4.3)
- footprint: 13 pages in the nav (0 hidden) · 23 KPIs · 4 charts · 23 modals · 5 drawer tabs · for 22 requirements
- Budget: overview ≤ 4 KPIs · ≤ 2 charts · ≤ 3 queues; a page ≤ 4 KPIs · ≤ 6 modals · drawer ≤ 3 tabs; nav pages ≤ requirements. Pages marked `badge: Preview` stay off the nav until `os.show_preview: true`.
- Within budget.

## Definition of done
Tick against this page before step 3, and against the screenshots before step 4 (`method/os-decisions.md`).
