import { Link, useRouter } from '@tanstack/react-router'
import type { ComponentType } from 'react'

const headerUserComponents = Object.values(
  import.meta.glob('../integrations/**/header-user.{ts,tsx}', {
    eager: true,
  }),
)
  .map((mod) => {
    const maybeComponent = (mod as { default?: unknown }).default
    return typeof maybeComponent === 'function'
      ? (maybeComponent as ComponentType)
      : null
  })
  .filter((component): component is ComponentType => Boolean(component))

export default function Header() {
  const router = useRouter()

  const demoLinks = Object.keys(router.routesById)
    .filter((path) => path.startsWith('/demo/') && !path.includes('$'))
    .sort()

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-3 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)]"
          activeProps={{ className: 'inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)]' }}
        >
          <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
          TanStack Shop
        </Link>

        <div className="ml-2 flex items-center gap-5 text-sm font-semibold">
          <Link to="/" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
            Home
          </Link>
          <a href="#products" className="nav-link">
            Products
          </a>
          <a
            href="https://tanstack.com/start/latest/docs/framework/react/overview"
            className="nav-link"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
        </div>

        {demoLinks.length > 0 ? (
          <details className="relative ml-2">
            <summary className="nav-link list-none cursor-pointer">Demos</summary>
            <div className="absolute left-0 top-[calc(100%+0.5rem)] min-w-56 rounded-xl border border-[var(--line)] bg-[var(--header-bg)] p-2 shadow-lg">
              {demoLinks.map((to) => (
                <Link
                  key={to}
                  to={to}
                  className="block rounded-lg px-3 py-2 text-sm text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
                  activeProps={{ className: 'block rounded-lg px-3 py-2 text-sm text-[var(--sea-ink)] no-underline bg-[var(--link-bg-hover)]' }}
                >
                  {to.replace('/demo/', '').replaceAll('/', ' / ').replaceAll('-', ' ')}
                </Link>
              ))}
            </div>
          </details>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <a
            href="https://x.com/tan_stack"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] sm:block"
          >
            <span className="sr-only">Follow TanStack on X</span>
            <svg viewBox="0 0 16 16" aria-hidden="true" width="28" height="28">
              <path
                fill="currentColor"
                d="M12.6 1h2.2L10 6.48 15.64 15h-4.41L7.78 9.82 3.23 15H1l5.14-5.84L.72 1h4.52l3.12 4.73L12.6 1zm-.77 12.67h1.22L4.57 2.26H3.26l8.57 11.41z"
              />
            </svg>
          </a>
          <a
            href="https://github.com/TanStack"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] sm:block"
          >
            <span className="sr-only">Go to TanStack GitHub</span>
            <svg viewBox="0 0 16 16" aria-hidden="true" width="28" height="28">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
          </a>

          {headerUserComponents.map((HeaderUserComponent, index) => (
            <HeaderUserComponent key={index} />
          ))}
        </div>
      </nav>
    </header>
  )
}
