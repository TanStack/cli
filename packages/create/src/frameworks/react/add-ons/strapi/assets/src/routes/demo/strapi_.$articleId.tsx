import { createFileRoute, Link } from "@tanstack/react-router";
import { strapiApi } from "@/data/loaders";
import { StrapiImage } from "@/components/strapi-image";
import { BlockRenderer } from "@/components/blocks";
import type { TArticle } from "@/types/strapi";

export const Route = createFileRoute("/demo/strapi_/$articleId")({
  component: RouteComponent,
  errorComponent: ErrorComponent,
  loader: async ({ params }) => {
    try {
      const response = await strapiApi.articles.getArticleByIdData({
        data: params.articleId,
      });
      return { success: true, article: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load article",
        article: null,
      };
    }
  },
});

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/demo/strapi"
          className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-6 transition-colors"
        >
          ← Back to Articles
        </Link>
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Article</h1>
          <p className="text-gray-300">{error.message}</p>
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  const { success, article, error } = Route.useLoaderData() as {
    success: boolean;
    article: TArticle | null;
    error?: string;
  };

  // Show error state
  if (!success || !article) {
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

          <div className="bg-amber-900/20 border border-amber-500/50 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="text-amber-400 text-2xl">⚠️</div>
              <div>
                <h2 className="text-xl font-semibold text-amber-400 mb-2">
                  {error || "Article Not Found"}
                </h2>
                <p className="text-gray-300">
                  Make sure the Strapi server is running and the article exists.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        <article className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden">
          <StrapiImage
            src={article.cover?.url}
            alt={article.cover?.alternativeText || article.title}
            className="w-full h-64"
          />

          <div className="p-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              {article.title || "Untitled"}
            </h1>

            <div className="flex items-center gap-4 mb-6">
              {article.author?.name && (
                <span className="text-gray-400">
                  By{" "}
                  <span className="text-cyan-400">{article.author.name}</span>
                </span>
              )}
              {article.createdAt && (
                <span className="text-sm text-cyan-400/70">
                  {new Date(article.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>

            {article.category?.name && (
              <div className="mb-6">
                <span className="text-xs px-3 py-1 bg-slate-700 text-cyan-400 rounded-full">
                  {article.category.name}
                </span>
              </div>
            )}

            {article.description && (
              <div className="mb-8">
                <p className="text-xl text-gray-300 leading-relaxed">
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
    </div>
  );
}
