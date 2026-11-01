import { createFileRoute, notFound } from '@tanstack/react-router'
import { MDXContent } from '@content-collections/mdx/react'
import { allBlogs } from 'content-collections'
import { SITE_URL } from '#/lib/site'
import { MdxCallout } from '#/components/MdxCallout'
import { MdxMetrics } from '#/components/MdxMetrics'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = Array.from(
      new Map(
        [...allBlogs]
          .sort(
            (a, b) =>
              new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf(),
          )
          .map((entry) => [entry.slug, entry]),
      ).values(),
    ).find((entry) => entry.slug === params.slug)
    if (!post) throw notFound()
    return post
  },
  head: ({ loaderData, params }) => {
    const title = loaderData?.title ?? 'Post'
    const description = loaderData?.description ?? ''
    const image = loaderData?.heroImage ?? '/images/lagoon-1.svg'
    return {
      links: [{ rel: 'canonical', href: `${SITE_URL}/blog/${params.slug}` }],
      meta: [
        { title },
        { name: 'description', content: description },
        {
          property: 'og:image',
          content: image.startsWith('http') ? image : `${SITE_URL}${image}`,
        },
      ],
    }
  },
  component: BlogPost,
})

function BlogPost() {
  const post = Route.useLoaderData()

  return (
    <main className="page-wrap px-4 pb-12 pt-16">
      <article className="island-shell rounded-2xl p-6 sm:p-8">
        {post.heroImage ? (
          <img
            src={post.heroImage}
            alt=""
            className="mb-6 h-64 w-full rounded-2xl object-cover"
          />
        ) : null}
        <p className="island-kicker mb-2">Post</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          {post.title}
        </h1>
        <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
          {new Date(post.pubDate).toLocaleDateString()}
        </p>
        <div className="prose prose-slate prose-headings:text-[var(--sea-ink)] prose-p:text-[var(--sea-ink-soft)] prose-li:text-[var(--sea-ink-soft)] prose-ul:text-[var(--sea-ink-soft)] prose-ol:text-[var(--sea-ink-soft)] prose-strong:text-[var(--sea-ink)] prose-a:text-[var(--lagoon-deep)] max-w-none">
          {post.mdx ? (
            <MDXContent
              code={post.mdx}
              components={{ MdxCallout, MdxMetrics }}
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: post.html ?? '' }} />
          )}
        </div>
      </article>
    </main>
  )
}
