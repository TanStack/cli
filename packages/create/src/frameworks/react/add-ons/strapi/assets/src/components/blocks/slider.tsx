import { StrapiImage } from "@/components/strapi-image";
import type { TImage } from "@/types/strapi";

export interface ISlider {
  __component: "shared.slider";
  id: number;
  files?: Array<TImage>;
}

export function Slider({ files }: Readonly<ISlider>) {
  if (!files || files.length === 0) return null;

  return (
    <div className="my-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {files.map((file, index) => (
          <figure key={file.id || index}>
            <StrapiImage
              src={file.url}
              alt={file.alternativeText || ""}
              className="rounded-lg w-full h-48 object-cover"
            />
          </figure>
        ))}
      </div>
    </div>
  );
}
