import { createFileRoute, Link } from '@tanstack/react-router'
import { strapiApi } from '@/data/loaders'
import { StrapiImage } from '@/components/strapi-image'
import { BlockRenderer } from '@/components/blocks'
import type { TArticle } from '@/types/strapi'

export const Route = createFileRoute('/demo/strapi/$articleId')({
  component: RouteComponent,
  errorComponent: ErrorComponent,
  loader: async ({ params }) => {
    try {
      const response = await strapiApi.articles.getArticleByIdData({
        data: params.articleId,
      })
      return { success: true, article: response.data }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to load article',
        article: null,
      }
    }
  },
})

function ErrorComponent({ error }: { error: Error }) {
  return (
    <main className="demo-page">
      <div className="mx-auto max-w-4xl">
        <Link to="/demo/strapi" className="mb-6 inline-flex items-center">
          ← Back to Articles
        </Link>
        <div className="demo-alert demo-alert-danger text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Article</h1>
          <p className="demo-muted">{error.message}</p>
        </div>
      </div>
    </main>
  )
}

function RouteComponent() {
  const { success, article, error } = Route.useLoaderData() as {
    success: boolean
    article: TArticle | null
    error?: string
  }

  // Show error state
  if (!success || !article) {
    return (
      <main className="demo-page">
        <div className="mx-auto max-w-4xl">
          <Link to="/demo/strapi" className="mb-6 inline-flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
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

          <div className="demo-alert">
            <div className="flex items-start gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {error || 'Article Not Found'}
                </h2>
                <p className="demo-muted">
                  Make sure the Strapi server is running and the article exists.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="demo-page">
      <div className="mx-auto max-w-4xl">
        <Link to="/demo/strapi" className="mb-6 inline-flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
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

        <article className="demo-panel overflow-hidden p-0">
          <StrapiImage
            src={article.cover?.url}
            alt={article.cover?.alternativeText || article.title}
            className="w-full h-64"
          />

          <div className="p-8">
            <h1 className="demo-title mb-4">{article.title || 'Untitled'}</h1>

            <div className="flex items-center gap-4 mb-6">
              {article.author?.name && (
                <span className="demo-muted">
                  By{' '}
                  <span className="text-[var(--sea-ink)]">
                    {article.author.name}
                  </span>
                </span>
              )}
              {article.createdAt && (
                <span className="demo-muted text-sm">
                  {new Date(article.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>

            {article.category?.name && (
              <div className="mb-6">
                <span className="demo-pill">{article.category.name}</span>
              </div>
            )}

            {article.description && (
              <div className="mb-8">
                <p className="demo-muted text-xl leading-relaxed">
                  {article.description}
                </p>
              </div>
            )}

            {article.blocks && article.blocks.length > 0 && (
              <BlockRenderer blocks={article.blocks} />
            )}
          </div>
        </article>
      </div>
    </main>
  )
}
