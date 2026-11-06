import { createFileRoute } from '@tanstack/react-router'
import { app } from '#/lib/elysia.server'

export const Route = createFileRoute('/api/demo/elysia/$')({
  server: {
    handlers: {
      POST: ({ request }) => app.fetch(request),
    },
  },
})
