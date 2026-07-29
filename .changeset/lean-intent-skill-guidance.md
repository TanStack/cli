---
'@tanstack/create': patch
---

Wire TanStack Intent up in on-demand discovery mode instead of writing the full
skill-to-task mapping table into `AGENTS.md`. Generated projects previously got
an `install --map` block listing every skill for every installed package — 99
lines in a default app, growing with each add-on — which every agent re-read on
every invocation. Plain `install` emits a 10-line pointer telling the agent to
run `intent list` and `intent load <package>#<skill>` when a task actually calls
for one. The "next steps" output now shows those two commands, rendered for the
project's package manager.
