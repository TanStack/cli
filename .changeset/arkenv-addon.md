---
'@tanstack/create': minor
---

Add an ArkEnv add-on for environment variable validation in React Start apps.

`tanstack add arkenv` (or `--add-ons arkenv` on `tanstack create`)
writes `src/env.ts`, registers `@arkenv/vite-plugin`, and can add a
`/demo/arkenv` route. ArkType, Zod, and Valibot are selectable. ArkEnv
and T3Env are mutually exclusive because both write `src/env.ts`.
