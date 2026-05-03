---
'@tanstack/cli': minor
'@tanstack/create': minor
---

feat(cli, create): close the gap between `tanstack create` and shipping a real app

A bundle of UX improvements aimed at beginners (especially those coming from Next.js) and the AI agents they pair with:

- **Tailored post-creation next steps.** The scaffold completion message now lists the env vars you still need to fill in `.env.local`, links the docs for each shipping-critical integration you picked (auth, database, ORM, deployment), and surfaces the Intent-wired AGENTS.md / CLAUDE.md with concrete prompt examples.
- **Pre-creation review screen.** After interactive prompts, the CLI shows a categorized summary (auth, database, ORM, deploy, other) and asks for confirmation before writing files. Conflicting selections (two auth providers, two ORMs, etc.) are flagged in the same step.
- **`.env.example` generation.** A checked-in `.env.example` is now derived from the env-var schemas of selected add-ons, with descriptions and a `(required)` marker. Plays nicely with add-ons that ship their own `_dot_env.example.append`.
- **Better add-on descriptions.** Concept-first one-liners replace generic "Add X to your application." Reads like a menu instead of a list of brand names.
- **Deployment quickstarts.** Each `--deployment` host (Netlify, Cloudflare, Railway, Nitro) now contributes its own README section explaining the actual steps to ship — push, dashboard URL, env var sync.
- **Clerk demo route parity.** Clerk's scaffold now ships a proper sign-in flow (matching Better Auth's depth) using Clerk's prebuilt components, plus a richer README with route-protection patterns and a production checklist.
- **Intent install passes `--map`.** The auto-invoked `intent install` now writes explicit task→skill mappings into the agent config instead of relying on runtime discovery, so agents see directly which skill matches which task.
- **`tanstack clean-demos` command.** A new subcommand removes leftover `demo.*` and `example.*` files (and prunes empty `routes/demo`/`routes/example` directories) so a beginner can ship without the scaffold's training wheels.
