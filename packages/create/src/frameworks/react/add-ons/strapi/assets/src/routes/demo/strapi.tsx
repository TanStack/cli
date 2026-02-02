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
    <div className="bg-slate-800/50 rounded-lg p-6 text-left mt-6">
      <h2 className="text-lg font-semibold text-white mb-4">
        Start the Strapi Server
      </h2>
      <div className="space-y-2 text-sm font-mono text-gray-400">
        <p>
          <span className="text-cyan-400">$</span> cd ../server
        </p>
        <p>
          <span className="text-cyan-400">$</span> npm install
        </p>
        <p>
          <span className="text-cyan-400">$</span> npm run develop
        </p>
      </div>
      <p className="text-gray-500 text-sm mt-4">
        Then create an admin at{' '}
        <a
          href="http://localhost:1337/admin"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:underline"
        >
          http://localhost:1337/admin
        </a>
      </p>
    </div>
  )
}

function ConnectionError({ error }: { error?: string }) {
  return (
    <div className="bg-amber-900/20 border border-amber-500/50 rounded-xl p-8">
      <div className="flex items-start gap-4">
        <div className="text-amber-400 text-2xl">⚠️</div>
        <div>
          <h2 className="text-xl font-semibold text-amber-400 mb-2">
            Cannot Connect to Strapi
          </h2>
          <p className="text-gray-300 mb-4">
            Make sure your Strapi server is running at{' '}
            <code className="text-cyan-400 bg-slate-800 px-2 py-1 rounded">
              http://localhost:1337
            </code>
          </p>
          {error && (
            <p className="text-gray-500 text-sm mb-4">Error: {error}</p>
          )}
          <StrapiServerInstructions />
        </div>
      </div>
    </div>
  )
}

function NoArticlesFound({ query }: { query?: string }) {
  if (query) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-semibold text-white mb-4">
            No Results Found
          </h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            No articles match your search for "{query}". Try adjusting your
            search terms.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-semibold text-white mb-4">
          No Articles Yet
        </h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Your Strapi server is running, but there are no published articles.
          Create and publish your first article to see it here.
        </p>

        <div className="bg-slate-900/50 rounded-lg p-6 text-left max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4">
            How to add articles:
          </h3>
          <ol className="space-y-3 text-gray-400">
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">1.</span>
              <span>
                Open{' '}
                <a
                  href="http://localhost:1337/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  Strapi Admin Panel
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">2.</span>
              <span>
                Go to <strong className="text-white">Content Manager</strong> →{' '}
                <strong className="text-white">Article</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">3.</span>
              <span>
                Click <strong className="text-white">Create new entry</strong>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">4.</span>
              <span>
                Fill in the details and click{' '}
                <strong className="text-white">Publish</strong>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-white">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Strapi
          </span>{' '}
          <span className="text-gray-300">Articles</span>
        </h1>

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
                  <article className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 cursor-pointer h-full flex flex-col">
                    <StrapiImage
                      src={article.cover?.url}
                      alt={article.cover?.alternativeText || article.title}
                      className="w-full h-48"
                    />

                    <div className="p-6 flex flex-col flex-1">
                      <h2 className="text-xl font-semibold text-white mb-3">
                        {article.title || 'Untitled'}
                      </h2>

                      {article.description && (
                        <p className="text-gray-400 mb-4 leading-relaxed line-clamp-2">
                          {article.description}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between">
                        {article.author?.name && (
                          <span className="text-sm text-gray-500">
                            By {article.author.name}
                          </span>
                        )}
                        {article.createdAt && (
                          <span className="text-sm text-cyan-400/70">
                            {new Date(article.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {article.category?.name && (
                        <div className="mt-3">
                          <span className="text-xs px-2 py-1 bg-slate-700 text-cyan-400 rounded-full">
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
    </div>
  )
}
