## Deploy to Railway

This project ships with `nixpacks.toml` so Railway detects the build automatically:

1. Push this repo to GitHub
2. Visit https://railway.com/new and create a project from your repo
3. In the **Variables** tab, add the entries from `.env.example` with their production values
4. Railway runs `vite build` and serves from `dist/client`

Need a database? Click **+ New** in your project to provision Postgres, MySQL, or Redis directly into the same environment — the connection string is auto-injected as `DATABASE_URL`.
