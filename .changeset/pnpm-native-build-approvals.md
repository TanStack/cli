---
'@tanstack/create': patch
---

Write pnpm native build approvals to pnpm-workspace.yaml for pnpm 11 while retaining package.json approvals for pnpm 9 and 10. Preserve existing workspace configuration when adding integrations.

Keep ordinary pnpm 9 dependency additions working when creating a new standalone workspace, without changing existing monorepo root checks or explicit project settings.
