import { Link, createFileRoute } from '@tanstack/react-router'
import { allBlogs } from 'content-collections'
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '#/lib/site'

const canonical = `${SITE_URL}/blog`
const pageTitle = `Blog | ${SITE_TITLE}`

export const Route = createFileRoute('/blog/')({
  head: () => ({
    links: [{ rel: 'canonical', href: canonical }],
    meta: [
      { title: pageTitle },
      { name: 'description', content: SITE_DESCRIPTION },
      { property: 'og:image', content: `${SITE_URL}/images/lagoon-1.svg` },
    ],
  }),
  component: BlogIndex,
})

function BlogIndex() {
  const postsByDate = Array.from(
    new Map(
      [...allBlogs]
        .sort(
          (a, b) =>
            new Date(b.pubDate).valueOf() - new Date(a.pubDate).valueOf(),
        )
        .map((post) => [post.slug, post]),
    ).values(),
  )

  const featured = postsByDate[0]
  const posts = postsByDate.slice(1)
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="mb-4">
        <p className="island-kicker mb-2">Latest Dispatches</p>
        <h1 className="display-title m-0 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Blog
        </h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="island-shell rise-in rounded-2xl p-5 sm:p-6 lg:col-span-2">
          {featured.heroImage ? (
            <img
              src={featured.heroImage}
              alt=""
              className="mb-4 h-44 w-full rounded-xl object-cover xl:h-60"
            />
          ) : null}
          <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
            <Link
              to="/blog/$slug"
              params={{ slug: featured.slug }}
              className="no-underline"
            >
              {featured.title}
            </Link>
          </h2>
          <p className="mb-2 mt-3 text-base text-[var(--sea-ink-soft)]">
            {featured.description}
          </p>
          <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
            {new Date(featured.pubDate).toLocaleDateString()}
          </p>
        </article>

        {posts.map((post, index) => (
          <article
            key={post.slug}
            className="island-shell rise-in rounded-2xl p-5 sm:last:col-span-2 lg:last:col-span-1"
            style={{ animationDelay: `${index * 80 + 120}ms` }}
          >
            {post.heroImage ? (
              <img
                src={post.heroImage}
                alt=""
                className="mb-4 h-44 w-full rounded-xl object-cover"
              />
            ) : null}
            <h2 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="no-underline"
              >
                {post.title}
              </Link>
            </h2>
            <p className="mb-2 mt-2 text-sm text-[var(--sea-ink-soft)]">
              {post.description}
            </p>
            <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
              {new Date(post.pubDate).toLocaleDateString()}
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}
