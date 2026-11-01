# TanStack CLI — Skill Spec

TanStack CLI is a framework-agnostic command-line tool for creating TanStack application scaffolds, layering add-ons into existing projects, and retrieving machine-readable ecosystem/docs context. It is backed by `@tanstack/create` for generation logic and exposes both developer-facing and agent-facing discovery workflows. This spec targets `@tanstack/cli` v0.61.0.

## Domains

| Domain | Description | Skills |
|--------|-------------|--------|
| Scaffold new applications | Choose mode/framework/template/toolchain/deployment/add-ons and generate an initial app. | create-app-scaffold |
| Evolve existing applications | Apply add-ons to existing repositories with dependency/metadata reconciliation. | add-addons-existing-app |
| Fetch support context for agents | Retrieve structured docs/library/add-on metadata from CLI discovery commands. | query-docs-library-metadata |
| Select ecosystem integrations | Turn ecosystem data into concrete, compatible integration choices. | choose-ecosystem-integrations |
| Author and iterate custom extensions | Build and live-watch custom add-ons/templates during maintainer workflows. | maintain-custom-addons-dev-watch |

## Skill Inventory

| Skill | Type | Domain | What it covers | Failure modes |
|-------|------|--------|----------------|---------------|
| create-app-scaffold | core | scaffold-new-applications | `tanstack create`, mode/framework/template/toolchain/deployment/add-on flag interactions | 3 |
| add-addons-existing-app | core | evolve-existing-applications | `tanstack add`, add-on resolution/dependencies, `.cta.json` preconditions | 4 |
| query-docs-library-metadata | core | fetch-support-context | `libraries`, `doc`, `search-docs`, `--list-add-ons`, `--addon-details` JSON workflows | 3 |
| choose-ecosystem-integrations | composition | select-ecosystem-integrations | `ecosystem` + add-on metadata mapping, exclusivity, optionized providers | 4 |
| maintain-custom-addons-dev-watch | lifecycle | author-custom-extensions | `add-on init/compile/dev` and `tanstack dev --dev-watch` sync loop | 4 |

## Failure Mode Inventory

### Create app scaffold (3 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
|---|---------|----------|--------|--------------|
| 1 | Pass `--add-ons` without explicit ids | HIGH | issue #234 | — |
| 2 | Assume `--no-tailwind` is still supported | HIGH | `packages/cli/src/command-line.ts` | — |
| 3 | Combine router-only with template/deployment/add-ons | CRITICAL | `packages/cli/src/command-line.ts` | choose-ecosystem-integrations |

### Add add-ons to existing app (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
|---|---------|----------|--------|--------------|
| 1 | Run `tanstack add` without `.cta.json` | CRITICAL | `packages/create/src/custom-add-ons/shared.ts` | maintain-custom-addons-dev-watch |
| 2 | Use invalid add-on id | HIGH | `packages/create/src/add-ons.ts` | — |
| 3 | Ignore add-on dependency requirements | HIGH | `packages/create/src/add-ons.ts` | — |
| 4 | Assume old Windows path bug still present | MEDIUM | issue #329 | — |

### Query docs and library metadata (3 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
|---|---------|----------|--------|--------------|
| 1 | Use removed `tanstack mcp` command | CRITICAL | `packages/cli/CHANGELOG.md` | — |
| 2 | Use invalid library id/version/path for `doc` | HIGH | `packages/cli/src/cli.ts` | — |
| 3 | Rely on deprecated alias for discovery commands | MEDIUM | issue #93 | — |

### Choose ecosystem integrations (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
|---|---------|----------|--------|--------------|
| 1 | Treat ecosystem partner id as add-on id | HIGH | `ecosystem --json` + `--list-add-ons --json` | — |
| 2 | Skip `--addon-details` for optionized providers | HIGH | `--addon-details prisma --json` | — |
| 3 | Select multiple exclusive integrations together | HIGH | `packages/create/src/frameworks/*/*/info.json` | — |
| 4 | Assume router-only supports deployment integration | CRITICAL | `packages/cli/src/command-line.ts` | create-app-scaffold |

### Maintain custom add-ons in dev watch (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
|---|---------|----------|--------|--------------|
| 1 | Use `--dev-watch` with `--no-install` | HIGH | `packages/cli/src/dev-watch.ts` | — |
| 2 | Start dev-watch without valid package entry | HIGH | `packages/cli/src/dev-watch.ts` | — |
| 3 | Author add-on from code-router project | CRITICAL | `packages/create/src/custom-add-ons/add-on.ts` | — |
| 4 | Run add-on workflows without scaffold metadata | HIGH | `packages/create/src/custom-add-ons/shared.ts` | add-addons-existing-app |

## Tensions

| Tension | Skills | Agent implication |
|---------|--------|-------------------|
| Compatibility mode vs explicit intent | create-app-scaffold ↔ choose-ecosystem-integrations | Agents optimize for successful command execution and miss silently dropped user intent. |
| Backwards support vs deterministic automation | add-addons-existing-app ↔ maintain-custom-addons-dev-watch | Agents assume universal workflows and fail on hidden metadata preconditions. |
| Single-command convenience vs integration precision | create-app-scaffold ↔ query-docs-library-metadata ↔ choose-ecosystem-integrations | Agents skip preflight metadata discovery and choose plausible but wrong defaults. |

## Subsystems & Reference Candidates

| Skill | Subsystems | Reference candidates |
|-------|------------|---------------------|
| create-app-scaffold | framework adapters, deployment providers, toolchains | create flag compatibility matrix |
| add-addons-existing-app | — | — |
| query-docs-library-metadata | — | discovery command output schemas |
| choose-ecosystem-integrations | authentication providers, data layer providers, deployment targets | — |
| maintain-custom-addons-dev-watch | — | — |

## Recommended Skill File Structure

- **Core skills:** `create-app-scaffold`, `add-addons-existing-app`, `query-docs-library-metadata`
- **Framework skills:** none required (framework selection is embedded in scaffold flow)
- **Lifecycle skills:** `maintain-custom-addons-dev-watch`
- **Composition skills:** `choose-ecosystem-integrations`
- **Reference files:** `create-app-scaffold` (flag matrix), `query-docs-library-metadata` (JSON output schemas)

## Composition Opportunities

| Library | Integration points | Composition skill needed? |
|---------|-------------------|--------------------------|
| Clerk | auth add-on selection and exclusive auth category | yes — choose-ecosystem-integrations |
| Better Auth | auth add-on selection and framework/mode compatibility | yes — choose-ecosystem-integrations |
| WorkOS | auth add-on selection and enterprise auth workflows | yes — choose-ecosystem-integrations |
| Prisma | ORM add-on with provider options (`postgres/sqlite/mysql`) | yes — choose-ecosystem-integrations |
| Drizzle | ORM add-on with provider options (`postgresql/sqlite/mysql`) | yes — choose-ecosystem-integrations |
| Convex | database add-on with exclusivity interactions | yes — choose-ecosystem-integrations |
| Cloudflare | deployment add-on selection in exclusive deploy category | yes — choose-ecosystem-integrations |
| Netlify | deployment add-on selection in exclusive deploy category | yes — choose-ecosystem-integrations |
| Railway | deployment add-on selection in exclusive deploy category | yes — choose-ecosystem-integrations |
