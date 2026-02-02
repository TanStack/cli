import {
  getArticlesData,
  getArticleByIdData,
  getArticleBySlugData,
} from "./articles";

/**
 * Strapi API - Server functions for fetching data from Strapi
 *
 * Usage in route loaders:
 * ```ts
 * import { strapiApi } from "@/data/loaders";
 *
 * export const Route = createFileRoute("/articles")({
 *   loader: async () => {
 *     const { data, meta } = await strapiApi.articles.getArticlesData();
 *     return data;
 *   },
 * });
 * ```
 */
export const strapiApi = {
  articles: {
    getArticlesData,
    getArticleByIdData,
    getArticleBySlugData,
  },
};
