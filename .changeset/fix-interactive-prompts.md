---
'@tanstack/cli': patch
---

Fix interactive mode not prompting for all options.

- Default to interactive mode. Previously, `tanstack create my-app` silently applied defaults for framework, deployment, and install. Opt out with `--yes` / `--non-interactive`.
- Add framework selection prompt when the CLI supports multiple frameworks and no `--framework` flag is passed.
- Add "install dependencies now?" prompt when `--no-install` is not passed.
- Show deployment adapter prompt by default (previously required `showDeploymentOptions: true`).
- Honor `forcedDeployment` as the default selection in the deployment prompt, so deprecated aliases keep a sensible default.
- Preserve explicit `--add-ons` arrays instead of overwriting them with the interactive sentinel.
