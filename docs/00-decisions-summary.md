# Prime Realty OS — step 2 analysis summary (for approval)

Source of truth: [os.yaml](../os.yaml) · Kit v5.1.1 · 3 Nov 2026 · Gates: os.yaml validates (trial scaffold, 0 errors), fidelity PASS.

```
Roles & homes      Office admin → Dashboard (/) · Broker → My site visits (/my-visits), scoped to Broker = self on leads, visits,
                   follow-ups, messages, calls (server + row-level security)
Journeys           admin: Inbox → Take over → reply (3) · Leads → Book site visit → property, broker, time (3) ·
                   Dashboard → Needs action → Assign (3) · broker: My site visits → call → Visit outcome (3)
Entities (10)      leads (title Name, owner Broker, due Next_Followup_At, WhatsApp/tel, stages New → Engaged → Visit Scheduled →
                   Booked | Lost, phone unique, Lost needs reason) · properties · brokers · bookings (site visits: Scheduled →
                   Visited → Booked | Cancelled, Booked needs deal value) · messages · followups · calls · agent_runs ·
                   agent_settings · audit_log
Metrics            leads_month · unassigned · taken_over · visits_open · visits_today · booked_month · pipeline_value (₹) ·
                   followups_due · active_props · failed_runs
Sections           Inbox — reads and answers conversations → custom split view (list + thread + composer)
                   Leads — pushes leads through stages → board / table, bulk assign, drawer with the conversation
                   Site visits — records outcomes → table / board, outcome modal, reassign, client confirmation
                   Inventory — maintains what the AI may offer → cards / table, add / edit / status
                   Follow-ups — watches the nudge queue → table, reschedule / stop
                   Call recordings — reads transcripts → table + drawer (view only)
                   Brokers — maintains the team, sees closures → cards + 2 charts + assignment log
                   AI agents — sees runs and failures → table (view only)  · Agent settings — key / value
Actions            CRUD is direct (no credits): add lead, assign, mark lost, take over / hand back, visit outcome, reschedule,
                   property add / edit / status, broker add / edit, follow-up reschedule / stop, settings
                   Flows the app calls: MESSAGES.reply (office reply on WhatsApp) · VISITS.schedule_visit (booking + broker
                   template) · VISITS.confirm_client (visit-confirmation template)
Flows & AI         Custom (step 6, flowkit): PR - WA_AGENT (1 LLM call: reply + intent; inventory match, dedupe, broker
                   assignment in CODE) · PR - VOICE_AGENT (VAPI, sync) · PR - FOLLOWUP_RUN (every 4 h, templates, no AI)
Overview           Needs action (Unassigned · Visits today · Follow-ups due) → 4 KPIs (leads, visits scheduled, booked,
                   pipeline ₹) → Lead funnel · Lead sources → Recent bookings
Operating cost     ≈ 21,700 credits ≈ ₹6,500 / month (estimate, volumes ⚑ from the dashboard sample); app-called flows alone
                   1,806 credits; counted again on the built flows at step 6
Shell & look       one sidebar portal (13 pages, 2 under Setup) · tone pucho, ink primary, brand #1A6BFF as the accent,
                   monogram "Prime Realty" — "an office desk used all day: inbox and visits first, numbers second"
Fidelity           F1 173/191 strings traced to the card · F2 7/9 entities seeded from the client's data · F3 closest
                   reference 16 %
Sign-in / audit    password (argon2id), personas Arvind Kumar (admin) and Rajesh Kumar (broker) · audit on · English UI
Data               PostgreSQL primerealty_dev locally; client DB on CP Portal
Not in v1          Meta Ads forms · Telegram · Google Sheets · media sharing · Excel export · secrets on screen
```

## Footprint (lean-frontend budget)
13 nav pages for 22 requirements · Dashboard 4 KPIs, 2 charts, 3 queues · no page over 4 KPIs or 6 modals · Leads drawer 3 tabs. Within budget.

## Decisions you should check
1. **Office booking alerts the broker, not the client.** "Book site visit" sends the broker template; "Send confirmation to client" is a separate row action. The AI-booked path alerts the broker automatically.
2. **Office replies only inside 24 hours.** WhatsApp refuses free text after that; the composer says so. Anything later goes as a template.
3. **Brokers can't reassign or change lead stages.** They record visit outcomes; the office owns assignment.
4. **Commission is typed in by hand** on "Booked" until the rule is known (gap G7).
5. **AI agent runs are logged only on failure** (the scheduler logs every run), to keep about 2,000 extra writes a month off the bill.

## Kit notes (said out loud)
- The installed skill reports `SKILL MODIFIED — SKILL.md (edited)` on every script run. I did not edit it; it needs restoring by the skill owner (rule 11).
- The kit is run from a read-only copy at `C:\pucho\kit` because the installed path breaks Windows' 260-character limit. The OS will be built at `C:\pucho\prime-realty-os`.
- WA_AGENT, VOICE_AGENT and FOLLOWUP_RUN cannot be generated by `build_flows.py` (inbound flows only capture; schedules only sync Tally). They follow `method/ai-pipeline.md` at step 6 and are traced through `rules_in_code`.

## Definition of done (step 2)
- [x] Every role has a home that matches what they do most
- [x] Every journey ≤ 4 steps
- [x] Every acted-on entity declares title, owner, due, contact
- [x] Every number is a metric
- [x] Every section's shape has a reason
- [x] Every verb is one modal; no recipient or blank-message fields
- [x] Overview: decisions → numbers → one-question charts
- [x] Every R-line covered or deferred (scaffold traceability)
- [x] Operating cost given, marked estimate
- [x] Fidelity PASS
- [ ] Prime Realty's yes on this summary
