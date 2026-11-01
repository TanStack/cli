# Deployment Targets

Map deployment intent to one supported target and include it in scaffold commands only outside router-only mode.

## Common targets

- `cloudflare`
- `netlify`
- `railway`
- `render`
- `vercel`
- `nitro`

## Selection pattern

```bash
npx @tanstack/cli ecosystem --category deployment --json
npx @tanstack/cli create my-app --deployment cloudflare -y
```

Deployment target selection is exclusive and ignored when `--router-only` is active.
