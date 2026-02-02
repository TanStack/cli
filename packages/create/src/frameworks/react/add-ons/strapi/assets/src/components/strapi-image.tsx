import { useState } from "react";
import { getStrapiMedia } from "@/lib/strapi-utils";

interface StrapiImageProps {
  src: string | undefined | null;
  alt?: string | null;
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function StrapiImage({
  src,
  alt,
  className = "",
  width,
  height,
}: StrapiImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src) return null;

  const imageUrl = getStrapiMedia(src);

  if (hasError) {
    return (
      <div
        className={`bg-slate-700 flex items-center justify-center text-slate-400 text-sm ${className}`}
        style={{ width, height }}
      >
        <span>Image not available</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt || ""}
      width={width}
      height={height}
      loading="lazy"
      className={`object-cover ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
