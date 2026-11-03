# Workflow complexity

Budget per action path: ≤ 14 steps · ≤ 1 AI call (2 with a code check between) · no nested router · no CODE node > 40 lines · no two CODE nodes in a row. Per flow: ≤ 12 actions.

## PR - FOLLOWUP_RUN — 0 action(s), longest path 8 steps, within budget

| action path | steps | AI calls | router depth | longest CODE |
|---|---:|---:|---:|---:|
| (single path) | 8 | 0 | 0 | — |

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

## PR - VOICE_AGENT — 7 action(s), longest path 13 steps, within budget

| action path | steps | AI calls | router depth | longest CODE |
|---|---:|---:|---:|---:|
| receipt | 3 | 0 | 1 | — |
| message › skip | 8 | 0 | 1 | — |
| message › end | 9 | 0 | 1 | — |
| message › turn › new_book | 13 | 1 | 1 | — |
| message › turn › new_talk | 12 | 1 | 1 | — |
| message › turn › old_book | 13 | 1 | 1 | — |
| message › turn › old_talk | 12 | 1 | 1 | — |

## PR - WA_AGENT — 7 action(s), longest path 14 steps, within budget

| action path | steps | AI calls | router depth | longest CODE |
|---|---:|---:|---:|---:|
| receipt | 3 | 0 | 1 | — |
| message › skip | 10 | 1 | 1 | — |
| message › office | 12 | 1 | 1 | — |
| message › new_book | 14 | 1 | 1 | — |
| message › new_talk | 13 | 1 | 1 | — |
| message › old_book | 14 | 1 | 1 | — |
| message › old_talk | 13 | 1 | 1 | — |

