import { StrapiImage } from '@/components/strapi-image'
import type { TImage } from '@/types/strapi'

export interface IMedia {
  __component: 'shared.media'
  id: number
  file?: TImage
}

export function Media({ file }: Readonly<IMedia>) {
  if (!file) return null

  return (
    <figure className="my-8">
      <StrapiImage
        src={file.url}
        alt={file.alternativeText || ''}
        className="rounded-lg w-full"
      />
      {file.alternativeText && (
        <figcaption className="demo-muted mt-2 text-center text-sm">
          {file.alternativeText}
        </figcaption>
      )}
    </figure>
  )
}
