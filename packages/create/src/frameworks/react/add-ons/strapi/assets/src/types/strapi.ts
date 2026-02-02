/**
 * Strapi type definitions
 * These types match the Strapi Cloud Template Blog schema
 */

import type { Block } from "@/components/blocks";

// Base image type from Strapi media library
export type TImage = {
  id: number;
  documentId: string;
  alternativeText: string | null;
  url: string;
};

// Author content type
export type TAuthor = {
  id: number;
  documentId: string;
  name: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

// Category content type
export type TCategory = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

// Article content type
export type TArticle = {
  id: number;
  documentId: string;
  title: string;
  description: string;
  slug: string;
  cover?: TImage;
  author?: TAuthor;
  category?: TCategory;
  blocks?: Array<Block>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

// Strapi response wrappers
export type TStrapiResponseSingle<T> = {
  data: T;
  meta?: {
    pagination?: TStrapiPagination;
  };
};

export type TStrapiResponseCollection<T> = {
  data: Array<T>;
  meta?: {
    pagination?: TStrapiPagination;
  };
};

export type TStrapiPagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

export type TStrapiError = {
  status: number;
  name: string;
  message: string;
  details?: Record<string, Array<string>>;
};

export type TStrapiResponse<T = null> = {
  data?: T;
  error?: TStrapiError;
  meta?: {
    pagination?: TStrapiPagination;
  };
};
