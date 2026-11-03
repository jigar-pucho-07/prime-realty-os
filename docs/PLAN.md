# Prime Realty OS: analysis and phased build plan

Kit: Pucho OS v5.1.1 · Date: 3 Nov 2026 · Stage: **Pilot** · Mode: **client** (`client_short: PR`)

---

## 0 · Intake answers (step 0)

| Question | Answer |
|---|---|
| For whom | One client: **Prime Realty India**, Bhopal. Flow titles are `PR - <FLOW>` |
| Who signs in | **Owner/admin** (everything) + **brokers** (only their own leads, visits, follow-ups and conversations) |
| Channels in v1 | **WhatsApp AI chat agent** + **Voice calls (VAPI)** |
| Not in v1 | Meta Ads lead forms, Telegram broker alerts. Brokers get their alerts on **WhatsApp** instead |
| Stage | **Pilot**: real users and real data, flows imported and wired, deployed on CP Portal |
| Automation | AI replies on its own. A person can take over a conversation (the Inbox "AI Mode" toggle). Bookings the AI creates are reviewable |
| Data home | The OS's own PostgreSQL database. Google Sheets from the n8n build is **retired** |
| Look | Pucho Design System (white, Geist, the brand as one accent). Keep the HTML's **layout and interactions** (sectioned sidebar, inbox split view, property cards, call player), but not its palette or emoji icons |

---

## 1 · What the two references tell us

### 1a · `realstate_dashboard_v2.html`: the UI

