# Authentication Providers

Use `tanstack ecosystem --category authentication --json` for partner discovery, then map to installable add-on ids via `tanstack create --list-add-ons --json`.

## Common add-ons

- `clerk`
- `workos`
- `better-auth`

## Selection pattern

```bash
npx @tanstack/cli ecosystem --category authentication --json
npx @tanstack/cli create --list-add-ons --json
npx @tanstack/cli create my-app --add-ons clerk -y
```

Authentication providers are typically exclusive; select one unless metadata explicitly allows combination.
