# Create React App for TanStack Router

This CLI application builds Tanstack Router applications that are the functional equivalent of [Create React App](https://create-react-app.dev/).

To help accelerate the migration away from `create-react-app` we created the `create-start` CLI which is a plug-n-play replacement for CRA.

## Quick Start

To maintain compatability with `create-react-app` you can build a new application by running:

| Command                                                       | Description        |
| ------------------------------------------------------------- | ------------------ |
| `pnpm create @tanstack/start@latest my-app`                   | Create a new app   |
| `pnpm create @tanstack/start@latest my-app --framework solid` | Create a Solid app |

If you don't specify a project name, the CLI will walk you through an interactive setup process:

```bash
pnpm create @tanstack/start@latest
```

This will start an interactive CLI that guides you through the setup process, allowing you to choose:

- Project Name
- Package manager
- Toolchain
- Git initialization

## Command Line Options

You can also use command line flags to specify your preferences directly:

```bash
pnpm create @tanstack/start@latest my-app --package-manager pnpm
```

Available options:

- `--package-manager`: Specify your preferred package manager (`npm`, `yarn`, `pnpm`, `bun`, or `deno`)
- `--toolchain`: Specify your toolchain solution for formatting/linting (`biome`, `eslint`)
- `--no-git`: Do not initialize a git repository
- `--add-ons`: Enable add-on selection or specify add-ons to install
- `--tailwind` / `--no-tailwind`: Deprecated compatibility flags; accepted but ignored (Tailwind is always enabled)

When using flags, the CLI will display which options were provided and only prompt for the remaining choices.

## Features

What you'll get is a Vite application that uses TanStack Router. All the files will still be in the same place as in CRA, but you'll get a fully functional Router setup under in `app/main.tsx`.

`create-start-app` is everything you loved about CRA but implemented with modern tools and best practices, on top of the popular TanStack set of libraries. Which includes [@tanstack/react-query](https://tanstack.com/query/latest) and [@tanstack/react-router](https://tanstack.com/router/latest).

## Additional Configuration

### Package Manager

Choose your preferred package manager (`npm`, `bun`, `yarn`, `pnpm`, or `deno`) either through the interactive CLI or using the `--package-manager` flag.

Extensive documentation on using the TanStack Start, as well as integrating [@tanstack/react-query](https://tanstack.com/query/latest) and [@tanstack/store](https://tanstack.com/store/latest) can be found in the generated `README.md` for your project.

### Toolchain

Choose your preferred solution for formatting and linting either through the interactive CLI or using the `--toolchain` flag.

Setting this flag to `biome` will configure it as your toolchain of choice, adding a `biome.json` to the root of the project. Consult the [biome documentation](https://biomejs.dev/guides/getting-started/) for further customization.

Setting this flag to `eslint` will configure it as your toolchain of choice, adding an `eslint.config.js` and `prettier.config.js` to the root of the project, as well as a `.prettierignore` file. Consult the [eslint documentation](https://eslint.org/docs/latest/) and [prettier documentation](https://prettier.io/docs/) for further customization.

## Add-ons (experimental)

You can enable add-on selection:

```bash
pnpm create @tanstack/start@latest --add-ons
```

This will prompt you to select the add-ons you want to enable during application creation.

You can enable specific add-ons directly by adding a comma separated list of add-on names to the `--add-ons` flag. For example:

```bash
pnpm create @tanstack/start@latest my-app --add-ons shadcn,tanstack-query
```

You can get a list of all available add-ons by running:

```bash
pnpm create @tanstack/start@latest --list-add-ons
```

This will get you a list of all available add-ons for Solid.

```bash
pnpm create @tanstack/start@latest --list-add-ons --framework solid
```

## MCP (Model Context Protocol) Support (experimental)

You can launch the `create-start-app` CLI with the `--mcp` flag to enable MCP support. Use this in your MCP enabled IDE to allow the Agent model to generate TanStack Start applications.

```bash
pnpm create @tanstack/start@latest --mcp
```

Here is the JSON configuration for MCP support in many MCP clients.

```json
{
  "mcpServers": {
    "create-start-app": {
      "command": "pnpm dlx",
      "args": ["create-start-app@latest", "--mcp"]
    }
  }
}
```

# Contributing

Check out the [Contributing](CONTRIBUTING.md) guide.

# License

MIT
