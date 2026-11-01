## 2026-03-02

### Updated for @tanstack/cli v0.61.0

**Breaking changes:**
- create-app-scaffold: documents router-only compatibility behavior where template/deployment/add-on intent is ignored.
- add-addons-existing-app: enforces `.cta.json` metadata precondition for add flows.

**Deprecation updates:**
- create-app-scaffold: `--no-tailwind` treated as deprecated/ignored; recommends post-scaffold removal flow.
- query-docs-library-metadata: deprecated alias discovery patterns replaced with `tanstack` command namespace.

**New skills:**
- create-app-scaffold: deterministic app generation and flag compatibility.
- add-addons-existing-app: add-on layering into existing repos.
- query-docs-library-metadata: JSON discovery/doc retrieval for agents.
- choose-ecosystem-integrations: partner-to-add-on mapping and exclusivity handling.
- maintain-custom-addons-dev-watch: custom add-on authoring and dev-watch lifecycle.
