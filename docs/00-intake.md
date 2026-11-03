# 00 · Intake — Prime Realty OS

Kit: Pucho OS v5.1.1 · Recorded: 3 Nov 2026 · Copied into `prime-realty-os/docs/00-intake.md` at scaffold (step 3).

## Answers (AskUserQuestion, 3 Nov 2026)

| Question | Answer |
|---|---|
| For whom | One client — Prime Realty India, Bhopal · `os.mode: client` · `os.client_short: PR` |
| Users | Owner/admin + brokers. Brokers see only rows assigned to them |
| Channels in v1 | WhatsApp AI chat agent · Voice calls (VAPI) |
| Stage | Pilot — real users and data, flows wired, CP Portal |
| Look (default, source has its own) | Pucho Design System; keep the sample's layout and interactions, not its palette |

## Build brief

- **Build:** an AI-first lead desk. WhatsApp and voice enquiries are answered by the AI agent, matched to available inventory,
  booked for a site visit and assigned to a broker; unresponsive clients get up to three template follow-ups. The office runs
  everything from Overview · Inbox · Leads · Site visits · Inventory · Follow-ups · Calls · Brokers · Automations · Settings ·
  Users & roles. Brokers get a scoped portal (my leads, visits, follow-ups, conversations).
- **Roles:** Admin (owner/office) · Broker.
- **Data home:** the OS's own PostgreSQL (`primerealty_dev` locally; the client database on CP Portal). Google Sheets retired.
- **Automatic:** AI replies (WhatsApp, voice), property matching, broker assignment, booking creation, follow-up sends.
- **Human:** take-over and manual replies, booking confirm / reschedule / cancel / mark booked, inventory, brokers, settings.
- **Not in v1:** X1–X6 in the problem card (Meta Ads, Telegram, Sheets, media sharing, Excel export, secrets on screen).
- **Samples needed:** a real WhatsApp chat export (to test Hinglish replies), the real inventory list, the broker list with
  phones, one VAPI call payload, the commission rule.
- **Business rules to confirm:** price units (₹ lakh / crore stored as rupees), BHK vocabulary (1–4 BHK, Shop, Office, Plot,
  Land), area units (sq.ft vs sq.yd vs acres), follow-up timing (delay, interval, max), broker tie-break.
- **Outputs that leave the app:** WhatsApp text inside 24 h and approved templates outside it (pucho-whatsapp); the voice reply
  returned to VAPI as JSON. No file leaves the app in v1.
- **Simulated or unverified at pilot start:** WhatsApp templates (until Meta approves them) — SIMULATED; VAPI round-trip latency
  — UNVERIFIED until the first live call; Hinglish reply quality — UNVERIFIED until tested on a real chat export.
- **Look:** Pucho tone, Geist in the app, the brand as one accent; Hindi labels not requested.
- **Risks (kit known gaps):** Studio webhooks accept unauthenticated calls (keep URLs server-side); first `body.data` http write
  is proven only at the first Studio import; real CP Portal deploy from a v5.1 deploy folder not yet proven.

## Environment (check_env)

| Tool | State on 3 Nov 2026 |
|---|---|
| Node | v26.13.0 ✓ |
| PostgreSQL | 18.6, service running ✓ — `primerealty_dev` to be confirmed at step 3 (`db:migrate`) |
| Python 3 + pyyaml | **missing** (Microsoft Store placeholder only) |
| Git | **missing** |
| Playwright Chromium | not checked (needs Python env first) |
