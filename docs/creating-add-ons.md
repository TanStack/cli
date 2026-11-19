---
id: creating-add-ons
title: Creating Add-ons
---

Add-ons add files, dependencies, and code hooks to generated projects.

Use this guide when you want to build and maintain your own add-on outside the built-in catalog.

## Quick Start

```bash
# 1. Create base project
tanstack create my-addon-dev -y

# 2. Add your code
#    - src/integrations/my-feature/
#    - src/routes/demo/my-feature.tsx
#    - Update package.json

# 3. Extract add-on
tanstack add-on init

# 4. Edit .add-on/info.json

# 5. Compile
tanstack add-on compile

# Optional: continuously rebuild while authoring
tanstack add-on dev

# 6. Test locally
npx serve .add-on -l 9080
tanstack create test --add-ons http://localhost:9080/info.json
```

## Structure

```
.add-on/
├── info.json        # Metadata (required)
├── package.json     # Dependencies (optional)
└── assets/          # Files to copy
    └── src/
        ├── integrations/my-feature/
        └── routes/demo/my-feature.tsx
```

Generated source of truth files in your project root:

- `.add-on/info.json` - add-on metadata and integration config
- `.add-on/package.json` - dependency/script additions merged into generated apps
- `.add-on/assets/**` - template files copied into target apps

## info.json

Required fields:

```json
{
  "name": "My Feature",
  "version": "0.0.1",
  "description": "What it does",
  "type": "add-on",
  "phase": "add-on",
  "category": "tooling",
  "modes": ["file-router"]
}
```

| Field | Values |
|-------|--------|
| `version` | Semantic version for your add-on metadata (e.g. `0.0.1`) |
| `type` | `add-on`, `toolchain`, `deployment`, `example` |
| `phase` | `setup`, `add-on`, `example` |
| `category` | `tanstack`, `auth`, `database`, `orm`, `deploy`, `tooling`, `monitoring`, `api`, `i18n`, `cms`, `other` |

Optional fields:

```json
{
  "dependsOn": ["tanstack-query"],
  "conflicts": ["other-feature"],
  "envVars": [{ "name": "API_KEY", "description": "...", "required": true }],
  "gitignorePatterns": ["*.cache"]
}
```

## Hooks (Integrations)

Inject code into generated projects:

```json
{
  "integrations": [
    {
      "type": "root-provider",
      "jsName": "MyProvider",
      "path": "src/integrations/my-feature/provider.tsx"
    }
  ]
}
```

| Type | Location | Use |
|------|----------|-----|
| `root-provider` | Wraps app in `__root.tsx` | Context providers |
| `provider` | Same, but simpler | Basic providers |
| `vite-plugin` | `vite.config.ts` | Vite plugins |
| `devtools` | After app in `__root.tsx` | Devtools |
| `header-user` | Header component | User menu, auth UI |
| `layout` | Layout wrapper | Dashboard layouts |

## Demo Routes

```json
{
  "routes": [
    {
      "url": "/demo/my-feature",
      "name": "My Feature Demo",
      "path": "src/routes/demo/my-feature.tsx",
      "jsName": "MyFeatureDemo"
    }
  ]
}
```

## Add-on Options

Let users configure the add-on:

```json
{
  "options": {
    "database": {
      "type": "select",
      "label": "Database",
      "options": [
        { "value": "postgres", "label": "PostgreSQL" },
        { "value": "sqlite", "label": "SQLite" }
      ],
      "default": "postgres"
    }
  }
}
```

Access in EJS templates:

```ejs
<% if (addOnOption['my-feature']?.database === 'postgres') { %>
// PostgreSQL code
<% } %>
```

## EJS Templates

Files ending in `.ejs` are processed. Available variables:

| Variable | Type | Description |
|----------|------|-------------|
| `projectName` | string | Project name |
| `typescript` | boolean | TS enabled |
| `tailwind` | boolean | Tailwind enabled |
| `addOnEnabled` | object | `{ [id]: boolean }` |
| `addOnOption` | object | `{ [id]: options }` |

File patterns:

| Pattern | Result |
|---------|--------|
| `file.ts` | Copied as-is |
| `file.ts.ejs` | EJS processed |
| `_dot_gitignore` | Becomes `.gitignore` |
| `file.ts.append` | Appended to existing |

## Distribution

Host on GitHub, npm, or any URL:

```bash
tanstack create my-app --add-ons https://example.com/my-addon/info.json
```

### Local Iteration Loop

Fastest way to iterate on a custom add-on:

```bash
# in your add-on project
tanstack add-on compile
npx serve .add-on -l 9080

# in another terminal
tanstack create test-app --add-ons http://localhost:9080/info.json
```

If you are actively editing templates, run `tanstack add-on dev` to auto-refresh `.add-on` and `add-on.json` on file changes.

### Publishing Tips

- Keep add-on source in git (not just compiled output).
- Re-run `tanstack add-on compile` after each metadata/template change.
- Publish `.add-on` contents to a stable URL.
- Prefer immutable/versioned URLs for production use.


## Router-only compatibility

Set `"supportsRouterOnly": true` in `info.json` only when the add-on works without TanStack Start. This makes it available during Router-only creation. Every dependency must also support Router-only apps. Toolchains remain available without this flag; deployment adapters and templates remain disabled.

## Maintenance Checklist

When you update a custom add-on:

1. Update templates or metadata in your source project.
2. Re-run `tanstack add-on compile`.
3. Test with a clean scaffold (`tanstack create ... --add-ons <url>`).
4. Verify install/build/lint in the generated app.
5. Publish updated `.add-on` assets.

## Troubleshooting

- **Add-on not found**: Verify URL points directly to `info.json`.
- **Template not applied**: Ensure file is in `.add-on/assets` and ends with `.ejs` if templated.
- **Option not taking effect**: Confirm option key matches `addOnOption['<id>']` usage in template.
- **Integration code not injected**: Check `integrations[].type`, `jsName`, and `path` in `.add-on/info.json`.
