# Custom flows — PR - WA_AGENT · PR - VOICE_AGENT · PR - FOLLOWUP_RUN (step 6)

Built by `tools/build_primerealty_flows.py` (method/ai-pipeline.md, the custom-flow path) because `build_flows.py` cannot express
them: its inbound flows only capture leads, and its schedules only sync Tally. Every rule is in `app/src/custom/agent/agent.js`,
inlined into the CODE nodes by `flowkit.inline_lib`. The model writes only the reply text; code decides everything else.
PR - MESSAGES and PR - VISITS stay on `build_flows.py` (os.yaml).

```
python tools/build_primerealty_flows.py        # PYTHONUTF8=1 on Windows (kit note 6)
node --test tests/agent.test.mjs tests/flow_scenarios.test.mjs
python tests/mutate_flows.py
```

## Gates (3 Nov 2026, evidence/flows/)

| Gate | Result |
|---|---|
| Library unit tests (`tests/agent.test.mjs`) | 14 / 14 pass |
| Built-flow scenarios (`tests/flow_scenarios.test.mjs`) — new lead, booking via VISITS, office takeover, read receipt, voice turn / status / end of call, follow-up run | 7 / 7 pass |
| `validate_flow.py --contract` (5 flows) | PASS, 0 errors (warnings: placeholders, LOOP pending-verify, "no AI" on FOLLOWUP_RUN = a channel job) |
| `flow_sim.mjs` (kit, sample payloads) | 8 runs, 0 failures |
| `complexity.py --strict` | 0 breaches · WA_AGENT longest path 14 · VOICE_AGENT 13 · FOLLOWUP_RUN 8 outside the loop (the meter does not walk inside a loop; the loop body is ≤ 4 more) |
| Contract mutations (`tests/mutate_flows.py`) | 8 / 8 caught |

## The paths (steps · credits per run)

| Flow · path | Steps | Credits | Notes |
|---|---:|---:|---|
| WA_AGENT · receipt / status webhook | 2 | 2 | free router returns before any read |
| WA_AGENT · client message, AI answers | 13 | 11 | 3 reads · prepare · 1 llm-ai · finish · lead write · messages · WhatsApp · Return |
| WA_AGENT · AI books a visit | 14 | 12 + 9 | + PR - VISITS.schedule_visit run (booking, stage, broker template) |
| WA_AGENT · taken over (AI_Mode Off) | 12 | 10 | the model step runs with a one-line prompt, never sees the client's text; no reply sent |
| VOICE_AGENT · caller turn | 12 | 10 | spoken reply returned to VAPI |
| VOICE_AGENT · end of call | 8 | 7 | calls row |
| FOLLOWUP_RUN · each run (every 4 h) | 8 | 8 | + 3 per nudge sent, 1 per follow-up opened / closed |

## Counted vs declared — the client must hear this (step 6 rule)

Volumes are the step-1 assumptions (⚑ G1). Path mix assumed: 90 % talk, 3 % booking, 7 % office.

| Flow | Declared (step 1) | Counted on the built flows |
|---|---:|---:|
| WA_AGENT | 10,412 | 1,140 × 11.2 ≈ **12,800** |
| WA_AGENT receipts | — (not foreseen) | ~5,800 receipts × 2 ≈ **11,600** if pucho-whatsapp forwards receipts; **0** if its webhook sends messages only (UNVERIFIED) |
| VOICE_AGENT | 4,984 | 712 turns × 10 + 89 ends × 7 ≈ **7,750** (+ 2 per VAPI status event that reaches it) |
| FOLLOWUP_RUN | 4,620 | 180 × 8 + 930 nudges × 3 + ~150 open/close ≈ **4,400** |
| MESSAGES + VISITS | 1,666 | 1,846 + ~34 AI bookings × 9 ≈ **2,150** |
| **Total** | **21,682** | **≈ 27,100** without receipts · **≈ 38,700** if every receipt arrives |

That is 1.25× (no receipts) to 1.8× (all receipts) the declared figure. Above 1.5× the client must acknowledge before import
(`python <kit>/scripts/estimate_os.py . --acknowledge "<who, date>"`). The cheapest fix is on the WhatsApp side: subscribe the
inbound webhook to **messages only**, which keeps the total near 27,100 credits (≈ ₹8,100/month at ₹0.30).

