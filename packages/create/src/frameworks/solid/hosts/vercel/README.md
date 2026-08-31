## Deploy to Vercel

1. Push this repo to GitHub, GitLab, or Bitbucket
2. In Vercel, choose **Add New > Project** and import the repo
3. Keep the detected TanStack Start framework settings
4. Add production values from `.env.example` under **Settings > Environment Variables**
5. Deploy

Vercel runs the build script and deploys Nitro's output as Vercel Functions and
static assets. The included `vercel.json` makes framework detection explicit.

Variables prefixed with `VITE_` are included in the browser bundle. Keep secrets
unprefixed so they remain server-only.
