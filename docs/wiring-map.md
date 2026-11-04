# Wiring map · Prime Realty OS
_Generated 2026-11-04._

## Screen → flow.action
- Dashboard `/` → direct patch (Assign broker), direct patch (Visit outcome), direct patch (Stop follow-ups)
- Inbox `/inbox` → direct patch (Take over from the AI agent), direct patch (Hand back to the AI agent), `MESSAGES.reply` (Send reply)
- Leads `/leads` → direct insert (Add lead), `VISITS.schedule_visit` (Book site visit), direct patch (Assign broker), direct patch (Mark lost)
- Site visits `/site-visits` → direct patch (Visit outcome), direct patch (Reschedule or reassign), `VISITS.confirm_client` (Send confirmation to client)
- Inventory `/inventory` → direct insert (Add property), direct patch (Edit property), direct patch (Change status)
- Follow-ups `/follow-ups` → direct patch (Reschedule nudge), direct patch (Stop follow-ups)
- Call recordings `/calls` → no workflow
- Brokers `/brokers` → direct insert (Add broker), direct patch (Edit broker)
- AI agents `/ai-agents` → no workflow
- Agent settings `/agent-settings` → direct patch (Change setting)
- My site visits `/my-visits` → direct patch (Visit outcome)
- My leads `/my-leads` → no workflow
- My follow-ups `/my-follow-ups` → no workflow
- Settings `/settings` → no workflow
- Users & roles `/users` → no workflow

## Flows
- **MESSAGES** — trigger `webhook.catch_webhook`; writes messages, audit_log
  - `reply` — model none, ~4s, ~7 credits; payload Lead_ID, Lead_Name, Phone, Broker, Text → result sent
- **VISITS** — trigger `webhook.catch_webhook`; writes bookings, leads, audit_log
  - `schedule_visit` — model none, ~5s, ~7 credits; payload Lead_ID, Name, Phone, Broker, Property_Name, Visit_At, Budget_INR, Source, Notes, To → result Booking_ID
  - `confirm_client` — model none, ~4s, ~7 credits; payload Booking_ID, Client_Name, Client_Phone, Property_Name, Visit_At, Broker → result sent

## Credit estimate
| action | model | runs/month | credits/run | credits/month |
|---|---|---|---|---|
| `MESSAGES.reply` | none | 200 | 7 | 1,400 |
| `VISITS.schedule_visit` | none | 20 | 7 | 140 |
| `VISITS.confirm_client` | none | 38 | 7 | 266 |
| **total** | | | | **1,806** credits ≈ ₹542 / month (declared; `docs/estimate.md` is the client page and is re-counted on the built flows at step 6) |

Credits are the only unit the client is quoted — no plan fit. Per-step base per `flow/credit-table.md`.
