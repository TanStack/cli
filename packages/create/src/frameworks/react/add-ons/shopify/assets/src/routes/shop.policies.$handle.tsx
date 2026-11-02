import { createFileRoute, notFound } from '@tanstack/react-router'

import { getShopPolicy } from '#/server/shopify/catalog.functions'

export const Route = createFileRoute('/shop/policies/$handle')({
  loader: async ({ params }) => {
    const policy = await getShopPolicy({ data: { handle: params.handle } })
    if (!policy) throw notFound()
    return { policy }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: loaderData.policy.title }]
      : [],
  }),
  component: PolicyRoute,
})

function PolicyRoute() {
  const { policy } = Route.useLoaderData()
  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-medium tracking-tight">{policy.title}</h1>
      <div
        className="shop-prose"
        dangerouslySetInnerHTML={{ __html: policy.body }}
      />
    </article>
  )
}
