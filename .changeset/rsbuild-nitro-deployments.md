---
'@tanstack/create': minor
'@tanstack/cli': minor
---

Support Nitro, Railway, Render, Vercel, and Netlify deployment adapters in React and Solid Rsbuild Start projects using Nitro's experimental Rsbuild integration. Rsbuild deployment projects require Node.js >=22.22 and Rsbuild >=2.3. Cloudflare remains Vite-only until its Nitro development runtime is compatible with Workerd.

Use Nitro 3.0.261103-rc for both Vite and Rsbuild deployment adapters. All projects using this Nitro release require Node.js >=22.22.

Preserve all engine requirements when merging package overlays so subsequent add-ons cannot lower a deployment adapter's Node.js minimum.
