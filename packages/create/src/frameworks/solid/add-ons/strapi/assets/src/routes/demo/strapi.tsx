import { articles } from '../../lib/strapiClient'
import { createFileRoute, Link } from '@tanstack/solid-router'
import { Show, For } from 'solid-js'

export const Route = createFileRoute('/demo/strapi')({
  component: RouteComponent,
  loader: async () => {
    const { data: strapiArticles } = await articles.find()
    return strapiArticles
  },
})

function RouteComponent() {
  const strapiArticles = Route.useLoaderData()

  return (
    <main class="demo-page demo-page-wide">
      <div>
        <p class="island-kicker mb-2">CMS</p>
        <h1 class="demo-title mb-8">Strapi Articles</h1>

        <Show
          when={strapiArticles() && strapiArticles().length > 0}
          fallback={<p class="demo-muted">No articles found.</p>}
        >
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <For each={strapiArticles()}>
              {(article) => (
                <Link
                  to="/demo/strapi/$articleId"
                  params={{ articleId: article.documentId }}
                  class="block"
                >
                  <article class="demo-card h-full cursor-pointer transition hover:-translate-y-0.5">
                    <h2 class="mb-3 text-xl font-semibold">
                      {article.title || 'Untitled'}
                    </h2>

                    {article.description && (
                      <p class="demo-muted mb-4 leading-relaxed">
                        {article.description}
                      </p>
                    )}

                    {article.content && (
                      <p class="demo-muted line-clamp-3 leading-relaxed">
                        {article.content}
                      </p>
                    )}

                    {article.createdAt && (
                      <p class="demo-muted mt-4 text-sm">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </article>
                </Link>
              )}
            </For>
          </div>
        </Show>
      </div>
    </main>
  )
}
