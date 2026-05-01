---
'@tanstack/cli': minor
'@tanstack/create': minor
---

feat(cli): auto-install TanStack Intent during scaffolding

`tanstack create` and `tanstack add` now run `npx @tanstack/intent install`
after dependency installation, wiring up skill mappings for coding agents.
The behavior is controlled by a new `--intent` / `--no-intent` flag (default
on) and persists to `.cta.json` so subsequent `add` invocations honor the
original choice. Failures are surfaced as warnings instead of aborting the
scaffold.
