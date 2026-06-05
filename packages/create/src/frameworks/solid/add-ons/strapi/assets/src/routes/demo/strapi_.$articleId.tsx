import { articles } from '../../lib/strapiClient'
import { createFileRoute, Link } from '@tanstack/solid-router'

export const Route = createFileRoute('/demo/strapi_/$articleId')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { data: article } = await articles.findOne(params.articleId)
    return article
  },
})

function RouteComponent() {
  const article = Route.useLoaderData()

  return (
    <main class="demo-page">
      <div class="mx-auto max-w-4xl">
        <Link to="/demo/strapi" class="mb-6 inline-flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Articles
        </Link>

        <article class="demo-panel">
          <h1 class="demo-title mb-4">{article()?.title || 'Untitled'}</h1>

          {article()?.createdAt && (
            <p class="demo-muted mb-6 text-sm">
              Published on{' '}
              {new Date(
                article()?.createdAt || article()?.attributes?.createdAt,
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}

          {article()?.description && (
            <div class="mb-6">
              <h2 class="demo-section-title mb-3">Description</h2>
              <p class="demo-muted leading-relaxed">
                {article()?.description || article()?.attributes?.description}
              </p>
            </div>
          )}

          {article()?.content && (
            <div>
              <h2 class="demo-section-title mb-3">Content</h2>
              <div class="demo-muted whitespace-pre-wrap leading-relaxed">
                {article()?.content}
              </div>
            </div>
          )}
        </article>
      </div>
    </main>
  )
}
