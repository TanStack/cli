import { articles } from '#/lib/strapiClient'
import { createFileRoute, Link } from '@tanstack/react-router'

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/demo/strapi"
          className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-6 transition-colors"
        >
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

        <article className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {article?.title || 'Untitled'}
          </h1>

          {article?.createdAt && (
            <p className="text-sm text-cyan-400/70 mb-6">
              Published on{' '}
              {new Date(article?.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}

          {article?.description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-300 mb-3">
                Description
              </h2>
              <p className="text-gray-400 leading-relaxed">
                {article?.description}
              </p>
            </div>
          )}

          {article?.content && (
            <div>
              <h2 className="text-xl font-semibold text-gray-300 mb-3">
                Content
              </h2>
              <div className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                {article?.content}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
