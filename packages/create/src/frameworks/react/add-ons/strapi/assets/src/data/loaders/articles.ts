import { createServerFn } from "@tanstack/react-start";
import { sdk } from "@/data/strapi-sdk";
import type { TArticle, TStrapiResponseCollection, TStrapiResponseSingle } from "@/types/strapi";

const PAGE_SIZE = 3;

const articles = sdk.collection("articles");

/**
 * Fetch articles with optional filtering, search, and pagination
 */
const getArticles = async (
  page?: number,
  category?: string,
  query?: string
) => {
  const filterConditions: Array<Record<string, unknown>> = [];

  // Add search query filter
  if (query) {
    filterConditions.push({
      $or: [
        { title: { $containsi: query } },
        { description: { $containsi: query } },
      ],
    });
  }

  // Add category filter
  if (category) {
    filterConditions.push({
      category: {
        slug: { $eq: category },
      },
    });
  }

  const filters =
    filterConditions.length === 0
      ? undefined
      : filterConditions.length === 1
        ? filterConditions[0]
        : { $and: filterConditions };

  return articles.find({
    sort: ["createdAt:desc"],
    pagination: {
      page: page || 1,
      pageSize: PAGE_SIZE,
    },
    populate: ["cover", "author", "category"],
    filters,
  }) as Promise<TStrapiResponseCollection<TArticle>>;
};

/**
 * Fetch a single article by documentId
 */
const getArticleById = async (documentId: string) => {
  return articles.findOne(documentId, {
    populate: ["cover", "author", "category", "blocks.file", "blocks.files"],
  }) as Promise<TStrapiResponseSingle<TArticle>>;
};

/**
 * Fetch a single article by slug
 */
const getArticleBySlug = async (slug: string) => {
  return articles.find({
    filters: {
      slug: { $eq: slug },
    },
    populate: ["cover", "author", "category", "blocks.file", "blocks.files"],
  }) as Promise<TStrapiResponseCollection<TArticle>>;
};

// Server Functions - these run on the server and can be called from components

export const getArticlesData = createServerFn({
  method: "GET",
})
  .inputValidator(
    (input?: { page?: number; category?: string; query?: string }) => input
  )
  .handler(async ({ data }): Promise<TStrapiResponseCollection<TArticle>> => {
    const response = await getArticles(data?.page, data?.category, data?.query);
    return response;
  });

export const getArticleByIdData = createServerFn({
  method: "GET",
})
  .inputValidator((documentId: string) => documentId)
  .handler(async ({ data: documentId }): Promise<TStrapiResponseSingle<TArticle>> => {
    const response = await getArticleById(documentId);
    return response;
  });

export const getArticleBySlugData = createServerFn({
  method: "GET",
})
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<TStrapiResponseCollection<TArticle>> => {
    const response = await getArticleBySlug(slug);
    return response;
  });
