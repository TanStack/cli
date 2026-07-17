---
'@tanstack/cli': minor
'@tanstack/create': minor
---

Add a `--blank` project preset that creates a production-ready one-route app
without starter UI, Tailwind, devtools, test tooling, Intent setup, or unused
public assets. Pass `--intent` to opt local coding-agent skill mappings back in.
Also move integration-specific dependencies to their owning add-ons and stop
shipping an unused test stack in standard Start projects. Explicit styling and
deployment add-ons remain composable with the blank preset, including when
added later.