| Page in the HTML | What it does | Becomes in the OS |
|---|---|---|
| Dashboard | 4 KPIs (leads, bookings, active properties, pipeline ₹), lead funnel, daily-leads bars, source split, live activity, recent bookings | **Overview** with 4 KPIs (each opens its list), 2 charts (funnel and leads/day), 1 queue (today's site visits), activity feed |
| Inbox | Conversation list, chat thread, "Schedule visit", "Confirm booking", AI Mode toggle, manual send | **Inbox**: a `custom` split view over `conversations` + `messages`, with actions *Reply* / *Take over* / *Hand back to AI* / *Book site visit* |
| Inventory | Property cards with filters (type, status, area), Add Property, Export | **Inventory**: cards and table views on `properties`, *Add* / *Edit* / *Mark booked/sold* |
| Brokers | Broker cards (leads, closed, revenue, rating) and an assignment log | **Brokers**: `brokers` with computed stats, and an assignment log read from `bookings` |
| AI Agents | Agent cards and the n8n execution log | **Automations** (admin only): flow status plus a run log from the kernel's `jobs` table and audit log. No fake numbers |
| Call Recordings | Call cards, waveform player, transcript, outcome | **Calls**: `calls` with the transcript in the detail drawer and the recording link from VAPI |
| Settings | Meta token, OpenAI key, Telegram token, Sheet ID, scheduler, company info | **Settings**: the kernel Settings (company, app URL, inbound token, flow webhook URLs) + business settings (agent name, language, follow-up interval, max follow-ups, RERA no.). **Secrets are dropped from the UI** (rule 5). Connections live in Studio |
| *(missing)* | No lead list or pipeline anywhere in the HTML | **Leads**: table plus a stage board (New → Engaged → Visit scheduled → Booked / Lost). This is the core page of a lead OS |
| *(missing)* | The follow-up queue exists only in Google Sheets | **Follow-ups**: queue, due today, count, last sent |
| — | — | **Users & roles** (kernel), **Profile** (kernel) |

**Broker portal:** My Leads · My Site Visits · My Follow-ups · My Conversations (read-only and reply), all scoped on the server to the signed-in broker.

### 1b · `Real Estate AI Agent.json`: the n8n workflow

**What it does:** 4 triggers (WhatsApp, Meta Ads, VAPI voice, a 4-hour schedule). The three inbound triggers are normalised into one GPT-4o-mini **agent** ("Priya", Hinglish) with a 20-turn memory and 3 tools (get properties, save booking + assign broker, mark for follow-up). Output goes to a WhatsApp reply, a Google Sheets "Bookings" row and a Telegram broker alert. The scheduler reads `Follow_Up_Queue`, sends up to 3 templated WhatsApp nudges, and updates the count.

**Defects found. Do not carry these over:**

1. **The voice reply never reaches VAPI.** `Format Voice Response` has no input. Voice output goes into the WhatsApp send path instead.
2. **A booking is detected by string matching** (`includes('booking confirm')`), and `Assign Broker` runs on **every** reply, so a Sheets row and a Telegram alert fire on every message.
3. **Round-robin is overwritten.** The keyword match always wins, and "residential" always goes to Rajesh, so there is no load balancing.
4. **The tools point at `$workflow.id`** (the agent calls its own workflow), so the tools never actually run as written.
5. **Properties are hard-coded in the prompt.** Inventory changes never reach the AI.
6. **The Meta leadgen payload has only IDs.** No Graph call fetches the lead's name or phone.
7. **The JSON body is built by string interpolation** (`"body": "{{ $json.message }}"`). It breaks on quotes and newlines.
8. **Follow-up updates match on phone in Sheets.** Duplicates collide, there is no "next due" time, and the 24-hour delay setting is unused.
9. **Follow-ups go out as free text after 24 hours.** WhatsApp rejects this outside the 24-hour window. An **approved template** is required.
10. **Tokens are hard-coded** in the HTTP nodes.

**How it maps to Pucho Studio:** Studio flows follow rule zero and the simplicity budget: ≤ 14 steps per path, ≤ 1 AI call, no nested router, and every path ends in a Return. The n8n "agent + tools + memory" pattern is therefore **broken apart**. Code does the deterministic work, and the model only writes words.

| n8n piece | Prime Realty OS |
|---|---|
| Agent tool `Get_Available_Properties` | **CODE / app**: filter `properties` by area, budget, BHK and type before the AI call. The AI only describes the matches |
| Agent tool `Save_Booking_And_Assign_Broker` | The AI returns `intent: book_visit` + fields. A **CODE** node assigns the broker (specialty, then lowest open load) and the flow writes a `bookings` row through `/api/data` |
| Agent tool `Mark_Client_For_Followup` | `intent: later`. CODE sets `next_followup_at`, and the flow writes a `followups` row |
| Conversation memory (20 turns) | The `messages` table. The flow reads the last 20 messages for the lead before the AI call |
| Google Sheets Bookings / Follow_Up_Queue | `bookings`, `followups` tables in PostgreSQL |
| Telegram broker alert | `pucho-whatsapp` **template** to the broker. The recipient and text come from the record (rule 10) |
| Hard-coded tokens / OpenAI key | Studio connections (`llm-ai`, `pucho-whatsapp`). The app holds only `INBOUND_TOKEN` and webhook URLs, server-side |

**Studio flows (draft. `build_flows.py` emits the real ones from `os.yaml`):**

| Flow | Trigger | Path (≤ 14 steps, 1 AI call) | Writes |
|---|---|---|---|
| `PR - WA_AGENT` | webhook `inbound: true` (pucho-whatsapp inbound) | parse (skip non-message) → lookup lead + last 20 messages + matching properties → **llm-ai: one JSON {intent, fields, reply}** → parse (keep declared keys) → router on `intent` (`ask` / `book_visit` / `later`) → [book: assign broker → insert booking → broker template] / [later: insert follow-up] → send reply → insert messages → Return | `leads`, `messages`, `bookings`, `followups` |
| `PR - VOICE_AGENT` | webhook (VAPI), **sync** (≤ 25 s) | same brain as WA, but returns `{response}` to VAPI and stores the `calls` row and transcript | `calls`, `leads`, `bookings`, `followups` |
| `PR - FOLLOWUP` | schedule, every 4 h | read due follow-ups (count < max, `next_followup_at` ≤ now) → CODE picks template 1/2/3 → pucho-whatsapp **template** → update count / next due / status → Return. **No AI** (templates, as in n8n) | `followups`, `messages` |
| `PR - SEND` | app action (Inbox reply, booking confirm) | send text (inside 24 h) or template (outside 24 h) to the record's phone → insert message → Return | `messages` |

Booking confirmation, property CRUD and broker CRUD are **`direct`** app actions (no flow, no credits).

---

## 2 · Database (PostgreSQL 18, running locally)

**Don't hand-create tables in pgAdmin.** The schema is generated from `os.yaml` (`db/schema.sql`, plus CHECK/UNIQUE constraints, `db/rls.sql` row-level security and the roles `app` / `studio_reader`) and applied with `npm run db:migrate`. pgAdmin creates only the empty database:

- Database: **`primerealty_dev`** (the seed refuses a name not ending in `_dev` / `_demo`)
- In pgAdmin: *Databases → Create → Database…* → name `primerealty_dev`, owner `postgres`
- The connection goes into `prime-realty-os/app/.env` (`DB_HOST=127.0.0.1`, `DB_PORT=5432`, `DB_NAME=primerealty_dev`, `DB_USER`, `DB_PASSWORD`). You type the password there yourself. I never ask for it

**Planned entities** (final in step 2):

| Entity | Key fields | Rules |
|---|---|---|
| `leads` | id `LD-0001`, name, phone (unique), source (whatsapp/voice/walk-in), stage, budget_min/max ₹, bhk, area, purpose (buy/rent/invest), property_interest → properties, broker → brokers, ai_mode (on/off), last_message_at, next_followup_at | phone type `phone`, dedupe on phone, stage `transitions` |
| `properties` | id `PR-001`, name, type (Residential/Commercial/Plot), bhk, area_name, location, price_min/max ₹, size + unit, floor, parking, status (Available/Booked/Sold/Under negotiation), tags, possession | price_min ≤ price_max, positive |
| `brokers` | id, user → users, name, phone, specialty (Residential/Commercial/Plots), active | linked to a sign-in user with the `broker` role |
| `bookings` (site visits) | id `BK-1001`, lead, property, broker, visit_at, budget, source, status (Scheduled → Visited → Booked / Cancelled), commission ₹, created_by (ai/user) | visit_at `no_past` on create, `requires_on: Booked → commission` |
| `conversations` / `messages` | lead, channel, direction (in/out), sender (client/ai/user), text, wa_message_id, at | append-only |
| `followups` | lead, reason (busy/no_response/later), property_interest, count, max, next_due_at, last_sent_at, status (Pending/Completed/Replied) | count 0–max |
| `calls` | id `CALL-001`, lead, vapi_call_id (unique), started_at, duration_s, outcome (booking/followup/not_interested), transcript, recording_url | |

Kernel tables come with it: users, roles, sessions, audit log, jobs, app_settings.

---

## 3 · Requirement lines (draft. Confirmed in step 1)

- **R1** A WhatsApp message from a new number creates a lead (deduped on phone) and gets an AI reply in the client's language within ~10 s.
- **R2** The AI suggests only properties that are *Available* in the inventory and match the lead's area, budget, BHK and type.
- **R3** When a client agrees to a visit, a site-visit booking is created and a broker is assigned by specialty, then by lowest open load.
- **R4** The assigned broker gets a WhatsApp alert with the client's name, phone, property, budget and visit time.
- **R5** When a client says busy or "baad mein", a follow-up is queued, and up to 3 template follow-ups go out at the configured interval.
- **R6** A follow-up stops when the client replies or the maximum is reached.
- **R7** An incoming VAPI call gets an AI voice answer, and the call, transcript and outcome are stored against the lead.
- **R8** The office can take over any conversation, reply by hand, and hand it back to the AI.
- **R9** The office can add, edit and change the status of properties. Changes reach the AI immediately.
- **R10** The office can confirm, reschedule or cancel a site visit, and mark it booked with a commission.
- **R11** The overview shows leads, visits scheduled, bookings and pipeline value for a period, and each opens its list.
- **R12** The overview shows a lead funnel and a source split.
- **R13** A broker signs in and sees only their own leads, visits, follow-ups and conversations.
- **R14** An admin manages brokers and users, and sees each broker's leads, closures and revenue.
- **R15** An admin sees each automation's status and recent runs, and failures are visible.
- **R16** Settings hold the company profile, agent name/language and follow-up cadence. No secrets in the UI.

**Not in v1:** Meta Ads lead forms (needs a Graph API fetch of lead details), Telegram alerts, property photo/video sharing on WhatsApp, a public property site, Excel export (a CSV export is kernel).

**Gaps to close with the client:**
- Prime Realty's WhatsApp number on pucho-whatsapp, and Meta-approved templates (3 follow-ups + broker alert + visit confirmation, in Hinglish)
- The VAPI assistant setup (or Studio's own `ai-voice-call` tool instead of VAPI)
- The real broker list with phones
- Commission rule (% or fixed)
- Real inventory, if the HTML's 9 properties are only a sample

---

## 4 · Phased plan

Each phase ends on the skill's gate, with the artefact committed in `evidence/`.

| Phase | Skill step | Work | Gate / evidence | Who |
|---|---|---|---|---|
| **P0 · Environment** | 0 | Install **Python 3.12** (python.org, not the Store stub) + `pip install pyyaml`, **Git**, `npx playwright install chromium`. Create `primerealty_dev` in pgAdmin | `check_env.py` all green | You (installs), me (check) |
| **P1 · Requirements & cost** | 1 | Problem card, R1–R16 confirmed, `volumes.yaml` (leads/month, messages per lead, calls/month), `estimate_os.py` gives credits/month per flow | `docs/00-intake.md`, card, `docs/estimate.md` sent to the client | Me → you confirm |
| **P2 · Decide the OS** | 2 | `os.yaml`: roles (admin, broker), journeys, entities + validation, metrics, pages, actions + sends, flows, Pucho look, footprint check, `fidelity_check.py` | One-screen analysis summary **approved**, fidelity PASS, traceability with no empty rows | Me → **you approve** |
| **P3 · Scaffold + DB** | 3 | `scaffold_os.py os.yaml prime-realty-os` → `npm i`, `db:migrate` (×2), `db:seed`, `build`, `npm run check`, `ui_check` desktop / mobile / dark | Schema visible in pgAdmin, build clean, ui_check 0 failures | Me |
| **P4 · UI** | 4 | `src/custom/**`: Inbox split-view chat, property card grid, call transcript drawer with player, broker cards, overview funnel. Kernel components and tokens only | ui_check desktop + mobile 0 failures, screenshots reviewed per role | Me |
| **P5 · Client approval** | 5 | Click-through on demo data with the admin and broker personas | **Written sign-off** from Prime Realty | You / client |
| **P6 · Studio workflows** | 6 | `build_flows.py --app-url … --company-name "Prime Realty India"` → 4 flows + contracts + CHECKLISTs, `flow_sim` 0 failures, complexity report, counted estimate **acknowledged**, import with `import_flows.py` | `docs/import-sheet.md` with Studio id, webhook and test status per flow | Me + you (Studio API key, connections) |
| **P7 · Integration** | 7 | pucho-whatsapp number + templates approved, VAPI pointed at `PR - VOICE_AGENT`, webhook URLs in Settings, one shared `INBOUND_TOKEN`, a real WhatsApp message round-trips | Screenshot of a real lead → AI reply → booking row in the DB, broker account isolation check, `security_scan --stage pilot` 0 Critical / 0 High | You (accounts) + me |
| **P8 · Test & security audit** | 8, 8b | `tests/test_os.py`, `validate_inputs.py` (every rule refused), Auditor and Fixer sub-agents | All green, `docs/security-audit.md` | Me |
| **P9 · Deploy, QA, handover** | 7, 9, 10 | `build_deploy.py` → `deploy-ready.zip` + `--check-zip` OK, CP Portal upload, schema SQL on the client DB, temporary admin changed, `qa_os.py` on the live URL, `handover_check.py` READY | `check-zip: OK`, `docs/qa-report.md` 0 failures, `docs/handover.md` | Me + you (portal) |

**Order of value:** P0–P3 gives a working app on your local DB. P4–P5 gives an approved UI. P6–P7 makes the AI agent live on WhatsApp and voice. P8–P9 makes it pilot-ready on CP Portal.

---

## 5 · Blockers and risks (as of now)

- ~~Python / Git missing~~: installed 3 Nov 2026 (Python 3.12.10 + pyyaml, Git 2.56). Restart the app or terminal so they are on PATH.
- **Before P3:** `pip install playwright` + Chromium (`check_env` MISS), and add `C:\Program Files\PostgreSQL\18\bin` to PATH for `psql` / `createdb`.
- **Windows long paths are off.** A repo under this Desktop folder plus `node_modules` / `.next` goes past 260 characters. **Scaffold the OS at `C:\pucho\prime-realty-os`** (or enable long paths as an administrator).
- Node v26.13.0 and PostgreSQL 18.6 are present and fine.
- **WhatsApp 24-hour rule:** follow-ups and broker alerts need Meta-approved templates. Until they are approved, those sends stay **SIMULATED**.
- **Studio webhooks are unauthenticated** (known kit gap). Keep webhook URLs private, server-side only.
- **Voice latency:** VAPI expects a fast answer. Lookup + 1 LLM call + writes must fit the sync window. This is **UNVERIFIED** until the first live call.
- **Hinglish quality** of the single LLM call must be checked against real chats before go-live.
