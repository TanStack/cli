## Deploy to Netlify

This project ships with `netlify.toml` configured for a Netlify site:

1. Push this repo to GitHub
2. Visit https://app.netlify.com/start and import the repo
3. Netlify auto-detects the build (`vite build` → `dist/client`)
4. Open **Site settings → Environment variables** and add anything from `.env.example` that needs a real value in production
5. Trigger the first deploy

Server functions and API routes run on Netlify Functions. For lower-latency request handling, see Netlify Edge Functions: https://docs.netlify.com/edge-functions/overview.
