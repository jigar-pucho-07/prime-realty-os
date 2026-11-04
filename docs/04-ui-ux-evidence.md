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

## 4 Nov 2026 — status chips, phone field, modal height (client requests)

| Change | Where | How it was checked |
|---|---|---|
| **Multi-select status chips** on every page that has them (Leads, Site visits, Inventory, Follow-ups, Call recordings, AI agents, My leads, My follow-ups): a row shows when its status is ANY selected one; empty selection = All. Counts, period, search, filters, bulk, views unchanged. | `custom/PrTableBlock.jsx` (copy of the kernel TableBlock, segment = a Set) via `custom/PrPage.jsx`, registered in `screens/overrides.js` | Built server, each page: two stages selected = sum of their counts, deselect one = the other's count, All = total; Leads with search "Kolar" + Engaged + Visit Scheduled = 5 rows, all of those stages |
| **Phone field**: country-code picker (+91 India default, + UAE, USA/Canada, UK, Singapore, Australia, Saudi Arabia, Qatar, Nepal), digits only (keys, paste and drop filtered), India = exactly 10 digits starting 6–9. Stored as before: `+<code><digits>`. Submit refused with the reason under the field. | `custom/PrFields.jsx` (PhoneInput, `phoneProblem`) + `custom/PrActionModal.jsx` (submit check); Leads (Add lead) and Brokers (Add / Edit broker) | Key-by-key typing `9 8 a b c 7 6 5 - 4 3 ␣ 2 1 0 9 9` → `9876543210`; paste `+91 98765 43210` / `098765 43210` / `91-98765-43210` → `9876543210`; 8 digits → "An Indian mobile number has exactly 10 digits", form stays open; a saved lead stored `+919812312345`; Edit broker reads `+918774328898` back as +91 / 8774328898 |
| **Add lead height jump** when a broker was picked | `custom/popupSlack.js` (imported by `custom/index.js`) | 1280×540 window: panel padding 28px → 107px while the Broker list is open (the kernel's borrowed room), back to 28px / content 511px after picking, clicking away or Tab — no growth across repeated opens |

Server side is unchanged: the kernel's phone rule accepts 10–13 digits with an optional +, so the India-exactly-10 rule is enforced in the form, not by the server (a flow or the API could still write an 11-digit Indian number).

Kit notes (rule 11 — for the skill owner):
11. `config/popup.js ensureRoomBelow` adds padding-bottom to a modal / drawer / main to make room for a dropdown and never removes it: the panel grows with blank space after any bottom field is used in a short window, and grows again on every open.
12. Segment chips (`segments:`) are single-select in the kernel `TableBlock`; no os.yaml key for multi-select.
13. The phone field is a free text box (8–15 digits hint); no country code, no exact length per country.
14. Overriding a page to change one block means copying `Page.jsx` + the block (+ `ActionModal.jsx` + `Fields.jsx` for a field change): four kernel files now live in `src/custom/Pr*.jsx` and will not receive kernel fixes until re-copied.

## 4 Nov 2026 (later) — header search, Inbox layout, Inbox badge (client requests)

| Change | Where | How it was checked |
|---|---|---|
| **Header search always visible**: the kernel's search icon + popup replaced by an inline box in the header's centre (same sources, columns, recent items, Ctrl+K); results open under the box. Every page. | `custom/HeaderSearch.jsx` (portal into the header), mounted on every page by `screens/overrides.js` | Built server: Dashboard, Leads, Settings each show the box with the kernel icon hidden; "Ramesh" → Leads · 1 |
| **Inbox fits the screen**: the card is sized to the window below it (re-measured on resize), list 300px (md) / 340px (lg) + chat, only the list and the messages scroll, header and composer pinned. Phone: list first; a chat opens full screen (fixed, 100dvh) with a back button; page behind does not scroll. | `custom/ConversationInbox.jsx` | 1280×800 and 1024×680: no page or horizontal overflow, card bottom inside the window. 375×812: list → tap → chat at 0,0 375×812, composer bottom 812, input/AI Mode/Send inside 375px; Back → list again, page scroll restored |
| **No "Powered by" badge on the Inbox** (it sat over the composer); every other page keeps it | `custom/custom.css` (`body:has([data-os-inbox]) [data-os-powered-by]`) | /inbox display none; /leads and / display block |

Kit notes (rule 11):
15. The header has no override slot; the always-visible search is a portal plus hiding the kernel button.
16. The floating "Powered by" badge (z 9999, bottom-right) covers bottom-pinned controls such as a chat composer; there is no per-page switch.

## 4 Nov 2026 (evening) — Property details by status, search on typing (client requests)

| Change | Where | How it was checked |
|---|---|---|
| **Property details drawer by status**: Property section always; **Under Negotiation** → Customer, Broker, Offered price, Expected price + Negotiation notes; **Booked** → Buyer, Broker, Booking amount, Commission; **Sold** → Buyer, Final price, Broker, Commission + Payment (mode, status, amount received). Available shows the property only. Change status asks for the matching details (show_when); Buyer is required for Booked/Sold, Final price for Sold. | os.yaml (11 new `properties` columns, inventory `drawer:` with `when:`/`as:` sections, `set_status` fields); `custom/PrTableBlock.jsx` resolves `when:` (row filter) and `as:` (Client_Name shown as Buyer / Customer) | Built server 1280×800: PR-003 Booked → Booking section only; PR-006 Sold → Sale + Payment only; PR-007 set to Under Negotiation through the form (customer, broker, prices, notes) → Negotiation section + notes. DB migrated with `npm run db:migrate`; PR-002 and PR-007 are the two Under Negotiation demo rows |
| **Property cards by status**: under the property rows, Under Negotiation → Customer, Broker, Offered; Booked → Buyer, Broker, Booking amount, Commission; Sold → Buyer, Broker, Final price, Commission. Available → none. | os.yaml inventory `card.fields` with `when:`; `custom/PrTableBlock.jsx` (alias keys `w<i>__<Column>` filled only on matching rows; the stored row is untouched) | 1280×900: PR-002 / PR-007 negotiation rows, PR-003 booking rows, PR-006 sale rows, PR-001 none; 375×812: same rows, no horizontal overflow |
| **No "Ctrl K" badge** on the header search (the shortcut still focuses it) | `custom/HeaderSearch.jsx` | no `kbd` in the box; Ctrl+K focuses the input |
| **Header search opens only on typing**: no recent list on click / Ctrl+K; one letter → "keep typing" hint; two+ → results; cleared → closed | `custom/HeaderSearch.jsx` | Click and Ctrl+K: focused, no dropdown; "N" → hint; "Priya" → Leads · 2; cleared → no dropdown |

Kit notes (rule 11):
17. Drawer sections and card fields have no per-row condition (`when:`) and no per-section column label; both are custom here (`PrTableBlock`). The validator rejects a section column that is not on the entity, so the rename is declared with `as:` and applied at runtime.

## 4 Nov 2026 (night) — Kanban boards (client reports)

| Change | Where | How it was checked |
|---|---|---|
| **Lost column not visible** on the Leads board. Cause: kernel columns are a fixed 264px with `min-width: max-content`, so five stages need ~1400px; beside the sidebar Lost sat off-screen behind a horizontal scrollbar at the bottom of a tall board. Desktop: columns share the width (min 168px). Phone: 80%-wide columns that snap on swipe. | `custom/custom.css` (`[data-os-kanban]`), every board (Leads, Site visits) | Leads at 1280 and 1440 with the sidebar: all five columns on screen, Lost = 3 cards, no scroll; 1024: board scrolls 190px (five × 168px minimum); 375: swipe to Lost, 3 cards, no page overflow |
| **Card content clipped**: the broker name got ~70px and the call / WhatsApp buttons wrapped and stacked. Footer stays on one line in a wide card; under 230px (container query on the card) the broker gets the full line and the two 28px buttons sit under it. | `custom/custom.css` (`[data-os-kanban-card]`) | 1280 (160px cards), 1440 (192px), 375 (216px): 19 cards, no broker or "Unassigned · Assign" text cut, no element outside its card, no overlapping buttons; card click still opens the drawer; "Move to…" unchanged |

Gate note: ui_check's header-search step clicks the kernel search icon and types into its popup — the design replaced by the inline search (client request). It crashes there and skips every later check, so ui_check was run from a local copy with only that step skipped (`SKIP_HEADER_SEARCH`); the inline search was checked by hand (see above). Kit note 18: that step should accept an inline search (`[data-os-global-search-inline] input`).

## 4 Nov 2026 (late) — Leads drawer by stage, Leads toolbar (client requests)

| Change | Where | How it was checked |
|---|---|---|
| **Leads drawer by stage**: the Lead tab keeps Requirement, AI summary, Contact and broker; **Visit Scheduled** adds Site visit (date/time, property, broker, status, notes — from the visits table) and Property (area, BHK, price range, possession, availability); **Booked** adds Booking (booked property, amount, date, assigned broker) and Property; **Lost** adds Why it was lost (reason) and Notes. New lead columns `Booking_Amount_INR`, `Booking_Date` (date), `Lost_Notes`; new **Record booking** form (moves Visit Scheduled → Booked, or fills in a Booked lead's booking); Mark lost gains Notes. | os.yaml (leads columns, drawer `when:` / `as:` sections, `record_booking`, `lose`); `custom/PrTableBlock.jsx` resolves `when:` / `as:` inside drawer tabs too | Built server 1280×800: Ramesh Singh (Visit Scheduled) → 3 visit cards + property card; Ketan Desai (Booked) → Record booking saved ₹2,50,000 / 04 Nov 2026 (DB 250000, 2026-11-04 IST) → Booking + property; Aman Tiwari (Lost) → reason + notes, no booking / visit sections. DB migrated with `npm run db:migrate` |
| **Leads toolbar**: the search fills the first line with the filters; the period chips start the second line, with the Board / Table toggle + record count together at its right end, vertically centred, at every width. Phone: controls stacked, toggle + count together on the right. | `custom/custom.css` (`[data-os-toolbar]:has([data-os-period])`, `span.ml-auto`) — every toolbar with period chips | 1280 / 1440 / 1920: row 1 search + filters, row 2 chips left + toggle / count right on one centre line, 12px row gap; 375: group on the right, no overflow; Board ↔ Table still switches, count unchanged |

Notes: the kernel shows the owner (Broker) in the drawer header and drops it from field sections, so the Booking section shows it as "Assigned broker" (`as:`). The Lead tab's count badge is the number of site visits (the kernel counts a tab's first list section). Row actions are not filtered by stage in the kernel: Record booking on a Lost or Engaged lead is refused by the stage machine with a message.
