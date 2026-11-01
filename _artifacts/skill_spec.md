# @tanstack/cli — Skill Spec

`@tanstack/cli` is a project scaffolding and management tool for TanStack Start/Router applications. It generates new projects from a base framework template combined with user-selected add-ons (auth, database, deployment, monitoring, etc.), manages integration layering into existing projects, and supports custom add-on and template authoring workflows. A first-class `--json` output mode makes all discovery commands agent-friendly.

## Domains

| Domain | Description | Skills |
| ------ | ----------- | ------- |
| Scaffolding apps | Creating new TanStack Start/Router projects with correct flags, framework, toolchain, and deployment | create-app-scaffold |
| Managing integrations | Selecting, validating, and applying add-ons at creation time or into existing projects | choose-ecosystem-integrations, add-addons-existing-app |
| Discovering metadata | Querying machine-readable CLI output to resolve ids, docs, and partner mappings | query-docs-library-metadata |
| Authoring add-ons | Building, iterating, and publishing custom add-ons and templates | maintain-custom-addons-dev-watch |

## Skill Inventory

| Skill | Type | Domain | What it covers | Failure modes |
| ----- | ---- | ------ | -------------- | ------------- |
| create-app-scaffold | core | scaffolding | tanstack create flags, --router-only, --template, toolchain/deployment selection, non-interactive mode | 4 |
| choose-ecosystem-integrations | composition | integrations | ecosystem/list-add-ons discovery, exclusive categories, --addon-details, --add-on-config | 4 |
| add-addons-existing-app | core | integrations | tanstack add, .cta.json precondition, id resolution, dependsOn chains | 3 |
| query-docs-library-metadata | core | discovery | tanstack libraries/doc/search-docs/list-add-ons/addon-details --json, output schema parsing | 4 |
| maintain-custom-addons-dev-watch | lifecycle | addon-authoring | add-on init/compile/dev, tanstack create --dev-watch, validateAddOnSetup, path validation | 5 |

## Failure Mode Inventory

### create-app-scaffold (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| - | ------- | -------- | ------ | ------------ |
| 1 | Pass --add-ons without explicit ids | HIGH | github.com/TanStack/cli/issues/234 | — |
| 2 | Use deprecated --no-tailwind expecting opt-out to work | HIGH | command-line.ts:369 | — |
| 3 | Combine --router-only with add-ons, deployment, or template | CRITICAL | command-line.ts:343 | choose-ecosystem-integrations |
| 4 | Use JavaScript/JSX template value | HIGH | command-line.ts:381 | — |

### choose-ecosystem-integrations (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| - | ------- | -------- | ------ | ------------ |
| 1 | Use ecosystem partner id directly as add-on id | HIGH | cli.ts output comparison | add-addons-existing-app |
| 2 | Skip --addon-details before choosing a configurable provider | HIGH | prisma/info.json | — |
| 3 | Select multiple add-ons from the same exclusive category | HIGH | types.ts AddOnBaseSchema | — |
| 4 | Assume --router-only supports deployment integration | CRITICAL | command-line.ts:349 | create-app-scaffold |

### add-addons-existing-app (3 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| - | ------- | -------- | ------ | ------------ |
| 1 | Run tanstack add outside a TanStack CLI-scaffolded project | CRITICAL | custom-add-ons/shared.ts | maintain-custom-addons-dev-watch |
| 2 | Use a misspelled or invalid add-on id | HIGH | add-ons.ts:44 | — |
| 3 | Add an add-on without its required dependencies | HIGH | add-ons.ts:48 | — |

### query-docs-library-metadata (4 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| - | ------- | -------- | ------ | ------------ |
| 1 | Use --library / --version flags on tanstack doc | HIGH | cli.ts:727 | — |
| 2 | Include /docs/ prefix in doc path argument | MEDIUM | cli.ts:765 | — |
| 3 | Use deprecated create-tsrouter-app alias for discovery | MEDIUM | github.com/TanStack/cli/issues/93 | — |
| 4 | Treat --list-add-ons --json output as wrapped object | HIGH | cli.ts:268 | — |

### maintain-custom-addons-dev-watch (5 failure modes)

