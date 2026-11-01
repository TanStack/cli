---
id: examples
title: Examples
---

## Basic Usage

```bash
# TanStack Start app (default, with SSR)
tanstack create my-app -y

# Router-only SPA (no SSR)
tanstack create my-app --router-only -y

# Interactive mode to pick add-ons
tanstack create my-app --interactive
```

For visual setup, use `https://tanstack.com/builder`.

## Using Add-ons

```bash
# List available add-ons
tanstack create --list-add-ons

# See add-on details (dependencies, conflicts, options)
tanstack create --addon-details <id>

# Create with specific add-ons
tanstack create my-app --add-ons <id1>,<id2>,<id3>

# Add to existing project
tanstack add <id1> <id2>
```

## Recipes

### Full-Stack App

```bash
tanstack create my-app
cd my-app
cp .env.example .env
# Edit .env with API keys
pnpm dev
```

## CI/CD

### GitHub Actions

```yaml
name: Create Project
on:
  workflow_dispatch:
    inputs:
      name:
        required: true
jobs:
  create:
    runs-on: ubuntu-latest
    steps:
      - run: npx @tanstack/cli create ${{ inputs.name }} -y
```

### Docker

```dockerfile
FROM node:20-slim
RUN npm install -g @tanstack/cli pnpm
RUN tanstack create app -y
WORKDIR /app
RUN pnpm install && pnpm build
CMD ["pnpm", "start"]
```
