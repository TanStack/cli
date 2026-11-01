import { createFileRoute, notFound } from '@tanstack/react-router'

import { getPage } from '#/server/shopify/catalog.functions'

export const Route = createFileRoute('/shop/pages/$handle')({
  loader: async ({ params }) => {
    const page = await getPage({ data: { handle: params.handle } })
    if (!page) throw notFound()
    return { page }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.page.seo.title ?? loaderData.page.title },
          {
            name: 'description',
            content:
              loaderData.page.seo.description ??
              loaderData.page.bodySummary ??
              '',
          },
        ]
      : [],
  }),
  component: PageRoute,
})

function PageRoute() {
  const { page } = Route.useLoaderData()
  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-medium tracking-tight">{page.title}</h1>
      <div
        className="shop-prose"
        dangerouslySetInnerHTML={{ __html: page.body }}
      />
    </article>
  )
}
