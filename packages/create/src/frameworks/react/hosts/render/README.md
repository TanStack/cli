## Deploy to Render

This project includes a `render.yaml` for one-click deployment:

1. Push this repo to GitHub
2. Visit https://render.com/deploy and select your repo (or click the Deploy to Render button below)
3. Render reads `render.yaml` and creates the web service automatically
4. In the Render Dashboard, add any secrets from `.env.example` under **Environment**
5. Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

The Nitro server handles SSR, server functions, API routes, and static assets.
Render provides `PORT` automatically; Nitro reads it at runtime.

Need a database? Add one from the Render Dashboard, then connect it via
environment variables. See https://render.com/docs/databases for options.
