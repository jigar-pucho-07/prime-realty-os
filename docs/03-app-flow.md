# 03 — App Flow · Prime Realty OS
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
## Navigation and look
Shell per portal: admin=sidebar (`src/config/design.js`); nav from `src/config/nav.js`; tone pucho, radius pucho, density comfortable, sidebar light (`src/config/tokens.css`); header title = active page label. Login → first permitted page. Roles: admin (overview, inbox, leads, visits, followups, inventory, calls, ai_agents, agent_settings, brokers, settings, users), broker (my_visits, my_leads, my_followups, settings).
## Workflow wiring (screen → flow.action)
- Dashboard `/` → direct patch (Assign broker), direct patch (Visit outcome), direct patch (Stop follow-ups)
- Inbox `/inbox` → direct patch (Take over from the AI agent), direct patch (Hand back to the AI agent), `MESSAGES.reply` (Send reply)
- Leads `/leads` → direct insert (Add lead), `VISITS.schedule_visit` (Book site visit), direct patch (Assign broker), direct patch (Record booking), direct patch (Mark lost)
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
## States
Every table: loading skeleton, empty state with CTA, search, filters, segments/period chips where declared, table/cards/kanban views where declared, export. Every modal: validation, pending label, toast, refresh.