## Studio setup — what the generic CHECKLIST cannot know

1. **Import order:** PR - VISITS first. Its webhook URL goes into WA_AGENT and VOICE_AGENT (`SET_IN_STUDIO_WEBHOOK_VISITS`).
2. **Fill the placeholders once, not box by box:** after `scripts/build_deploy.py` has written `deploy/<slug>.env`:
   ```
   python tools/build_primerealty_flows.py --deploy deploy/prime-realty-os.env --visits-webhook <PR - VISITS webhook URL> \
          --whatsapp-account <pucho-whatsapp account id> --template followup_1=<id> --template followup_2=<id> --template followup_3=<id>
   ```
   → `deploy/flows/PR - WA_AGENT.json` etc., with the app URL, inbound token, company name and ids filled in. Import those files,
   never `workflows/` (that copy keeps the placeholders; it is in git). `build_deploy.py` packages only os.yaml flows (kit note 5).
3. **WhatsApp inbound:** point the pucho-whatsapp number's incoming-message webhook at PR - WA_AGENT's webhook URL. If it can be
   limited to messages (no delivery / read receipts), do that (cost above).
4. **VAPI:** the assistant's server URL → PR - VOICE_AGENT's webhook URL with **/sync** (VAPI waits for `{response}`); server
   messages: end-of-call-report plus the caller-turn event. ⚑ G4.
5. **Templates to get approved on whatsapp.pucho.ai** (Hinglish), with exactly these variable names:

   | Template | Variables | Used by |
   |---|---|---|
   | `broker_visit_alert` | client, phone, property, budget, visit | VISITS.schedule_visit (office and AI bookings) |
   | `visit_confirmation` | name, property, visit, broker | VISITS.confirm_client |
   | `followup_1` / `followup_2` / `followup_3` | name, property, office_phone | FOLLOWUP_RUN (wording from the n8n templates: check-in · offer · last nudge) |

## UNVERIFIED until the first live run (say it out loud)

- **pucho-whatsapp's inbound webhook shape.** The normaliser reads the Meta Cloud, Twilio and flat shapes. Send one real message and check that `step_prep` shows `route: agent`.
- **The VAPI turn contract.** The n8n flow's `{from, transcript, call_id}` and VAPI's end-of-call-report are read. VAPI's own turn mechanism (custom LLM / tool) may need a different shape. **Voice latency is unverified:** each turn makes 3 reads and 1 LLM call inside VAPI's response window.
- **`LOOP_ON_ITEMS`** is confirmed by the tech team, but there is no golden export. After import, open FOLLOWUP_RUN and check that the loop's inner steps are attached.
- **Template sends with these variable names**: check that one sends from Studio's test panel.
- **The `/api/data` reads return whole tables.** That is fine at pilot volume (hundreds of leads). Conversation history is kept on the lead (last 20 turns), so the messages table is never read by a turn. A filtered read would need a kernel change (kit note 7).
- **The agent's name and language rule** are flow constants (`CFG` in the builder), not the Agent settings page (os.yaml not_in_v1).

## Kit notes for the skill owner (rule 11 — not patched here)

5. `build_deploy.py` packages and fills only os.yaml-declared flows. Custom-path flows (method/ai-pipeline.md) are left out of `deploy/flows/`, so `tools/… --deploy` does it here.
6. `flowkit.inline_lib` decodes the bundler's output with the Windows code page (cp1252), so a library with ₹ / — / emoji fails. Run with `PYTHONUTF8=1`.
7. `flowkit.inline_lib`'s `fill()` treats any dict with a `settings` key as a step, so a CODE input named `settings` crashes it. The input is renamed here.
8. `/api/data` GET has no filter (`?Phone=eq.…`). Every agent turn reads whole tables.
9. `complexity.py` does not walk `firstLoopAction`. A loop body is outside the measured path.
10. Installing a dev tool (`rolldown`, needed by `inline_lib`) into the app edits the generated `package.json`, and the next scaffold stops on drift. Installed here with `--no-save`, so a clean `npm ci` drops it again.
