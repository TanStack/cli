---
name: create-app-scaffold
description: >
  Scaffold a TanStack app with tanstack create using --framework, --template,
  --toolchain, --deployment, --add-ons, --blank, and --router-only. Covers flag
  compatibility, non-interactive defaults, and intent-preserving command
  construction.
type: core
library: tanstack-cli
library_version: "0.70.0"
---

# Create App Scaffold

Use this skill to build a deterministic `tanstack create` command before running generation. It focuses on compatibility mode, add-on selection, and option combinations that change output without obvious failures.

## Setup

```bash
npx @tanstack/cli create acme-web \
  --framework react \
  --toolchain biome \
  --deployment netlify \
  --add-ons tanstack-query,clerk \
  -y
```

## Core Patterns

### Build a deterministic non-interactive scaffold

```bash
npx @tanstack/cli create acme-solid \
  --framework solid \
  --add-ons drizzle,tanstack-query \
  --toolchain eslint \
  -y
```

### Start from a minimal production-ready scaffold

Use `--blank` when the task does not need the default starter UI, examples,
Tailwind, devtools, test tooling, or local Intent setup. Explicit integrations
remain composable; add `--intent` when the generated project should contain
skill mappings for later coding-agent work.

```bash
npx @tanstack/cli create acme-web \
  --blank \
  --deployment cloudflare \
  -y
```

### Use router-only mode for compatibility scaffolds only

```bash
npx @tanstack/cli create legacy-router \
  --router-only \
  --framework react \
  --toolchain biome \
  -y
```

### Use template input only outside router-only mode

```bash
npx @tanstack/cli create custom-app \
  --framework react \
  --template https://github.com/acme/tanstack-template \
  --add-ons tanstack-query \
  -y
```

## Common Mistakes

### HIGH Pass --add-ons without explicit ids

Wrong:
```bash
npx @tanstack/cli create my-app --add-ons -y
```

Correct:
```bash
npx @tanstack/cli create my-app --add-ons clerk,drizzle -y
```

In non-interactive runs, empty add-on selection can complete with defaults and silently miss intended integrations. Fixed in newer versions, but agents trained on older examples may still generate this pattern.

Source: https://github.com/TanStack/cli/issues/234

### HIGH Use --no-tailwind when a minimal scaffold is required

Wrong:
```bash
npx @tanstack/cli create my-app --no-tailwind -y
```

Correct:
```bash
npx @tanstack/cli create my-app --blank -y
```

`--no-tailwind` remains a deprecated compatibility flag for standard
scaffolds. `--blank` is the supported preset for a minimal project without
Tailwind.

Source: packages/cli/src/command-line.ts:386

### HIGH Combine --blank with a template, examples, or --tailwind

Wrong:
```bash
npx @tanstack/cli create my-app --blank --template ecommerce -y
```

Correct:
```bash
npx @tanstack/cli create my-app --blank --add-ons drizzle -y
```

Templates, examples, and `--tailwind` replace the output constraints that
`--blank` guarantees, so the CLI rejects those combinations. Deployment,
toolchain, and add-on selections remain supported; a selected styling add-on
can opt the generated app back into Tailwind when it requires it.

### CRITICAL Combine router-only with template/deployment/add-ons

Wrong:
```bash
npx @tanstack/cli create my-app \
  --router-only \
  --template some-template \
  --deployment cloudflare \
  --add-ons clerk \
  -y
```

Correct:
```bash
npx @tanstack/cli create my-app --router-only --framework react -y
```

Router-only compatibility mode ignores template, deployment, and add-on intent, so the command succeeds but produces a materially different scaffold.

Source: packages/cli/src/command-line.ts:343

### HIGH Tension: Compatibility mode vs explicit intent

This domain's patterns conflict with choose-ecosystem-integrations. Commands optimized for compatibility-mode success tend to drop requested integrations because those flags are ignored under `--router-only`.

See also: choose-ecosystem-integrations/SKILL.md § Common Mistakes

### HIGH Tension: Single-command convenience vs integration precision

This domain's patterns conflict with query-docs-library-metadata. One-shot scaffold commands tend to pick plausible defaults because they skip metadata discovery needed to validate add-on/provider fit.

See also: query-docs-library-metadata/SKILL.md § Common Mistakes

## References

- [Create flag compatibility matrix](references/create-flag-compatibility-matrix.md)
- [Framework adapter options](references/framework-adapters.md)
- [Deployment provider options](references/deployment-providers.md)
- [Toolchain options](references/toolchains.md)
