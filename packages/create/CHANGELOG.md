# @tanstack/create

## 0.61.4

### Patch Changes

- Update the React Paraglide Vite plugin strategy to include `baseLocale` alongside `url`, preventing missing-locale routing/rendering errors in generated apps. ([`164522e`](https://github.com/TanStack/cli/commit/164522e444188e83710fc599304132de8cb379e6))

- Improve CLI compatibility and scaffold behavior for legacy router-first workflows. ([`2949819`](https://github.com/TanStack/cli/commit/2949819058b4d4b1760be683ef29bfd459ddb28b))

  - Add safer target directory handling by warning before creating into non-empty folders.
  - Support explicit git initialization control via `--git` and `--no-git`.
  - Restore router-only compatibility mode with file-based routing templates (without Start-dependent add-ons/deployments/starters), while still allowing toolchains.
  - Default `create-tsrouter-app` to router-only compatibility mode.
  - Remove stale `count.txt` ignore entries from base templates.

  Also expands starter documentation with clearer creation, maintenance, UI usage, and banner guidance.

## 0.61.3

### Patch Changes

- Improve generated React scaffold reliability and default lint ergonomics. ([`cc5857c`](https://github.com/TanStack/cli/commit/cc5857c5c212132852f37878e039071c5a9b1ac5))

  - Migrate React template imports to package `imports` aliases (`#/*`) while preserving `@/*` compatibility during transition.
  - Harden eslint toolchain templates for fresh apps by avoiding known parser/project and resolver issues.
  - Fix generated shadcn utility import style for stricter eslint configs.
  - Improve TanStack Form demo select contrast in dark mode.

## 0.61.2

### Patch Changes

- Improve generated app reliability and CLI compatibility. ([`791bef6`](https://github.com/TanStack/cli/commit/791bef6b5472df5b5e2bffe5c1714c4052a97ac3))

  - Fix React Query provider scaffolding (including Query + tRPC combinations) so generated apps build correctly.
  - Fix Prisma add-on package template rendering by exposing package-manager execute helper in `package.json.ejs` context.
  - Restore `--tailwind` and `--no-tailwind` as deprecated compatibility flags that are accepted but ignored with clear warnings.
  - Align CLI/docs examples with the current Tailwind-always-on behavior.
  - Update Convex demo import to type-only `Id` import to avoid runtime resolution issues.

## 0.61.1

### Patch Changes

- add missing .js extensions to ESM imports ([#369](https://github.com/TanStack/cli/pull/369))

## 0.61.0

### Minor Changes

- Add PostHog add-on ([#317](https://github.com/TanStack/cli/pull/317))

## 0.60.1

### Patch Changes

- Pin the React Sentry add-on to `@sentry/tanstackstart-react@10.34.0` to avoid a Nitro production build failure introduced in newer Sentry versions. ([`ab740ed`](https://github.com/TanStack/cli/commit/ab740ed2c5510a3266065aa98c8afe3093ea0034))

## 0.60.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: case-insensitive add-on lookup with typo suggestions

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- fix(create): ignore transient vitest unconfig files in templates

  Fixes #345

- fix(create): bump Tailwind deps for Vite 7 compatibility

  Fixes #332

- ci: Version Packages (#346)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#339)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#349)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#341)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

- ci: Version Packages (#338)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(create): allow better-sqlite3 builds in pnpm templates

  Set pnpm.onlyBuiltDependencies for React Drizzle and Prisma SQLite templates so better-sqlite3 native bindings build correctly in generated apps.

  Fixes #321

- fix(create): normalize add-to-app output paths on Windows

  Normalize generated and deleted output file paths to project-relative keys before compare/write/delete, preventing duplicated path segments when Windows drive letters are missing.

  Fixes #329

- chore: remove unused Provider function from tanstack-query template (#272)

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#347)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#336)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(create): normalize generated src js/jsx extensions for TypeScript

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- ci: Version Packages (#337)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.59.4

### Patch Changes

- Allow `better-sqlite3` build scripts in generated pnpm projects when using the React Drizzle or Prisma SQLite add-ons, preventing runtime native binding errors. ([`dbd3086`](https://github.com/TanStack/cli/commit/dbd308621464d14bbc03158b2972fd061ea6ccb1))

- Fix `tanstack add` on Windows when generated output paths lose the drive letter, preventing duplicated project paths from being written. ([`4f7c925`](https://github.com/TanStack/cli/commit/4f7c9255f365b1993ec91ac447dfcbfe6dd4903d))

## 0.59.3

### Patch Changes

- Update generated React and Solid app template dependencies to use `@tailwindcss/vite` and `tailwindcss` `^4.1.18`, fixing incompatibility with Vite 7. ([`a93d7e5`](https://github.com/TanStack/cli/commit/a93d7e5d43bc1db37f2251bf88de7681c9a7387d))

## 0.59.2

### Patch Changes

- Ignore transient `__unconfig*` files in generated React and Solid app `.gitignore` templates to prevent VS Code Vitest Explorer startup errors caused by temporary config files. ([`2f3c4d7`](https://github.com/TanStack/cli/commit/2f3c4d79b1ecdf8b8404d23e7b25bfbbbf77f48f))

## 0.59.1

### Patch Changes

- Normalize add-on source filenames under `src/` to TypeScript extensions when TypeScript is enabled, converting `.js` to `.ts` and `.jsx` to `.tsx`. ([`0f2744e`](https://github.com/TanStack/cli/commit/0f2744ea4675dbc61ff14ebbe57f77438606b26b))

## 0.59.0

### Minor Changes

- feat: case-insensitive add-on lookup with typo suggestions

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- ci: Version Packages (#338)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#337)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#336)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.58.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: case-insensitive add-on lookup with typo suggestions

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#336)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#337)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

## 0.57.0

### Minor Changes

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

- feat: case-insensitive add-on lookup with typo suggestions

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

### Patch Changes

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#336)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.56.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: case-insensitive add-on lookup with typo suggestions

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.55.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: case-insensitive add-on lookup with typo suggestions

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.54.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

- feat: case-insensitive add-on lookup with typo suggestions

- feat: force TanStack Start with Tailwind CSS always enabled

  - Remove code-router mode and --router-only flag (TanStack Start only)
  - Remove start add-on (baked into base templates)
  - Remove module-federation add-on
  - Force Tailwind CSS to always be enabled
  - Remove --tailwind/--no-tailwind CLI flags
  - Remove selectTailwind and selectTypescript prompts
  - Remove forcedMode parameter (mode always file-router)
  - Simplify template conditionals and hardcode typescript/tailwind values
  - Update README.md.ejs with instructions for removing Tailwind
  - Clean up dead code and unused functions
  - Update all CLI wrappers to show deprecation warnings

### Patch Changes

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- fix(neon): use named import for postgresPlugin (#320)

  The @neondatabase/vite-plugin-postgres package exports postgresPlugin as a
  named export, not a default export. This fixes the SyntaxError when running
  pnpm dev on projects created with the Neon add-on.

  Fixes #318

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports (#324)

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- chore: remove unused Provider function from tanstack-query template (#272)

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows (#319)

## 0.53.2

### Patch Changes

- Add case-insensitive add-on ID matching and "did you mean?" suggestions for typos ([`61011ec`](https://github.com/TanStack/cli/commit/61011ec171283cd6de020e2cb6ac9f943a3aa47b))

- fix: normalize path separators in toCleanPath to fix missing tsconfig.json on Windows ([`2cf6703`](https://github.com/TanStack/cli/commit/2cf6703a082d0441f96f599eab21559b05742f92))

- chore: remove unused Provider function from tanstack-query root-provider template ([`46a4903`](https://github.com/TanStack/cli/commit/46a49033547f7e6c9905f4e94cca07ce0988f63a))

## 0.53.1

### Patch Changes

- fix: resolve Windows path handling in relativePath causing incorrect Clerk imports ([`72049cb`](https://github.com/TanStack/cli/commit/72049cb134f9ecd169da161154899cc84a5c39b8))

## 0.53.0

### Minor Changes

- force tailwind, force typescript ([`337eeba`](https://github.com/TanStack/cli/commit/337eebaafa190de96194910b6c8c9e550ca142fc))

## 0.52.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

### Patch Changes

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.51.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

### Patch Changes

- fix: Update Paraglide JS url (#307)

  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

## 0.50.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

## 0.49.3

### Patch Changes

- fix: do not exclude .ts files in asset transfer ([`30edd20`](https://github.com/TanStack/cli/commit/30edd208fd81b5c501fa42cd476232273ff108d1))

## 0.49.2

### Patch Changes

- Fixed windows \\ delimiter stripping ([`7940300`](https://github.com/TanStack/cli/commit/79403004689817339ec6f6e03c20fb25e841ddb0))
