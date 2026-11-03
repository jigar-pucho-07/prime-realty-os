# Prime Realty OS — step 1 (requirement collection)

Sources and how they are cited:
- `[html Lnnn]` — `realstate_dashboard_v2.html`, line nnn (the client's UI sample)
- `[n8n Lnnn]` — `Real Estate AI Agent.json`, line nnn (the client's existing n8n workflow)
- `[intake 03-Nov]` — the intake answers given on 3 Nov 2026 (`intake/00-intake.md`)

## Problem card — Prime Realty India, Bhopal
**Outcome in the client's words:** Every WhatsApp or phone enquiry is answered by the AI agent at once, in the client's language, shown matching properties, booked for a site visit with the right broker, and followed up automatically when the client says "baad mein" — and the office sees every lead, visit and booking on one screen instead of in Google Sheets.
**Actors:** Client · Office admin · Broker · AI agent
**Inputs:** WhatsApp messages from clients (Meta WhatsApp Cloud API today, pucho-whatsapp in the OS); inbound voice calls through VAPI (transcript per turn); property inventory typed by the office; the broker list.
**Outputs:** AI WhatsApp replies; AI voice replies to VAPI; lead, conversation, site-visit booking, follow-up and call records; a WhatsApp alert to the assigned broker; template follow-up messages to clients.
**Volume:** ⚑ assumed from the dashboard sample — 142 leads/month, 89 voice calls/month, 38 bookings/month, ~31 follow-up messages/day; to be confirmed by Prime Realty.
**Languages:** Hinglish, Hindi and English — the client's own language on every reply ("ALWAYS RESPOND IN THE SAME LANGUAGE THE CLIENT USES" [n8n L128]).
**Systems:** WhatsApp Business (Meta Cloud API), VAPI voice, Google Sheets (Bookings, Follow_Up_Queue — retired by the OS), Telegram (retired in v1), n8n (replaced by Pucho Studio).
**Success:** Site visits booked per month and the lead → booking conversion on the overview (sample: 142 leads → 38 bookings, 27 % [html L526]).
**Constraints:** WhatsApp messages outside the 24-hour window must be Meta-approved templates; voice replies must return within VAPI's response window; no API keys or tokens on any screen; brokers see only their own leads.

**Screens in the client's dashboard:** Dashboard · Inbox · Inventory · Brokers · AI Agents · Call Recordings · Settings [html L401–L429]; "Add Property", "Confirm & Assign Broker", "Schedule Visit", "AI Mode", "Mark all read" [html L452–L602].
**Client's own status words:** properties "24 active · 6 sold · 3 under negotiation" [html L614], Available / Booked / Sold [html L627]; bookings confirmed / pending / site visit / cancelled [html L867–L876]; leads hot / warm / cold, unread [html L880]; follow-up Pending / Completed, "Follow Up Count", "Last Follow Up", Reason busy / no_response / asked_for_later [n8n L267, L435]; executions success / error, "Failed Executions" [html L691]; call outcome booking / followup / not interested [html L716].
**Client's own field words:** Client Name, Phone Number, Mobile, Property Name, Budget, Visit Date, Source, Broker Assigned, Status, Notes [n8n L363–L372]; Property Name, Type, Location, Price Range, BHK / Config, Area (sq.ft), Status, Tags [html L802–L814]; Specialty, Experience, Leads, Closed, Revenue, Rating [html L931]; Agent Name, Language, Run Every (hours), Max Follow-ups per Lead, Follow-up Delay, Company Name, Office Phone, RERA Number [html L749–L788]; Unassigned / Reassign and Reschedule are the office's verbs for a broker change and a new visit date ⚑.

## Requirement lines
R1  A Client who sends a WhatsApp message from a new number becomes a lead, deduplicated on phone  — "Parse WhatsApp incoming message … phoneNumber = msg.from" [n8n L67]
R2  The AI agent replies to the Client on WhatsApp in the Client's own language  — "ALWAYS RESPOND IN THE SAME LANGUAGE THE CLIENT USES (Hindi/English/Hinglish)" [n8n L128]
R3  The AI agent asks the Client for location, budget, BHK and purpose  — "Ask key questions: location preference, budget range, BHK requirement, purpose (buy/rent/invest)" [n8n L128]
R4  The AI agent offers the Client only available properties that match location, budget, BHK and type  — "Get list of available properties based on client requirements like location, budget, BHK, type" [n8n L169]
R5  When the Client agrees to a visit, a site-visit booking is created for the chosen property and date  — "When a client finalizes or confirms interest in a property, use this tool to save the booking" [n8n L205]
R6  Each new booking is assigned to a Broker by property type: residential, commercial or plots  — "Select broker based on property type" [n8n L391]
R7  The assigned Broker receives a WhatsApp alert with the Client's name, phone, property, budget and visit time  — "NEW BOOKING LEAD ASSIGNED TO YOU … Please contact the client within 30 minutes!" [n8n L391]
R8  When the Client says busy or "baad mein", the lead is queued for follow-up  — "If client says they are busy … 'baad mein', 'call later' … mark them for follow-up" [n8n L249]
R9  Up to three follow-up messages go to a queued Client on a fixed schedule, then the follow-up stops  — "Stops after 3 follow-ups and marks lead as completed" [html L977]
R10 The AI agent answers a Client's inbound voice call and the call, transcript and outcome are stored  — "Answers direct incoming calls, understands property requirements via voice … and confirms bookings automatically" [html L963]
R11 The Office admin can take over a conversation from the AI agent and reply by hand  — "Type a message or let AI handle it..." [html L601]
R12 The Office admin can add a property with name, type, location, price range, BHK, area, status and tags  — "Add New Property … Property Name * … Type * … Location * … Price Range *" [html L800]
R13 The Office admin can confirm a booking for a Client and assign the Broker by hand  — "Confirm & Assign Broker" [html L844]
R14 The Office admin sees total leads, bookings confirmed, active properties and revenue pipeline for the month  — "Total Leads (August) … Bookings Confirmed … Active Properties … Revenue Pipeline" [html L473]
R15 The Office admin sees the lead funnel from total leads to booking confirmed, and the lead sources  — "Lead Funnel — August 2026 … From Meta Ads + WhatsApp + Voice" [html L501]
R16 The Office admin sees each Broker's leads, closed deals, revenue and the assignment log  — "Broker Assignment Log … Bookings assigned to brokers via Telegram this month" [html L647]
R17 The Office admin sees each automation's runs and failures  — "Workflow Execution Log … last 10 executions" [html L698]
R18 A Broker signs in and sees only the leads, visits and conversations assigned to them  — "Owner/admin + brokers: each broker signs in and sees only the leads, bookings and follow-ups assigned to them" [intake 03-Nov]
R19 The Office admin sets the agent name, language, follow-up interval, maximum follow-ups and company details  — "Run Every (hours) … Max Follow-ups per Lead … Follow-up Delay (hours after no reply)" [html L772]
R20 ⚑ A lead moves through stages New → Engaged → Visit scheduled → Booked or Lost  — inferred from R5, R14, R15 (the funnel needs a stage)
R21 ⚑ The AI agent stops replying to a Client while the Office admin has taken over the conversation  — inferred from R11
R22 ⚑ A follow-up stops as soon as the Client replies  — inferred from R8, R9 (the n8n flow never checks; a reply should end the nudges)

## Not in v1
X1  Meta Ads lead-form capture — "Which lead channels … in v1? → WhatsApp AI chat agent, Voice calls (VAPI)" [intake 03-Nov]; the n8n parser also never fetched the lead details [n8n L77]
X2  Telegram broker alerts — brokers are alerted on WhatsApp instead [intake 03-Nov]
X3  Google Sheets as the record — replaced by the OS database [intake 03-Nov]
X4  Sending property photos, videos and virtual tours on WhatsApp — "Share property details, videos, and virtual tours" [n8n L128]; needs media hosting, v2
X5  Excel export of inventory and calls — "Exporting to Excel" [html L617]; the kernel CSV export covers it
X6  API keys and tokens on the Settings page — "OpenAI API Key … Access Token … Bot Token" [html L738]; connections live in Studio (rule 5)

## Gaps
G1  How many leads, WhatsApp messages and voice calls do you get in a normal month (the dashboard shows 142 leads, 89 calls)?
G2  Which WhatsApp number will the agent use, and is it already on WhatsApp Business API?
G3  Will you approve 5 WhatsApp templates (3 follow-ups, broker alert, visit confirmation) in Hinglish?
G4  Is VAPI already set up with an assistant, or should we use Pucho's own voice-call tool instead?
G5  Who are the real brokers, with phone numbers and specialty?
G6  When two brokers share a specialty, should the new booking go to the one with fewer open visits?
G7  How is broker commission calculated — a percent of deal value or a fixed amount?
G8  Are the nine properties in the dashboard your real inventory, or should we import a list?
G9  After how many hours of no reply should the first follow-up go out (the sample says 24)?
