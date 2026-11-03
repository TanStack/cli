---
'@tanstack/create': patch
---

Add command-specific build approvals for Storybook's esbuild installation on pnpm 10.2 and newer. Older and unknown target versions retain the compatible plain dlx command. Add-on and starter command definitions can declare requested build approvals, with version-aware planning shared by create and add-to-existing-app flows.
