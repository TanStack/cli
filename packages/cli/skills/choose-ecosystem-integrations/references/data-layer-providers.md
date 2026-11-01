# Data Layer Providers

Inspect each provider's options before generation to avoid defaulting to an unintended backend.

## Common add-ons

- `prisma`
- `drizzle`
- `convex`
- `neon`

## Selection pattern

```bash
npx @tanstack/cli create --addon-details prisma --json
npx @tanstack/cli create --addon-details drizzle --json
npx @tanstack/cli create my-app --add-ons drizzle -y
```

Database/ORM categories can be exclusive depending on framework template metadata.
