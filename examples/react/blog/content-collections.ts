import { defineCollection, defineConfig } from '@content-collections/core'
import { compileMarkdown } from '@content-collections/markdown'
import { compileMDX } from '@content-collections/mdx'
import remarkGfm from 'remark-gfm'
import { z } from 'zod'

const blog = defineCollection({
  name: 'blog',
  directory: 'content/blog',
  include: '**/*.{md,mdx}',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string(),
    content: z.string(),
    heroImage: z.string().optional(),
  }),
  transform: async (document, context) => {
    const isMdx = document._meta.filePath.endsWith('.mdx')

    return {
      ...document,
      slug: document._meta.path,
      pubDate: new Date(document.pubDate).toISOString(),
      html: isMdx ? null : await compileMarkdown(context, document),
      mdx: isMdx
        ? await compileMDX(context, document, {
            remarkPlugins: [remarkGfm],
          })
        : null,
    }
  },
})

export default defineConfig({
  collections: [blog],
})
