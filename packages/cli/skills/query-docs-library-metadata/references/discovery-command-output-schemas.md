# Discovery Command Output Schemas

Targets `@tanstack/cli` v0.62.1.

## `tanstack libraries --json`

```json
{
  "group": "All Libraries",
  "count": 3,
  "libraries": [
    {
      "id": "router",
      "name": "TanStack Router",
      "tagline": "Type-safe routing for React",
      "description": "...",
      "frameworks": ["react", "solid"],
      "latestVersion": "1.x.x",
      "docsUrl": "https://tanstack.com/router",
      "githubUrl": "https://github.com/TanStack/router"
    }
  ]
}
```

Key fields: `id` (use for `tanstack doc <id>`), `name`, `tagline`, `latestVersion`.

## `tanstack search-docs <query> --json`

```json
{
  "query": "server functions",
  "totalHits": 42,
  "results": [
    {
      "title": "Server Functions",
      "url": "https://tanstack.com/router/latest/docs/...",
      "snippet": "...",
      "library": "start",
      "breadcrumb": ["Guides", "Server Functions"]
    }
  ]
}
```

## `tanstack create --list-add-ons --json`

Output is a **flat array** of add-on objects (no wrapper):

```json
[
  {
    "id": "drizzle",
    "name": "Drizzle",
    "description": "TypeScript ORM",
    "type": "add-on",
    "category": "orm",
    "phase": "add-on",
    "modes": ["file-router"],
    "link": "https://orm.drizzle.team",
    "warning": null,
    "exclusive": ["orm"],
    "dependsOn": [],
    "options": {}
  }
]
```

Key fields: `id` (use for `--add-ons` and `tanstack add`), `exclusive` (categories allowing only one choice), `dependsOn` (ids auto-added), `options` (non-empty means configurable — inspect with `--addon-details`).

## `tanstack create --addon-details <id> --json`

```json
{
  "id": "prisma",
  "name": "Prisma",
  "description": "Next-generation ORM",
  "type": "add-on",
  "category": "orm",
  "phase": "add-on",
  "modes": ["file-router"],
  "exclusive": ["orm"],
  "dependsOn": [],
  "options": {
    "provider": {
      "type": "select",
      "label": "Database provider",
      "description": "The database driver Prisma will connect to",
      "default": "postgres",
      "options": [
        { "value": "postgres", "label": "PostgreSQL" },
        { "value": "sqlite", "label": "SQLite" },
        { "value": "mysql", "label": "MySQL" }
      ]
    }
  },
  "routes": [],
  "packageAdditions": {
    "dependencies": {},
    "devDependencies": {},
    "scripts": {}
  }
}
```

`options` is a **record keyed by option name**, each entry has `type`, `label`, `default`, and (for `select`) an `options` array of `{ value, label }`.

## `tanstack ecosystem --json`

```json
{
  "query": { "category": null, "library": null },
  "count": 5,
  "partners": [
    {
      "id": "neon",
      "name": "Neon",
      "tagline": "Serverless Postgres",
      "description": "...",
      "category": "database",
      "categoryLabel": "Database",
      "url": "https://neon.tech",
      "libraries": ["router", "start"]
    }
  ]
}
```

Note: ecosystem `id` values are **not** necessarily the same as add-on `id` values. Always cross-reference with `--list-add-ons --json` before using in `tanstack add`.

Use this reference to parse shapes defensively and normalize fields before feeding downstream planning or generation steps.
