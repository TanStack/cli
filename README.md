<div align="center">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://tanstack.com/api/readme/cli.png?theme=dark"
    />
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://tanstack.com/api/readme/cli.png"
    />
    <img
      src="https://tanstack.com/api/readme/cli.png"
      alt="TanStack CLI"
      width="900"
    />
  </picture>
</div>

<div align="center">
<a href="https://www.npmjs.com/package/@tanstack/cli" target="_parent">
  <img alt="" src="https://img.shields.io/npm/dm/@tanstack/cli.svg" />
</a>
<a href="https://github.com/TanStack/cli/stargazers" target="_parent">
  <img alt="" src="https://img.shields.io/github/stars/TanStack/cli.svg?style=social&label=Star" />
</a>
<a href="https://twitter.com/tan_stack"><img src="https://img.shields.io/twitter/follow/tan_stack.svg?style=social" /></a>
</div>

<div align="center">

### [Become a Sponsor!](https://github.com/sponsors/tannerlinsley/)

</div>

# TanStack CLI

Create and manage TanStack Router and Start applications.

```bash
npx @tanstack/cli create my-app
```

## Features

- **TanStack Start** - Full-stack SSR framework (default)
- **TanStack Router** - Type-safe routing (`--router-only` for SPA)
- **Vite or Rsbuild** - Choose the build tool for React and Solid projects
- **Add-ons** - Auth, database, deployment, monitoring, and more
- **CLI Introspection** - Agent-friendly discovery via JSON CLI output

## Quick Start

```bash
# Create TanStack Start app (recommended)
npx @tanstack/cli create my-app

# Create a minimal one-route Start app without selection prompts
npx @tanstack/cli create my-app --blank -y

# Create Router-only SPA (no SSR)
npx @tanstack/cli create my-app --router-only

# Create with Rsbuild
npx @tanstack/cli create my-app --build-tool rsbuild -y

# With add-ons
npx @tanstack/cli create my-app --add-ons clerk,drizzle,tanstack-query

# Add to existing project
npx @tanstack/cli add clerk drizzle

# List available add-ons
npx @tanstack/cli create --list-add-ons

# Agent-friendly introspection
npx @tanstack/cli create --addon-details tanstack-query --json
npx @tanstack/cli libraries --json
npx @tanstack/cli search-docs "loaders" --library router --framework react --json
```

## Documentation

- [CLI Reference](https://tanstack.com/cli/latest/docs/cli-reference)
- [TanStack Start](https://tanstack.com/start)
- [TanStack Router](https://tanstack.com/router)

## Telemetry

TanStack CLI sends anonymous usage telemetry by default.

- Sent: command usage, durations, selected framework/build tool/package manager/add-on ids, and coarse result metadata
- Never sent: project names, file paths, target directories, raw search queries, raw template URLs/paths, add-on config values, env vars, or raw error messages
- Disabled automatically in `CI`, or when `DO_NOT_TRACK=1` or `TANSTACK_CLI_TELEMETRY_DISABLED=1`

Manage it with:

```bash
tanstack telemetry status
tanstack telemetry disable
tanstack telemetry enable
```

## Get Involved

- [GitHub Issues](https://github.com/TanStack/cli/issues)
- [GitHub Discussions](https://github.com/TanStack/cli/discussions)
- [Discord](https://discord.com/invite/WrRKjPJ)
- [Contributing Guide](./CONTRIBUTING.md)

## TanStack Ecosystem

- [TanStack Query](https://github.com/tanstack/query) - Async state & caching
- [TanStack Router](https://github.com/tanstack/router) - Type-safe routing
- [TanStack Start](https://github.com/tanstack/router) - Full-stack SSR
- [TanStack Form](https://github.com/tanstack/form) - Type-safe forms
- [TanStack Table](https://github.com/tanstack/table) - Headless datagrids
- [TanStack Store](https://github.com/tanstack/store) - Reactive state
- [TanStack Virtual](https://github.com/tanstack/virtual) - Virtualized rendering

[More at TanStack.com](https://tanstack.com)
