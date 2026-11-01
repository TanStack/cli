---
id: mcp-migration
title: MCP Migration
---

`tanstack mcp` has been removed from the CLI.

Use direct CLI commands for agent introspection and automation.

## Command Mapping

| Old MCP Tool | New CLI Command |
|---|---|
| `listTanStackAddOns` | `tanstack create --list-add-ons --framework React --json` |
| `getAddOnDetails` | `tanstack create --addon-details drizzle --framework React --json` |
| `createTanStackApplication` | `tanstack create my-app --framework React --add-ons drizzle,clerk` |
| `tanstack_list_libraries` | `tanstack libraries --json` |
| `tanstack_doc` | `tanstack doc query framework/react/overview --json` |
| `tanstack_search_docs` | `tanstack search-docs "server functions" --library start --json` |
| `tanstack_ecosystem` | `tanstack ecosystem --category database --json` |

## Recommended Agent Workflow

Use JSON output for deterministic parsing:

```bash
tanstack create --list-add-ons --framework React --json
tanstack create --addon-details tanstack-query --framework React --json
tanstack libraries --json
tanstack search-docs "loaders" --library router --framework react --json
tanstack ecosystem --category auth --json
```

## Important Notes

- The CLI MCP server is removed and will not be restored.
- Existing MCP client configs pointing to `@tanstack/cli mcp` will break and should be removed.
- The app-level `mcp` add-on is still available for projects that want to host their own MCP endpoints.
