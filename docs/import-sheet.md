# Import sheet (step 6 gate)
| flow | trigger | actions | webhook URL (paste) | test run ✔ |
|---|---|---|---|---|
| MESSAGES | webhook.catch_webhook | reply | | |
| VISITS | webhook.catch_webhook | schedule_visit, confirm_client | | |

After import: confirm the model id in each askLlm node; select connections; run one action from the test panel. A flow the app calls reads `app_url`, `inbound_token` and `company_name` from each call (nothing to set); every other flow has them written in (`build_flows.py --app-url --company-name`; the inbound token only in deploy/ through `build_deploy.py --inbound-token <token>` — never in workflows/, which is committed) — after a change in Settings rebuild and re-import those.

## Where the URLs go (step 7)
Never into the bundle. One environment variable per flow, on the server (`app/.env` locally, the portal's environment fields in production):

| flow | variable |
|---|---|
| MESSAGES | `WEBHOOK_MESSAGES` |
| VISITS | `WEBHOOK_VISITS` |
| codes by email | `WEBHOOK_AUTH_OTP` |
| flows → this app | `INBOUND_TOKEN` (shared secret; unset = closed) |