| # | Mistake | Priority | Source | Cross-skill? |
| - | ------- | -------- | ------ | ------------ |
| 1 | Run add-on init from a code-router project | CRITICAL | custom-add-ons/add-on.ts:106 | — |
| 2 | Use --dev-watch on the `dev` subcommand instead of `create` | HIGH | cli.ts:511 | — |
| 3 | Pass --no-install to dev-watch create | HIGH | dev-watch.ts | — |
| 4 | Point --dev-watch at a path without framework structure | HIGH | command-line.ts:599 | — |
| 5 | Run add-on workflows without .cta.json in working directory | HIGH | custom-add-ons/shared.ts | add-addons-existing-app |

## Tensions

| Tension | Skills | Agent implication |
| ------- | ------ | ----------------- |
| Compatibility mode vs explicit intent | create-app-scaffold ↔ choose-ecosystem-integrations | Agent optimizing for a working command uses --router-only and silently drops all integration intent |
| Single-command convenience vs integration precision | create-app-scaffold ↔ query-docs-library-metadata ↔ choose-ecosystem-integrations | Agent skipping discovery runs tanstack create with plausible-but-wrong ids, wrong defaults, or mutually exclusive add-ons |
| Automation portability vs scaffold metadata dependency | add-addons-existing-app ↔ maintain-custom-addons-dev-watch | Agent treating tanstack add as a general-purpose command applies it to arbitrary projects and fails on missing .cta.json |

## Cross-References

| From | To | Reason |
| ---- | -- | ------ |
| create-app-scaffold | choose-ecosystem-integrations | Scaffold flag construction needs valid add-on ids from discovery first |
| create-app-scaffold | query-docs-library-metadata | Single-command scaffolds that skip docs pick wrong defaults |
| choose-ecosystem-integrations | query-docs-library-metadata | Partner mapping and option inspection both use --json discovery commands |
| add-addons-existing-app | choose-ecosystem-integrations | Choosing which add-ons to apply requires understanding exclusive categories and dependency chains |
| maintain-custom-addons-dev-watch | add-addons-existing-app | Custom add-on authoring assumes familiarity with add-on application patterns |

## Subsystems & Reference Candidates

| Skill | Subsystems | Reference candidates |
| ----- | ---------- | -------------------- |
| create-app-scaffold | — | create-flag-compatibility-matrix, framework-adapters, deployment-providers, toolchains |
| choose-ecosystem-integrations | — | authentication-providers, data-layer-providers, deployment-targets |
| add-addons-existing-app | — | — |
| query-docs-library-metadata | — | discovery-command-output-schemas |
| maintain-custom-addons-dev-watch | — | — |

## Remaining Gaps

| Skill | Question | Status |
| ----- | -------- | ------ |
| create-app-scaffold | What is the full list of built-in template ids? Is the registry URL (CTA_REGISTRY) documented anywhere for public use? | open |
| maintain-custom-addons-dev-watch | Is `tanstack template init/compile` a distinct workflow from add-on init/compile, and what are the key differences? | open |

## Recommended Skill File Structure

- **Core skills:** create-app-scaffold, add-addons-existing-app, query-docs-library-metadata (framework-agnostic, apply to React and Solid alike)
- **Framework skills:** none currently — add-on sets differ by framework but the CLI surface is identical
- **Lifecycle skills:** maintain-custom-addons-dev-watch (the add-on authoring journey)
- **Composition skills:** choose-ecosystem-integrations (bridges discovery and scaffold)
- **Reference files:** create-app-scaffold/references/ (compatibility matrix, adapters, providers, toolchains), query-docs-library-metadata/references/ (output schemas)

## Composition Opportunities

| Library | Integration points | Composition skill needed? |
| ------- | ------------------ | ------------------------- |
| TanStack Router | Primary routing layer in every scaffolded app | No — covered by doc discovery skill |
| TanStack Start | Default full-stack target; add-ons depend on it | No — covered by scaffold skill |
| Drizzle / Prisma | ORM add-ons with per-provider configuration surfaces | No — covered by choose-ecosystem-integrations |
| Clerk / WorkOS / Better Auth | Exclusive auth add-ons with env var requirements | No — covered by choose-ecosystem-integrations |
| shadcn/ui | Styling add-on installed via shadcn CLI post-scaffold | No — reference in framework-adapters suffices |
