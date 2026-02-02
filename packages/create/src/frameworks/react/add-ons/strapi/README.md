## Strapi CMS Integration

This add-on integrates Strapi CMS with your TanStack Start application using the official Strapi Client SDK. The Strapi server is created as a sibling directory during setup.

### Features

- Article listing with search and pagination
- Article detail pages with dynamic block rendering
- Rich text, quotes, media, and image slider blocks
- Markdown content rendering with GitHub Flavored Markdown
- Responsive image handling with error fallbacks
- URL-based search and pagination (shareable/bookmarkable)
- Graceful error handling with helpful setup instructions

### Project Structure

```
parent/
├── client/                 # TanStack Start frontend (your project name)
│   ├── src/
│   │   ├── components/
│   │   │   ├── blocks/     # Block rendering components
│   │   │   ├── markdown-content.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── search.tsx
│   │   │   └── strapi-image.tsx
│   │   ├── data/
│   │   │   ├── loaders/    # Server functions
│   │   │   └── strapi-sdk.ts
│   │   ├── lib/
│   │   │   └── strapi-utils.ts
│   │   ├── routes/demo/
│   │   │   ├── strapi.tsx              # Articles list
│   │   │   └── strapi_.$articleId.tsx  # Article detail
│   │   └── types/
│   │       └── strapi.ts
│   ├── .env.local
│   └── package.json
└── server/                 # Strapi CMS backend (auto-created)
    ├── src/api/            # Content types
    ├── config/             # Strapi configuration
    └── package.json
```

### Quick Start

The Strapi server is automatically cloned from the official [Strapi Cloud Template Blog](https://github.com/strapi/strapi-cloud-template-blog).

**1. Install Strapi dependencies:**

```bash
cd ../server
npm install    # or pnpm install / yarn install
```

**2. Start the Strapi server:**

```bash
npm run develop    # Starts at http://localhost:1337
```

**3. Create an admin account:**

Open http://localhost:1337/admin and create your first admin user.

**4. Create content:**

In the Strapi admin panel, go to Content Manager > Article and create some articles.

**5. Start your TanStack app (in another terminal):**

```bash
cd ../client   # or your project name
npm run dev    # Starts at http://localhost:3000
```

**6. View the demo:**

Navigate to http://localhost:3000/demo/strapi to see your articles.

### Environment Variables

The following environment variable is pre-configured in `.env.local`:

```bash
VITE_STRAPI_URL="http://localhost:1337"
```

For production, update this to your deployed Strapi URL.

### Demo Pages

| URL | Description |
|-----|-------------|
| `/demo/strapi` | Articles list with search and pagination |
| `/demo/strapi/:articleId` | Article detail with block rendering |

### Search and Pagination

- **Search**: Type in the search box to filter articles by title or description
- **Pagination**: Navigate between pages using the pagination controls
- **URL State**: Search and page are stored in the URL (`?query=term&page=2`)

### Block Types Supported

| Block | Component | Description |
|-------|-----------|-------------|
| `shared.rich-text` | RichText | Markdown content |
| `shared.quote` | Quote | Blockquote with author |
| `shared.media` | Media | Single image/video |
| `shared.slider` | Slider | Image gallery grid |

### Dependencies

| Package | Purpose |
|---------|---------|
| `@strapi/client` | Official Strapi SDK |
| `react-markdown` | Markdown rendering |
| `remark-gfm` | GitHub Flavored Markdown |
| `use-debounce` | Debounced search input |

### Running Both Servers

Open two terminal windows from the parent directory:

**Terminal 1 - Strapi:**
```bash
cd server && npm run develop
```

**Terminal 2 - TanStack Start:**
```bash
cd client && npm run dev   # or your project name
```

### Customization

**Change page size:**
Edit `src/data/loaders/articles.ts` and modify `PAGE_SIZE`.

**Add new block types:**
1. Create component in `src/components/blocks/`
2. Export from `src/components/blocks/index.ts`
3. Add case to `block-renderer.tsx` switch statement
4. Update populate in articles loader

**Add new content types:**
1. Add types to `src/types/strapi.ts`
2. Create loader in `src/data/loaders/`
3. Create route in `src/routes/demo/`

### Learn More

- [Strapi Documentation](https://docs.strapi.io/)
- [Strapi Client SDK](https://www.npmjs.com/package/@strapi/client)
- [Strapi Cloud Template Blog](https://github.com/strapi/strapi-cloud-template-blog)
- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [TanStack Router Search Params](https://tanstack.com/router/latest/docs/framework/react/guide/search-params)
