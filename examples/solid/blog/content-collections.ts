import { defineCollection, defineConfig } from '@content-collections/core'
import { compileMarkdown } from '@content-collections/markdown'
import { z } from 'zod'

const blog = defineCollection({
  name: 'blog',
  directory: 'content/blog',
  include: '**/*.md',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string(),
    heroImage: z.string().optional(),
  }),
  transform: async (document, context) => {
    return {
      ...document,
      slug: document._meta.path,
      pubDate: new Date(document.pubDate).toISOString(),
      html: await compileMarkdown(context, document),
    }
  },
})

export default defineConfig({
  collections: [blog],
})
