---
name: maintain-custom-addons-dev-watch
description: >
  Build and iterate custom add-ons/templates with tanstack add-on init,
  add-on compile, add-on dev, and tanstack create --dev-watch, including sync
  loop preconditions, watch-path validation, and project metadata constraints.
metadata:
  type: lifecycle
  library: tanstack-cli
  library_version: "0.62.1"
requires:
  - add-addons-existing-app
---

# Maintain Custom Add-ons In Dev Watch

Use this skill for local add-on authoring workflows where you continuously compile and sync package output into a target app.

## Setup

```bash
npx @tanstack/cli add-on init
npx @tanstack/cli add-on compile
```

## Core Patterns

### Run add-on dev loop while editing source

```bash
npx @tanstack/cli add-on dev
```

### Sync watched framework directory into a sandbox target app

```bash
# --dev-watch is a flag on `create`, not on `dev`
npx @tanstack/cli create my-sandbox --dev-watch ../path/to/framework-dir
```

### Re-run compile before apply when changing metadata

```bash
npx @tanstack/cli add-on compile
npx @tanstack/cli add my-custom-addon
```

## Common Mistakes

### HIGH Use --dev-watch with --no-install

Wrong:
```bash
npx @tanstack/cli create my-sandbox --dev-watch ../my-addon-package --no-install
```

Correct:
```bash
npx @tanstack/cli create my-sandbox --dev-watch ../my-addon-package
```

Dev-watch rejects `--no-install`, so automated loops fail before any sync work starts.

Source: packages/cli/src/dev-watch.ts:112

### HIGH Start dev-watch without valid framework directory

Wrong:
```bash
npx @tanstack/cli create my-sandbox --dev-watch ../missing-or-invalid-dir
```

Correct:
```bash
npx @tanstack/cli create my-sandbox --dev-watch ../valid-framework-dir
```

Watch setup validates that the path exists, is a directory, and contains at least one of `add-ons/`, `assets/`, or `framework.json`. Invalid targets fail before file syncing begins.

Source: packages/cli/src/command-line.ts:599

### CRITICAL Author add-on from code-router project

Wrong:
```bash
npx @tanstack/cli add-on init
```

Correct:
```bash
# Run add-on init from a file-router project
npx @tanstack/cli add-on init
```

Custom add-on authoring expects file-router mode and exits when run from incompatible project modes.

Source: packages/create/src/custom-add-ons/add-on.ts

### HIGH Run add-on workflows without scaffold metadata

Wrong:
```bash
npx @tanstack/cli add-on dev
```

Correct:
```bash
# Run in a project scaffolded by TanStack CLI (contains .cta.json), then:
npx @tanstack/cli add-on dev
```

Custom add-on flows rely on persisted scaffold options, so missing metadata blocks initialization and update paths.

Source: packages/create/src/custom-add-ons/shared.ts:158

### HIGH Tension: Backwards support vs deterministic automation

This domain's patterns conflict with add-addons-existing-app. Tooling assumes reusable automation, but hidden metadata preconditions from legacy support make add-on loops non-portable across repositories.

See also: add-addons-existing-app/SKILL.md § Common Mistakes
