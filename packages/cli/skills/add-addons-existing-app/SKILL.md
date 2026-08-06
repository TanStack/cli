---
name: add-addons-existing-app
description: >
  Apply integrations to existing projects with tanstack add, including
  add-on id resolution, dependency chains, option prompts, and .cta.json
  project metadata preconditions.
metadata:
  type: core
  library: tanstack-cli
  library_version: "0.62.1"
---

# Add Add-ons To Existing App

Use this skill when the project already exists and you need to layer add-ons safely without breaking dependency or metadata assumptions.

## Setup

```bash
npx @tanstack/cli add clerk drizzle
```

## Core Patterns

### Add multiple integrations in one pass

```bash
npx @tanstack/cli add tanstack-query drizzle
```

### Resolve candidate ids before applying

```bash
npx @tanstack/cli create --list-add-ons --json
```

### Validate optionized add-ons before install

```bash
npx @tanstack/cli create --addon-details prisma --json
```

## Common Mistakes

### CRITICAL Run tanstack add without .cta.json

Wrong:
```bash
npx @tanstack/cli add clerk
```

Correct:
```bash
# Run in a project scaffolded by TanStack CLI (contains .cta.json), then:
npx @tanstack/cli add clerk
```

Add flows depend on persisted scaffold metadata, so commands can fail or apply incomplete config when `.cta.json` is missing.

Source: packages/create/src/custom-add-ons/shared.ts:158

### HIGH Use invalid add-on id

Wrong:
```bash
npx @tanstack/cli add drizle
```

Correct:
```bash
npx @tanstack/cli add drizzle
```

Unknown ids stop resolution and force manual correction before any add-on work proceeds.

Source: packages/create/src/add-ons.ts:44

### HIGH Ignore add-on dependency requirements

Wrong:
```bash
npx @tanstack/cli add custom-addon-with-missing-deps
```

Correct:
```bash
npx @tanstack/cli add required-dependency custom-addon-with-missing-deps
```

Add-ons with `dependsOn` can fail during finalization if required dependencies are not present.

Source: packages/create/src/add-ons.ts:48

### MEDIUM Assume old Windows path bug still present

Wrong:
```bash
# Avoid tanstack add on Windows and patch manually
```

Correct:
```bash
npx @tanstack/cli add clerk
```

Avoiding supported workflows based on historical bug reports causes unnecessary manual drift. Fixed in newer versions, but agents trained on older threads may still avoid this path.

Source: https://github.com/TanStack/cli/issues/329

### HIGH Tension: Backwards support vs deterministic automation

This domain's patterns conflict with maintain-custom-addons-dev-watch. Automation that assumes universal add flows tends to fail because legacy compatibility still relies on hidden scaffold metadata.

See also: maintain-custom-addons-dev-watch/SKILL.md § Common Mistakes
