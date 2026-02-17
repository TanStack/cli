---
id: cli-reference
title: CLI Reference
---

## tanstack create

Create a new TanStack application. By default creates a TanStack Start app with SSR.

```bash
tanstack create [project-name] [options]
```

| Option | Description |
|--------|-------------|
| `--add-ons <ids>` | Comma-separated add-on IDs |
| `--starter <url>` | Starter URL or local path |
| `--package-manager <pm>` | `npm`, `pnpm`, `yarn`, `bun`, `deno` |
| `--framework <name>` | `React`, `Solid` |
| `--router-only` | Create Router-only SPA without TanStack Start (no SSR) |
| `--toolchain <id>` | Toolchain add-on (use `--list-add-ons` to see options) |
| `--deployment <id>` | Deployment add-on (use `--list-add-ons` to see options) |
| `--tailwind` / `--no-tailwind` | Deprecated compatibility flags; accepted but ignored (Tailwind is always enabled) |
| `--no-git` | Skip git init |
| `--no-install` | Skip dependency install |
| `-y, --yes` | Use defaults, skip prompts |
| `--interactive` | Force interactive mode |
| `--target-dir <path>` | Custom output directory |
| `-f, --force` | Overwrite existing directory |
| `--list-add-ons` | List all available add-ons |
| `--addon-details <id>` | Show details for specific add-on |
| `--add-on-config <json>` | JSON string with add-on options |
| `--ui` | Launch visual project builder |

```bash
# Examples
tanstack create my-app -y
tanstack create my-app --add-ons clerk,drizzle,tanstack-query
tanstack create my-app --router-only --add-ons tanstack-query
tanstack create my-app --starter https://example.com/starter.json
```

---

## tanstack add

Add add-ons to an existing project.

```bash
tanstack add [add-on...] [options]
```

| Option | Description |
|--------|-------------|
| `--forced` | Force add-on installation even if conflicts exist |
| `--ui` | Launch visual add-on picker |

```bash
# Examples
tanstack add clerk drizzle
tanstack add tanstack-query,tanstack-form
tanstack add --ui
```

---

## tanstack add-on

Create and manage custom add-ons.

### init

Extract add-on from current project:

```bash
tanstack add-on init
```

Creates `.add-on/` folder with `info.json` and `assets/`.

### compile

Rebuild after changes:

```bash
tanstack add-on compile
```

See [Creating Add-ons](./creating-add-ons.md) for full guide.

---

## tanstack starter

Create reusable project presets.

### init

```bash
tanstack starter init
```

Creates `starter-info.json` and `starter.json`.

### compile

```bash
tanstack starter compile
```

See [Starters](./starters.md) for full guide.

---

## tanstack mcp

Start MCP server for AI agents.

```bash
tanstack mcp [options]
```

| Option | Description |
|--------|-------------|
| `--sse` | HTTP/SSE mode (default: stdio) |

See [MCP Server](./mcp/overview.md) for setup.

---

## tanstack pin-versions

Pin TanStack package versions to avoid conflicts.

```bash
tanstack pin-versions
```

Removes `^` from version ranges for TanStack packages and adds any missing peer dependencies.

---

## Configuration

Projects include `.tanstack.json`:

```json
{
  "version": 1,
  "projectName": "my-app",
  "framework": "react",
  "mode": "file-router",
  "typescript": true,
  "tailwind": true,
  "packageManager": "pnpm",
  "chosenAddOns": ["tanstack-query", "clerk"]
}
```

Used by `add-on init` and `starter init` to detect changes.
