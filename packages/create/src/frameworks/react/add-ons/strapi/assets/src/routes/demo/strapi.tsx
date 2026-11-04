import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { strapiApi } from '@/data/loaders'
import { StrapiImage } from '@/components/strapi-image'
import { Search } from '@/components/search'
import { Pagination } from '@/components/pagination'
import type { TArticle } from '@/types/strapi'

type LoaderResult = {
  status: 'success' | 'empty' | 'error'
  articles: TArticle[]
  meta?: { pagination?: { page: number; pageCount: number; total: number } }
  error?: string
  query?: string
}

const searchSchema = z.object({
  query: z.string().optional(),
  page: z.number().default(1),
})

export const Route = createFileRoute('/demo/strapi')({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }): Promise<LoaderResult> => {
    const { query, page } = deps.search
    try {
      const response = await strapiApi.articles.getArticlesData({
        data: { query, page },
      })

      // Check if we got data
      if (!response || !response.data) {
        return {
          status: 'empty',
          articles: [],
          meta: response?.meta,
          query,
        }
      }

      // Check if data array is empty
      if (response.data.length === 0) {
        return {
          status: 'empty',
          articles: [],
          meta: response.meta,
          query,
        }
      }

      return {
        status: 'success',
        articles: response.data,
        meta: response.meta,
        query,
      }
    } catch (error) {
      console.error('Strapi fetch error:', error)
      return {
        status: 'error',
        articles: [],
        error:
          error instanceof Error
            ? error.message
            : 'Failed to connect to Strapi',
        query,
      }
    }
  },
})

function StrapiServerInstructions() {
  return (
    <div className="demo-card mt-6 text-left">
      <h2 className="demo-section-title mb-4">Start the Strapi Server</h2>
      <div className="demo-muted space-y-2 font-mono text-sm">
        <p>
          <span>$</span> cd ../server
        </p>
        <p>
          <span>$</span> npm install
        </p>
        <p>
          <span>$</span> npm run develop
        </p>
      </div>
      <p className="demo-muted text-sm mt-4">
        Then create an admin at{' '}
        <a
          href="http://localhost:1337/admin"
          target="_blank"
          rel="noopener noreferrer"
        >
          http://localhost:1337/admin
        </a>
      </p>
    </div>
  )
}

function ConnectionError({ error }: { error?: string }) {
  return (
    <div className="demo-alert">
      <div className="flex items-start gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Cannot Connect to Strapi
          </h2>
          <p className="demo-muted mb-4">
            Make sure your Strapi server is running at{' '}
            <code>http://localhost:1337</code>
          </p>
          {error && <p className="demo-muted text-sm mb-4">Error: {error}</p>}
          <StrapiServerInstructions />
        </div>
      </div>
    </div>
  )
}

function NoArticlesFound({ query }: { query?: string }) {
  if (query) {
    return (
      <div className="demo-card">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No Results Found</h2>
          <p className="demo-muted mb-6 max-w-md mx-auto">
            No articles match your search for "{query}". Try adjusting your
            search terms.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="demo-card">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-4">No Articles Yet</h2>
        <p className="demo-muted mb-6 max-w-md mx-auto">
          Your Strapi server is running, but there are no published articles.
          Create and publish your first article to see it here.
        </p>

        <div className="demo-card max-w-md mx-auto text-left">
          <h3 className="demo-section-title mb-4">How to add articles:</h3>
          <ol className="demo-muted space-y-3">
            <li className="flex gap-3">
              <span className="font-bold">1.</span>
              <span>
                Open{' '}
                <a
                  href="http://localhost:1337/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Strapi Admin Panel
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">2.</span>
              <span>
                Go to{' '}
                <strong className="text-[var(--sea-ink)]">
                  Content Manager
                </strong>{' '}
                → <strong className="text-[var(--sea-ink)]">Article</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">3.</span>
              <span>
                Click{' '}
                <strong className="text-[var(--sea-ink)]">
                  Create new entry
                </strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">4.</span>
              <span>
                Fill in the details and click{' '}
                <strong className="text-[var(--sea-ink)]">Publish</strong>
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}

function RouteComponent() {
  const { status, articles, meta, error, query } = Route.useLoaderData()

  return (
    <main className="demo-page demo-page-wide">
      <div>
        <p className="island-kicker mb-2">CMS</p>
        <h1 className="demo-title mb-6">Strapi Articles</h1>

        <div className="mb-8">
          <Search />
        </div>

        {status === 'error' && <ConnectionError error={error} />}

        {status === 'empty' && <NoArticlesFound query={query} />}

        {status === 'success' && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article: TArticle) => (
                <Link
                  key={article.id}
                  to="/demo/strapi/$articleId"
                  params={{ articleId: article.documentId }}
                  className="block"
                >
                  <article className="demo-card h-full cursor-pointer overflow-hidden p-0 transition hover:-translate-y-0.5">
                    <StrapiImage
                      src={article.cover?.url}
                      alt={article.cover?.alternativeText || article.title}
                      className="w-full h-48"
                    />

                    <div className="p-6 flex flex-col flex-1">
                      <h2 className="text-xl font-semibold mb-3">
                        {article.title || 'Untitled'}
                      </h2>

                      {article.description && (
                        <p className="demo-muted mb-4 leading-relaxed line-clamp-2">
                          {article.description}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between">
                        {article.author?.name && (
                          <span className="demo-muted text-sm">
                            By {article.author.name}
                          </span>
                        )}
                        {article.createdAt && (
                          <span className="demo-muted text-sm">
                            {new Date(article.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {article.category?.name && (
                        <div className="mt-3">
                          <span className="demo-pill">
                            {article.category.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {meta?.pagination && meta.pagination.pageCount > 1 && (
              <div className="mt-8">
                <Pagination pageCount={meta.pagination.pageCount} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
