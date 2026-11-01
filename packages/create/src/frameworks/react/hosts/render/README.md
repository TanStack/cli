## Deploy to Render

This project includes a Render Blueprint:

1. Push this repo to GitHub, GitLab, or Bitbucket
2. In Render, choose **New > Blueprint** and connect this repo
3. Render reads `render.yaml` and creates the web service
4. In the Render Dashboard, add any secrets from `.env.example` under **Environment**
5. Deploy

The Nitro server handles SSR, server functions, API routes, and static assets.
Render provides `PORT` automatically; Nitro reads it at runtime.

Need a database? Add one from the Render Dashboard, then connect it via
environment variables. See https://render.com/docs/databases for options.
