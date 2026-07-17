---
name: choose-ecosystem-integrations
description: >
  Map tanstack ecosystem partner metadata to installable add-on ids using
  tanstack ecosystem --json, tanstack create --list-add-ons --json, and
  tanstack create --addon-details --json. Covers exclusive categories,
  provider options, and router-only compatibility constraints.
metadata:
  type: composition
  library: tanstack-cli
  library_version: "0.62.1"
requires:
  - create-app-scaffold
  - query-docs-library-metadata
---

This skill requires familiarity with scaffold and discovery workflows. Read `create-app-scaffold` and `query-docs-library-metadata` first.

# Choose Ecosystem Integrations

Use this skill at the seam between user requirements and valid CLI integration choices.

## Setup

```bash
npx @tanstack/cli ecosystem --json
npx @tanstack/cli create --list-add-ons --json
```

## Core Patterns

### Map partner intent to add-on ids explicitly

```bash
npx @tanstack/cli ecosystem --category database --json
npx @tanstack/cli create --list-add-ons --json
```

### Inspect option surfaces before final provider choice

```bash
npx @tanstack/cli create --addon-details drizzle --json
npx @tanstack/cli create --addon-details prisma --json
```

### Enforce one choice per exclusive category

```bash
npx @tanstack/cli create my-app \
  --framework react \
  --add-ons clerk,drizzle \
  --deployment cloudflare \
  -y
```

## Common Mistakes

### HIGH Treat ecosystem partner id as add-on id

Wrong:
```bash
npx @tanstack/cli add <partner-id-from-ecosystem>
```

Correct:
```bash
npx @tanstack/cli ecosystem --json
npx @tanstack/cli create --list-add-ons --json
npx @tanstack/cli add <mapped-addon-id>
```

`ecosystem` includes partners that are not directly installable add-ons, so direct reuse of partner ids can fail late in add/apply flows.

Source: tanstack ecosystem --json output + tanstack create --list-add-ons --json output

### HIGH Skip addon-details before choosing provider

Wrong:
```bash
npx @tanstack/cli create my-app --add-ons prisma -y
```

Correct:
```bash
npx @tanstack/cli create --addon-details prisma --json
npx @tanstack/cli create my-app --add-ons prisma -y
```

Optionized providers can default silently, producing the wrong data-layer stack for the requested integration.

Source: tanstack create --addon-details prisma --json

### HIGH Select multiple exclusive integrations together

Wrong:
```bash
npx @tanstack/cli create my-app --add-ons clerk,workos -y
```

Correct:
```bash
npx @tanstack/cli create my-app --add-ons clerk -y
```

Exclusive categories permit only one active choice, so multi-select commands can drop or replace intended providers.

Source: packages/create/src/frameworks/*/*/info.json

### CRITICAL Assume router-only supports deployment integration

Wrong:
```bash
npx @tanstack/cli create my-app --router-only --deployment cloudflare -y
```

Correct:
```bash
npx @tanstack/cli create my-app --router-only -y
```

Router-only mode ignores deployment integration, so the command succeeds without applying the intended ecosystem target.

Source: packages/cli/src/command-line.ts:349

### HIGH Tension: Compatibility mode vs explicit intent

This domain's patterns conflict with create-app-scaffold. Integration planning tends to over-assume command intent is preserved, but compatibility mode silently strips integration flags.

See also: create-app-scaffold/SKILL.md § Common Mistakes

### HIGH Tension: Single-command convenience vs integration precision

This domain's patterns conflict with query-docs-library-metadata. Integration choices tend to drift when discovery metadata is skipped in favor of one-shot scaffold commands.

See also: query-docs-library-metadata/SKILL.md § Common Mistakes

## References

- [Authentication providers](references/authentication-providers.md)
- [Data layer providers](references/data-layer-providers.md)
- [Deployment targets](references/deployment-targets.md)
