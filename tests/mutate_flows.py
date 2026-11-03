#!/usr/bin/env python3
"""tests/mutate_flows.py — prove each custom flow's contract catches a missing step (method/ai-pipeline.md § Before import, step 2).
Drops one required step from a copy of the built flow and runs validate_flow.py against the flow's contract: the mutant MUST fail.
   python tests/mutate_flows.py            → evidence/flows/mutations.txt; exit 1 if any mutant passes"""
import json, os, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.environ.get("PUCHO_OS_KIT", r"C:\pucho\kit")
MUTANTS = [("WA_AGENT", "step_send"), ("WA_AGENT", "step_messages"), ("WA_AGENT", "step_ai"), ("WA_AGENT", "step_old_book_visit"),
           ("VOICE_AGENT", "step_call"), ("VOICE_AGENT", "step_new_lead"), ("FOLLOWUP_RUN", "step_run"), ("FOLLOWUP_RUN", "step_nudge")]

def cut(node, name):
    """Remove the step called `name`, linking its successor in its place (inside branches and loops too)."""
    if not isinstance(node, dict): return
    for k in ("nextAction", "firstLoopAction"):
        c = node.get(k)
        if isinstance(c, dict) and c.get("name") == name: node[k] = c.get("nextAction")
    kids = node.get("children") or []
    for i, c in enumerate(kids):
        if isinstance(c, dict) and c.get("name") == name: kids[i] = c.get("nextAction")
    for c in kids: cut(c, name)
    for k in ("nextAction", "firstLoopAction"): cut(node.get(k), name)

lines, survived = [], 0
for flow, step in MUTANTS:
    fl = json.load(open(os.path.join(ROOT, "workflows", flow, f"{flow}.json"), encoding="utf-8"))
    cut(fl["template"]["trigger"], step)
    tmp = os.path.join(tempfile.mkdtemp(), f"{flow}.json"); json.dump(fl, open(tmp, "w", encoding="utf-8"))
    r = subprocess.run([sys.executable, os.path.join(KIT, "flow", "validate_flow.py"), tmp, "--contract",
                        os.path.join(ROOT, "workflows", flow, f"{flow}.contract.json")], capture_output=True, text=True, encoding="utf-8")
    caught = r.returncode == 1
    survived += 0 if caught else 1
    lines.append(f"{'caught ' if caught else 'MISSED '} {flow} without {step} (validate exit {r.returncode})")
out = "\n".join(lines) + f"\nmutations: {len(MUTANTS) - survived}/{len(MUTANTS)} caught\n"
os.makedirs(os.path.join(ROOT, "evidence", "flows"), exist_ok=True)
open(os.path.join(ROOT, "evidence", "flows", "mutations.txt"), "w", encoding="utf-8", newline="\n").write(out)
print(out, end=""); sys.exit(1 if survived else 0)
