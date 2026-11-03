# Requirement traceability
Every client requirement and where the OS covers it. `scaffold_os.py` refuses to build while any row is empty.

| id | requirement | covered by |
|---|---|---|
| R1 | A Client who sends a WhatsApp message from a new number becomes a lead, deduplicated on phone | page leads; rule 1 |
| R2 | The AI agent replies to the Client on WhatsApp in the Client's own language | rule 2 |
| R3 | The AI agent asks the Client for location, budget, BHK and purpose | rule 2 |
| R4 | The AI agent offers the Client only available properties that match location, budget, BHK and type | page inventory; rule 3 |
| R5 | When the Client agrees to a visit, a site-visit booking is created for the chosen property and date | rule 4 |
| R6 | Each new booking is assigned to a Broker by property type: residential, commercial or plots | page brokers; rule 5 |
| R7 | The assigned Broker receives a WhatsApp alert with the Client's name, phone, property, budget and visit time | flow VISITS.schedule_visit; rule 6 |
| R8 | When the Client says busy or "baad mein", the lead is queued for follow-up | page followups; rule 7 |
| R9 | Up to three follow-up messages go to a queued Client on a fixed schedule, then the follow-up stops | page followups; rule 8 |
| R10 | The AI agent answers a Client's inbound voice call and the call, transcript and outcome are stored | page calls; rule 9 |
| R11 | The Office admin can take over a conversation from the AI agent and reply by hand | page inbox; page inbox › custom; flow MESSAGES; flow MESSAGES.reply |
| R12 | The Office admin can add a property with name, type, location, price range, BHK, area, status and tags | page inventory; page inventory › modal add_property |
| R13 | The Office admin can confirm a booking for a Client and assign the Broker by hand | page leads › modal book_visit; page visits; page visits › modal confirm_client; flow VISITS; flow VISITS.schedule_visit; flow VISITS.confirm_client |
| R14 | The Office admin sees total leads, bookings confirmed, active properties and revenue pipeline for the month | page overview; page inventory; rule 14; header |
| R15 | The Office admin sees the lead funnel from total leads to booking confirmed, and the lead sources | page overview |
| R16 | The Office admin sees each Broker's leads, closed deals, revenue and the assignment log | page visits; page brokers |
| R17 | The Office admin sees each automation's runs and failures | page ai_agents; rule 12 |
| R18 | A Broker signs in and sees only the leads, visits and conversations assigned to them | page my_visits; page my_leads; page my_followups; rule 13 |
| R19 | The Office admin sets the agent name, language, follow-up interval, maximum follow-ups and company details | page agent_settings |
| R20 | A lead moves through stages New → Engaged → Visit scheduled → Booked or Lost | page leads; rule 4 |
| R21 | The AI agent stops replying to a Client while the Office admin has taken over the conversation | page inbox; page inbox › custom; rule 10 |
| R22 | A follow-up stops as soon as the Client replies | page followups; rule 11 |
