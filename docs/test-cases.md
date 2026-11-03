# Test cases · Prime Realty OS
| # | area | step | expected |
|---|---|---|---|
| T1 | MESSAGES.reply | call with the sample payload | result keys sent; row in messages, audit_log |
| T2 | VISITS.schedule_visit | call with the sample payload | result keys Booking_ID; row in bookings, leads, audit_log |
| T3 | VISITS.confirm_client | call with the sample payload | result keys sent; row in bookings, leads, audit_log |
| U1 | login | each persona signs in | sees only its pages; sign-out works |
| U2 | every page | demo data | KPIs, charts, table, search, export, each modal succeeds with a toast |
| U3 | detail routes | open from an id link | fields, related tables, custom sections |
| U4 | role guard | sales opens /masters | redirected |
| U5 | wired | every WEBHOOK_<FLOW> set, header shows no simulated chip | a create action runs the flow and the row appears within 30 s |
| U6 | sign-in | wrong password / unknown email | the same message; a deactivated person cannot sign in and their open session ends |
