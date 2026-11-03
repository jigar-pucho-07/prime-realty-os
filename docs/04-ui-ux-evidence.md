# 04 · UI / UX — step 4 record (Prime Realty OS)

Hand-authored companion to the generated `04-ui-ux.md` (kept separate so a re-scaffold never overwrites it).
Date: 3 Nov 2026 · Kit v5.1.1 · Only `app/src/custom/**` was written by hand; everything else is generated from `os.yaml`.

## Frontend plan

| Page | Task | Shape |
|---|---|---|
| Dashboard | decide what needs a person now | Needs action (Unassigned · Visits today · Follow-ups due) → 4 KPIs → funnel + sources → recent bookings |
| Inbox | read and answer conversations | **custom** split view — list · thread · composer (below) |
| Leads | push leads through stages | board / table, bulk assign, drawer with Requirement · Conversation · Visits |
| Site visits | record outcomes | table / board, outcome modal, reassign, client confirmation |
| Inventory | maintain what the AI may offer | cards / table, add (8 fields) / edit / status |
| Follow-ups, Call recordings, AI agents, Agent settings, Brokers | queue, read-only logs, settings, team | generated tables / cards |
| Broker portal | My site visits (queue, call, outcome) · My leads · My follow-ups | scoped to the signed-in broker |

Tokens: tone pucho, ink primary, brand #1A6BFF as accent only; Geist; hairline edges. Motion: 200 ms fade/rise on a new message bubble, skipped under reduced motion; no count-ups, lifts or gradients.

## What was built — `ConversationInbox`

`app/src/custom/ConversationInbox.jsx`, registered in `src/custom/index.js` (R11, R21).

| Part | Behaviour |
|---|---|
| Conversation list | One row per lead with messages (or a last message on the lead), newest first; avatar, name, time, preview, who is answering (AI agent / Office), a Call chip for voice leads, the stage. Search by name, phone digits or message text; chips All · Taken over · With AI agent with counts. |
| Thread | Oldest → newest; client left (surface), AI agent (brand tint) and office (info tint) right; sender, channel and time on every bubble; scrolls to the newest. |
| Header | Name, stage badge, phone · property · broker (or Unassigned), a Call link (`tel:`), and ONE action: **Take over** (primary) while the AI answers, **Hand back** after. |
| Composer | Only after Take over (R21: the agent stays quiet while `AI_Mode=Off`), and only within **24 hours** of the client's last WhatsApp message (Meta refuses free text later). Otherwise a callout says why and what to do instead. Ctrl + Enter sends; 1,000-character cap. A future timestamp never opens the window. |
| Writes | Take over / Hand back → direct patch `leads.AI_Mode` (no credits). Reply → `MESSAGES.reply` (until the flow is wired the app stores the message and the toast says *WhatsApp not sent — simulated*). |
| Phone | Below 768 px the list and the thread are one screen each, with a Back button. |

Kernel parts only: `Avatar`, `Chip`, `ChipRow`, `Callout`, `StatusBadge`, `CARD`, antd `Button`, `os-control` fields, tokens, `runAction`, `useEntity`, `prefersReducedMotion`. No hex literal, no new package.

os.yaml: the Inbox page declares `send_reply` (MESSAGES.reply, no fields, never opened) so the server permits the composer's call.

## Observed (built server on 127.0.0.1:3000, demo data, 3 Nov 2026)

- Signed in as Arvind Kumar via the persona picker; `/inbox` lists 17 conversations (3 taken over, 14 with the AI agent).
- Ankit Sharma (taken over; a client message 20 min old added to the demo DB for the test): reply sent with Ctrl + Enter → an *Office* bubble, conversation moved to the top; simulated, nothing left the machine.
- Hand back → composer replaced by "The AI agent is answering this client…"; Take over → composer back.
- Vikram Chauhan (taken over, last wrote 18 days ago) → warning callout, no reply box.
- Fixed: a seeded future last-message time (Priya Shah, 4 Nov) had opened the 24-hour window.
- The in-app browser pane's emulated screenshot drew the sidebar over the list at 1366 px while the DOM put the Inbox at x = 284 beside a 260 px sidebar — a pane artefact; `evidence/ui-check*/` are the reference screenshots.

## Not verified

- A real WhatsApp send (flows simulated until steps 6–7).
- Screen-reader pass beyond labels, `aria-current` and `aria-live`; keyboard order read from the markup only.
- Reduced motion checked in code, not with the OS setting toggled.

## Kit notes for the skill owner (rule 11 — not patched here)

1. `via: custom` flow actions are not added to `access.js ACTIONS` / `PAGE_ACTIONS`, so a custom section's `runAction` is refused. Worked around with a field-less modal declaration.
2. The installed skill reports `SKILL MODIFIED — SKILL.md (edited)` on every script; not edited here.
3. The installed skill path (~200 chars) makes `scaffold_os.py` fail on Windows' 260-character limit; run from a copy at `C:\pucho\kit`.
4. Scaffold needs Pillow for the PNG app icons; without it `ui_check` fails `pwa` with no hint at scaffold time.
5. `04-ui-ux.md` asks step 4 to record evidence in a generated file; done here in a companion file instead.
