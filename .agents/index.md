# TanStack CLI

## Quick Reference

```bash
# Create TanStack Start app
npx @tanstack/cli create my-app

# With add-ons
npx @tanstack/cli create my-app --add-ons clerk,drizzle,tanstack-query

# Add to existing project
npx @tanstack/cli add clerk drizzle

# List available add-ons
npx @tanstack/cli create --list-add-ons

# Minimal one-route Start app
npx @tanstack/cli create my-app --blank -y
```

## Monorepo Structure

```
cli/
├── packages/
│   ├── cli/           # @tanstack/cli - Main CLI
│   ├── create/        # @tanstack/create - Core engine + frameworks
│   │   └── src/frameworks/
│   │       ├── react/     # React framework + add-ons
│   │       └── solid/     # Solid framework + add-ons
└── cli-aliases/       # Deprecated wrappers (create-tsrouter-app, etc.)
```

## Development

```bash
pnpm install && pnpm build    # Setup
pnpm dev                       # Watch mode

# Test from peer directory (not inside monorepo)
node ../cli/packages/cli/dist/index.js create my-app
```

## Key Terminology

| Term      | Definition                               | CLI Flag      |
| --------- | ---------------------------------------- | ------------- |
| Add-on    | Plugin that extends apps (auth, DB, etc) | `--add-ons`   |
| Template  | Reusable project template                  | `--template`  |
| Framework | React or Solid                           | `--framework` |
| Build tool | Vite (default) or Rsbuild               | `--build-tool` |

## CLI Commands

| Command                         | Description               |
| ------------------------------- | ------------------------- |
| `tanstack create [name]`        | Create TanStack Start app |
| `tanstack add [add-ons]`        | Add to existing project   |
| `tanstack add-on init/compile`  | Create custom add-on      |
| `tanstack template init/compile` | Create custom template    |
| `tanstack libraries`            | List TanStack libraries   |
| `tanstack doc`                  | Fetch a docs page         |
| `tanstack search-docs`          | Search TanStack docs      |
| `tanstack ecosystem`            | List ecosystem partners   |
| `tanstack pin-versions`         | Pin TanStack packages     |

## Create Options

| Flag                 | Description                                             |
| -------------------- | ------------------------------------------------------- |
| `--add-ons <ids>`    | Comma-separated add-on IDs                              |
| `--framework <name>` | React or Solid                                          |
| `--build-tool <name>` | Vite (default) or Rsbuild                              |
| `--toolchain <id>`   | Toolchain (use `--list-add-ons` to see options)         |
| `--deployment <id>`  | Deployment target (use `--list-add-ons` to see options) |
| `--template <url-or-id>` | Use template URL/path or built-in ID               |
| `--blank`              | Minimal project without starter UI or default tooling |
| `--no-git`           | Skip git init                                           |
| `--no-install`       | Skip npm install                                        |
| `-y`                 | Accept defaults                                         |
| `-f, --force`        | Overwrite existing                                      |

## EJS Template Variables

| Variable         | Type    | Description                              |
| ---------------- | ------- | ---------------------------------------- |
| `projectName`    | string  | Project name                             |
| `typescript`     | boolean | Always true (TanStack Start requires TS) |
| `tailwind`       | boolean | False for blank unless an add-on requires it |
| `bundler`        | string  | Resolved bundler (`vite` or `rsbuild`)   |
| `blank`          | boolean | True when using the blank project preset |
| `fileRouter`     | boolean | Always true                              |
| `addOnEnabled`   | object  | `{ [id]: boolean }`                      |
| `addOnOption`    | object  | `{ [id]: options }`                      |
| `packageManager` | string  | npm/pnpm/yarn/bun/deno                   |
| `js`             | string  | Always `ts`                              |
| `jsx`            | string  | Always `tsx`                             |

## Testing Add-ons Locally

```bash
# Serve add-on
npx serve .add-on -l 9080

# Use in create
node packages/cli/dist/index.js create test --add-ons http://localhost:9080/info.json
```

## Agent Introspection Commands

```bash
npx @tanstack/cli create --list-add-ons --json
npx @tanstack/cli create --addon-details drizzle --json
npx @tanstack/cli libraries --json
npx @tanstack/cli search-docs "server functions" --library start --json
npx @tanstack/cli ecosystem --category database --json
```

## Key Files

| File                              | Purpose                   |
| --------------------------------- | ------------------------- |
| `packages/cli/src/cli.ts`         | CLI command definitions   |
| `packages/create/src/frameworks/` | Framework implementations |
| `packages/create/src/app-*.ts`    | App creation logic        |
| `.cta.json`                       | Generated project config  |


## Intent Skills

This project uses [TanStack Intent](https://github.com/TanStack/intent). Run `npx @tanstack/intent install` to set up skill-to-task mappings for your coding agent. Before working on a task, read the relevant SKILL.md file in `packages/cli/skills/`.

<!-- intent-skills:start -->
# Skill mappings — when working in these areas, load the linked skill file into context.
skills:
  - task: "scaffold a new TanStack app with create command, framework, build tool, template, toolchain, deployment, or add-on flags"
    load: "packages/cli/skills/create-app-scaffold/SKILL.md"
  - task: "add add-ons to an existing project using tanstack add"
    load: "packages/cli/skills/add-addons-existing-app/SKILL.md"
  - task: "query docs, list add-ons, inspect add-on details, or fetch library metadata for agent context"
    load: "packages/cli/skills/query-docs-library-metadata/SKILL.md"
  - task: "choose ecosystem integrations like auth providers, ORMs, or deployment targets"
    load: "packages/cli/skills/choose-ecosystem-integrations/SKILL.md"
  - task: "author, compile, or dev-watch custom add-ons or templates"
    load: "packages/cli/skills/maintain-custom-addons-dev-watch/SKILL.md"
<!-- intent-skills:end -->
