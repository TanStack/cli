/**
 * Strapi URL helpers
 */

const DEFAULT_STRAPI_URL = "http://localhost:1337";

// Base Strapi URL (without /api)
export function getStrapiURL(): string {
  // Handle SSR where import.meta.env might not be fully available
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_STRAPI_URL) {
    return import.meta.env.VITE_STRAPI_URL;
  }
  return DEFAULT_STRAPI_URL;
}

// Get full URL for media assets
export function getStrapiMedia(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http") || url.startsWith("//")) {
    return url;
  }
  // Ensure we always have a valid base URL
  const baseUrl = getStrapiURL() || DEFAULT_STRAPI_URL;
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}
