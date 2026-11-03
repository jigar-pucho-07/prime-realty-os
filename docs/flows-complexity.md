# Workflow complexity

Budget per action path: ≤ 14 steps · ≤ 1 AI call (2 with a code check between) · no nested router · no CODE node > 40 lines · no two CODE nodes in a row. Per flow: ≤ 12 actions.

## PR - MESSAGES — 2 action(s), longest path 8 steps, within budget

| action path | steps | AI calls | router depth | longest CODE |
|---|---:|---:|---:|---:|
| reply | 8 | 0 | 1 | — |
| unknown action | 4 | 0 | 1 | — |

## PR - VISITS — 3 action(s), longest path 10 steps, within budget

| action path | steps | AI calls | router depth | longest CODE |
|---|---:|---:|---:|---:|
| schedule_visit | 10 | 0 | 1 | — |
| confirm_client | 8 | 0 | 1 | — |
| unknown action | 4 | 0 | 1 | — |

