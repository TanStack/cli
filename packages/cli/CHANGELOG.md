# @tanstack/cli

## 0.62.5

### Patch Changes

- Updated dependencies [[`a0b407c`](https://github.com/TanStack/cli/commit/a0b407c5bc209d3fe81b19e24e6384a72d8a1b64)]:
  - @tanstack/create@0.63.2

## 0.62.4

### Patch Changes

- Updated dependencies [[`ddfaaaa`](https://github.com/TanStack/cli/commit/ddfaaaac81cdc60965052b82da1f1482155c560c)]:
  - @tanstack/create@0.63.1

## 0.62.3

### Patch Changes

- Wire up TanStack Intent: CI workflows for skill validation and staleness checks, and update skill files to v0.62.1 ([`45c9d23`](https://github.com/TanStack/cli/commit/45c9d239d77967cc075ed8438f0ed22cc01a4555))

## 0.62.2

### Patch Changes

- Updated dependencies [[`5f47a05`](https://github.com/TanStack/cli/commit/5f47a05d5b00376710945609770a10bf17722661)]:
  - @tanstack/create@0.63.0

## 0.62.1

### Patch Changes

- Improve e2e test performance: parallelize tests via Nx caching and `nx affected`, block non-essential assets (images, fonts, media) during test runs, add per-fixture timing logs, make quality gates opt-in per fixture, and move template/router-only tests from `@blocking` to `@matrix`. ([`68489cc`](https://github.com/TanStack/cli/commit/68489cc6cb22c0c0de96b2da5e55f90bc9ba4a38))

## 0.62.0

### Minor Changes

- Add a published skill tree for TanStack CLI workflows and include `skills` in package files so agent guidance ships in npm installs. ([`0cec826`](https://github.com/TanStack/cli/commit/0cec826040a7d2c79d65f47f76effa49a32163db))

## 0.61.1

### Patch Changes

- Auto-generated changeset from semantic commits on main.

  - fix(ci): use direct changeset publish args (b6f5ff5)

- Updated dependencies []:
  - @tanstack/create@0.62.3

## 0.61.0

### Minor Changes

- Remove the built-in MCP server from the CLI by dropping `tanstack mcp` and all MCP transport/tooling code. ([`78e3734`](https://github.com/TanStack/cli/commit/78e373444c5bcaf2ab59d2142e8b8b0cab415bbb))

  Add CLI-native agent introspection commands (`libraries`, `doc`, `search-docs`, `ecosystem`) and JSON output for `create --list-add-ons` / `create --addon-details` so AI agents can rely on CLI commands directly.

### Patch Changes

- Make the default base starter minimal (Home + About) for React and Solid, and add a new `blog` template option for both frameworks. ([`f33f8d4`](https://github.com/TanStack/cli/commit/f33f8d4954d9ad6771871257a4e1e58feee9b34d))

  Interactive `create` now prompts for a template when one is not provided, and template id resolution prefers the selected framework when ids overlap.

- Updated dependencies [[`f33f8d4`](https://github.com/TanStack/cli/commit/f33f8d4954d9ad6771871257a4e1e58feee9b34d), [`16fcd67`](https://github.com/TanStack/cli/commit/16fcd674c0f74c1c62cf97b0042060d5a51981ef)]:
  - @tanstack/create@0.62.2

## 0.60.1

### Patch Changes

- Updated dependencies [[`b54e202`](https://github.com/TanStack/cli/commit/b54e202ce56f2aa78a416634155bc22f0cb5cc46)]:
  - @tanstack/create@0.62.1

## 0.60.0

### Minor Changes

- This release pulls together a large batch of improvements across the CLI and scaffolding engine since the last versioning pass. ([`154b25e`](https://github.com/TanStack/cli/commit/154b25eec9a13b9718c44cbed6cb3c8566f2fb11))

  - Modernizes and refreshes the generated React/Solid template experience, including updated starter content and stronger defaults.
  - Improves create flows with better option normalization, stronger guardrails around target directories, and clearer compatibility behavior in router-only mode.
  - Expands scaffolding ergonomics with examples toggles, improved add-on/config handling, and reliability fixes across package-manager and cross-platform paths.
  - Strengthens test and release confidence via e2e/release workflow hardening and broader smoke coverage.
  - Streamlines product surface area by removing the local `create-ui` package and `--ui` command paths from the CLI; visual setup now lives at `https://tanstack.com/builder`.
  - Cleans up docs and custom CLI examples to match the current terminal-first workflow and Builder guidance.

### Patch Changes

- Updated dependencies [[`154b25e`](https://github.com/TanStack/cli/commit/154b25eec9a13b9718c44cbed6cb3c8566f2fb11)]:
  - @tanstack/create@0.62.0

## 0.59.8

### Patch Changes

- Updated dependencies [[`536ed4d`](https://github.com/TanStack/cli/commit/536ed4d86d1bec91637ed994a0c8a153543f60f6)]:
  - @tanstack/create@0.61.6
  - @tanstack/create-ui@0.59.8

## 0.59.7

### Patch Changes

- Add a continuous development workflow for custom add-on authors. ([`b3cc585`](https://github.com/TanStack/cli/commit/b3cc5851d2b81613e3b024eb7981c440ee5183af))

  - Add `tanstack add-on dev` to watch project files and continuously refresh `.add-on` outputs.
  - Rebuild `.add-on` assets and `add-on.json` automatically when source files change.
  - Document the new add-on development loop in the custom add-on guide.

- Improve scaffold customization and custom add-on authoring flow. ([`5fbf262`](https://github.com/TanStack/cli/commit/5fbf262fe3a0d070e6a78fa2f2a920b176b84480))

  - Add `--examples` / `--no-examples` support to include or omit demo/example pages during app creation.
  - Prompt for add-on-declared environment variables during interactive create and seed entered values into generated `.env.local`.
  - Ensure custom add-on/starter metadata consistently includes a `version`, with safe backfill for older metadata files.
  - Align bundled starter/example metadata and docs with current Start/file-router behavior.

- Updated dependencies [[`b3cc585`](https://github.com/TanStack/cli/commit/b3cc5851d2b81613e3b024eb7981c440ee5183af), [`5fbf262`](https://github.com/TanStack/cli/commit/5fbf262fe3a0d070e6a78fa2f2a920b176b84480)]:
  - @tanstack/create@0.61.5
  - @tanstack/create-ui@0.59.7

## 0.59.6

### Patch Changes

- Improve CLI compatibility and scaffold behavior for legacy router-first workflows. ([`2949819`](https://github.com/TanStack/cli/commit/2949819058b4d4b1760be683ef29bfd459ddb28b))

  - Add safer target directory handling by warning before creating into non-empty folders.
  - Support explicit git initialization control via `--git` and `--no-git`.
  - Restore router-only compatibility mode with file-based routing templates (without Start-dependent add-ons/deployments/starters), while still allowing toolchains.
  - Default `create-tsrouter-app` to router-only compatibility mode.
  - Remove stale `count.txt` ignore entries from base templates.

  Also expands starter documentation with clearer creation, maintenance, UI usage, and banner guidance.

- Updated dependencies [[`164522e`](https://github.com/TanStack/cli/commit/164522e444188e83710fc599304132de8cb379e6), [`2949819`](https://github.com/TanStack/cli/commit/2949819058b4d4b1760be683ef29bfd459ddb28b)]:
  - @tanstack/create@0.61.4
  - @tanstack/create-ui@0.59.6

## 0.59.5

### Patch Changes

- Updated dependencies [[`cc5857c`](https://github.com/TanStack/cli/commit/cc5857c5c212132852f37878e039071c5a9b1ac5)]:
  - @tanstack/create@0.61.3
  - @tanstack/create-ui@0.59.5

## 0.59.4

### Patch Changes

- Improve generated app reliability and CLI compatibility. ([`791bef6`](https://github.com/TanStack/cli/commit/791bef6b5472df5b5e2bffe5c1714c4052a97ac3))

  - Fix React Query provider scaffolding (including Query + tRPC combinations) so generated apps build correctly.
  - Fix Prisma add-on package template rendering by exposing package-manager execute helper in `package.json.ejs` context.
  - Restore `--tailwind` and `--no-tailwind` as deprecated compatibility flags that are accepted but ignored with clear warnings.
  - Align CLI/docs examples with the current Tailwind-always-on behavior.
  - Update Convex demo import to type-only `Id` import to avoid runtime resolution issues.

- Updated dependencies [[`791bef6`](https://github.com/TanStack/cli/commit/791bef6b5472df5b5e2bffe5c1714c4052a97ac3)]:
  - @tanstack/create@0.61.2
  - @tanstack/create-ui@0.59.4

## 0.59.3

### Patch Changes

- Updated dependencies [[`a650d35`](https://github.com/TanStack/cli/commit/a650d3590dab0869e3ee873c029631dcbb9953e9)]:
  - @tanstack/create@0.61.1
  - @tanstack/create-ui@0.59.3

## 0.59.2

### Patch Changes

- Updated dependencies [[`76a3782`](https://github.com/TanStack/cli/commit/76a3782027c7b89b188b217baa9eaf60f5562090)]:
  - @tanstack/create@0.61.0
  - @tanstack/create-ui@0.59.2

## 0.59.1

### Patch Changes

- Prevent add-on multiselect options from rendering with pagination markers by showing the full list, which avoids a Clack navigation glitch that could duplicate the second-to-last entry while moving between the bottom options. ([`e384620`](https://github.com/TanStack/cli/commit/e384620ff642be8d4fe78726f0cbe087b9b10556))

- Updated dependencies [[`ab740ed`](https://github.com/TanStack/cli/commit/ab740ed2c5510a3266065aa98c8afe3093ea0034)]:
  - @tanstack/create@0.60.1
  - @tanstack/create-ui@0.59.1

## 0.59.0

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

- ci: Version Packages (#346)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#348)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#339)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- fix(cli): handle deprecated create-tsrouter flags

  Add explicit compatibility handling for legacy --router-only and --template flags in tanstack create, with deprecation warnings and clear errors for unsupported JavaScript templates.

  Fixes #331

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#349)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#341)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#338)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#347)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#336)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#337)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- Updated dependencies []:
  - @tanstack/create@0.60.0
  - @tanstack/create-ui@0.59.0

## 0.58.5

### Patch Changes

- Updated dependencies [[`dbd3086`](https://github.com/TanStack/cli/commit/dbd308621464d14bbc03158b2972fd061ea6ccb1), [`4f7c925`](https://github.com/TanStack/cli/commit/4f7c9255f365b1993ec91ac447dfcbfe6dd4903d)]:
  - @tanstack/create@0.59.4
  - @tanstack/create-ui@0.58.4

## 0.58.4

### Patch Changes

- Add compatibility handling for legacy `--router-only` and `--template` create flags, including clear deprecation warnings and explicit errors for unsupported JavaScript templates. ([`0c0ee31`](https://github.com/TanStack/cli/commit/0c0ee318f78896f228623aa05e2a58cfb50e6f81))

## 0.58.3

### Patch Changes

- Updated dependencies [[`a93d7e5`](https://github.com/TanStack/cli/commit/a93d7e5d43bc1db37f2251bf88de7681c9a7387d)]:
  - @tanstack/create@0.59.3
  - @tanstack/create-ui@0.58.3

## 0.58.2

### Patch Changes

- Updated dependencies [[`2f3c4d7`](https://github.com/TanStack/cli/commit/2f3c4d79b1ecdf8b8404d23e7b25bfbbbf77f48f)]:
  - @tanstack/create@0.59.2
  - @tanstack/create-ui@0.58.2

## 0.58.1

### Patch Changes

- Updated dependencies [[`0f2744e`](https://github.com/TanStack/cli/commit/0f2744ea4675dbc61ff14ebbe57f77438606b26b)]:
  - @tanstack/create@0.59.1
  - @tanstack/create-ui@0.58.1

## 0.58.0

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

- ci: Version Packages (#336)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- Updated dependencies []:
  - @tanstack/create@0.59.0
  - @tanstack/create-ui@0.58.0

## 0.57.0

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

- Updated dependencies []:
  - @tanstack/create@0.58.0
  - @tanstack/create-ui@0.57.0

## 0.56.0

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

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#336)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- Updated dependencies []:
  - @tanstack/create@0.57.0
  - @tanstack/create-ui@0.56.0

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

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#335)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- Updated dependencies []:
  - @tanstack/create@0.56.0
  - @tanstack/create-ui@0.55.0

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

- ci: Version Packages (#327)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#313)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>
  Co-authored-by: Tanner Linsley <tannerlinsley@gmail.com>

- ci: Version Packages (#326)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#334)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#325)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- Updated dependencies []:
  - @tanstack/create@0.55.0
  - @tanstack/create-ui@0.54.0

## 0.53.0

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

- Updated dependencies []:
  - @tanstack/create@0.54.0
  - @tanstack/create-ui@0.53.0

## 0.52.2

### Patch Changes

- Add case-insensitive add-on ID matching and "did you mean?" suggestions for typos ([`61011ec`](https://github.com/TanStack/cli/commit/61011ec171283cd6de020e2cb6ac9f943a3aa47b))

- Updated dependencies [[`61011ec`](https://github.com/TanStack/cli/commit/61011ec171283cd6de020e2cb6ac9f943a3aa47b), [`2cf6703`](https://github.com/TanStack/cli/commit/2cf6703a082d0441f96f599eab21559b05742f92), [`46a4903`](https://github.com/TanStack/cli/commit/46a49033547f7e6c9905f4e94cca07ce0988f63a)]:
  - @tanstack/create@0.53.2
  - @tanstack/create-ui@0.52.2

## 0.52.1

### Patch Changes

- Updated dependencies [[`72049cb`](https://github.com/TanStack/cli/commit/72049cb134f9ecd169da161154899cc84a5c39b8)]:
  - @tanstack/create@0.53.1
  - @tanstack/create-ui@0.52.1

## 0.52.0

### Minor Changes

- force tailwind, force typescript ([`337eeba`](https://github.com/TanStack/cli/commit/337eebaafa190de96194910b6c8c9e550ca142fc))

### Patch Changes

- Updated dependencies [[`337eeba`](https://github.com/TanStack/cli/commit/337eebaafa190de96194910b6c8c9e550ca142fc)]:
  - @tanstack/create-ui@0.52.0
  - @tanstack/create@0.53.0

## 0.51.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

### Patch Changes

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- ci: Version Packages (#312)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- Updated dependencies []:
  - @tanstack/create@0.52.0
  - @tanstack/create-ui@0.51.0

## 0.50.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

### Patch Changes

- ci: Version Packages (#311)

  Co-authored-by: github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>

- Updated dependencies []:
  - @tanstack/create@0.51.0
  - @tanstack/create-ui@0.50.0

## 0.49.0

### Minor Changes

- feat(mcp): add getAddOnDetails tool and expand add-on metadata

  Add new MCP tool to retrieve detailed add-on information including
  routes, package additions, files, and documentation. Also expand
  listTanStackAddOns to include type, category, link, warning, and
  exclusive fields.

### Patch Changes

- Updated dependencies []:
  - @tanstack/create@0.50.0
  - @tanstack/create-ui@0.49.0

## 0.48.7

### Patch Changes

- Updated dependencies [[`30edd20`](https://github.com/TanStack/cli/commit/30edd208fd81b5c501fa42cd476232273ff108d1)]:
  - @tanstack/create@0.49.3
  - @tanstack/create-ui@0.48.5

## 0.48.6

### Patch Changes

- Updated dependencies [[`7940300`](https://github.com/TanStack/cli/commit/79403004689817339ec6f6e03c20fb25e841ddb0)]:
  - @tanstack/create@0.49.2
  - @tanstack/create-ui@0.48.4
