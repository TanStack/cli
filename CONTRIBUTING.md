# Contributing

## Setup

```bash
gh repo clone TanStack/cli
cd cli
pnpm install
pnpm build
```

## Development

```bash
pnpm dev  # Build and watch all packages
```

### Testing the CLI

Run from a **peer directory** (not inside the monorepo):

```bash
# Create an app
node ../cli/packages/cli/dist/index.js create my-app

# With specific package manager
npm_config_user_agent=pnpm node ../cli/packages/cli/dist/index.js create my-app

# With local add-on
node ../cli/packages/cli/dist/index.js create my-app --add-ons http://localhost:9080/info.json
```

### Testing Add-ons Locally

```bash
# In your add-on directory
npx serve .add-on -l 9080

# Create app with local add-on
node ../cli/packages/cli/dist/index.js create my-app --add-ons http://localhost:9080/info.json
```

### Testing Templates Locally

```bash
# In your template directory
npx serve .template -l 9080

# Create app with local template
node ../cli/packages/cli/dist/index.js create my-app --template http://localhost:9080/template.json
```

## Dev Mode

Create a sandbox app, watch built-in framework templates/add-ons, and run the sandbox dev server:

```bash
rm -rf test-app && node packages/cli/dist/index.js dev \
  test-app --framework React --add-ons shadcn
```

The legacy `create --dev-watch <path>` flow still works for direct watch path control.

## Submitting Changes

1. Run tests: `pnpm test`
2. Run build: `pnpm build`
3. Create a PR with a clear description

## Project Structure

```
packages/
├── cli/           # @tanstack/cli - CLI commands
├── create/        # @tanstack/create - Engine + frameworks
```

## Useful Scripts

```bash
pnpm build          # Build all packages
pnpm test           # Run tests
pnpm dev            # Watch mode
pnpm cleanNodeModules  # Clean all node_modules
```
