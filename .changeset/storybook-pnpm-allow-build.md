---
'@tanstack/create': patch
---

Pass `--allow-build=esbuild` to `pnpm dlx` when running the Storybook add-on's `storybook init` command, so pnpm 10+ no longer stalls on a hidden interactive build-approval prompt during `tanstack create`. Add-on and starter `command` definitions can now declare `allowBuilds` to request the same treatment.
