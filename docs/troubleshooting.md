---
id: troubleshooting
title: Troubleshooting
---

## Installation

### Command not found

```bash
# Use npx instead
npx @tanstack/cli create my-app

# Or reinstall globally
npm install -g @tanstack/cli
```

### Permission denied

Use a Node version manager:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
```

### Node too old

Requires Node.js 18+:

```bash
node --version  # Check
nvm install 20  # Upgrade
```

## Project Creation

### Directory exists

```bash
tanstack create my-app-v2              # Different name
tanstack create my-app --target-dir ./new/path  # Different path
tanstack create my-app -f              # Force overwrite
```

### Add-on fetch failed

Check internet. Or use local:

```bash
git clone https://github.com/TanStack/cli.git
cd cli && pnpm install && pnpm build
node packages/cli/dist/index.js create my-app
```

### Conflicting add-ons

Some add-ons conflict with each other (e.g., multiple ORMs, multiple auth providers). Use `--addon-details <id>` to see what conflicts with what:

```bash
tanstack create --addon-details clerk
```

## Runtime

### Missing env vars

```bash
cp .env.example .env
# Edit .env with your values
pnpm dev  # Restart
```

### Tailwind not working

Check `.tanstack.json` has `"tailwind": true` and `styles.css` imports `@import 'tailwindcss'`.

## MCP Server Removal

`tanstack mcp` has been removed from the CLI. Use the CLI introspection commands instead:

```bash
tanstack create --list-add-ons --json
tanstack create --addon-details clerk --json
tanstack libraries --json
tanstack search-docs "server functions" --library start --json
tanstack ecosystem --category database --json
```

If you need MCP in your generated app, keep using the `mcp` add-on during app creation.

See [MCP Migration](./mcp-migration.md) for command-by-command replacements.

## Getting Help

Include when reporting:
- `npx @tanstack/cli --version`
- `node --version`
- OS and package manager
- Full error message

Links:
- [GitHub Issues](https://github.com/TanStack/cli/issues)
- [Discord](https://tlinz.com/discord)
