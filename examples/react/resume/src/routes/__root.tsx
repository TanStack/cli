import { HeadContent, Link, Scripts, createRootRoute, useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import appCss from '../styles.css?url'

const integrationProviders = Object.values(
  import.meta.glob('../integrations/**/{root-provider,provider}.{ts,tsx}', {
    eager: true,
  }),
)
  .map((mod) => {
    const maybeProvider = (mod as { default?: unknown }).default
    return typeof maybeProvider === 'function' ? maybeProvider : null
  })
  .filter((provider): provider is (props: { children: ReactNode }) => ReactNode =>
    Boolean(provider),
  )

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Resume Base',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  const wrappedChildren = integrationProviders.reduceRight((acc, Provider) => {
    return <Provider>{acc}</Provider>
  }, children)

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="resume-body">
        <TopNav />
        {wrappedChildren}
        <Scripts />
      </body>
    </html>
  )
}

function TopNav() {
  const router = useRouter()

  const demoLinks = Object.keys(router.routesById)
    .filter((path) => path.startsWith('/demo/') && !path.includes('$'))
    .sort()
    .map((path) => ({
      to: path,
      label: path
        .replace('/demo/', '')
        .replaceAll('/', ' / ')
        .replaceAll('-', ' '),
    }))

  return (
    <header className="resume-header">
      <nav className="resume-nav">
        <div className="resume-brand-wrap">
          <div className="resume-brand-mark" aria-hidden="true" />
          <Link to="/" className="resume-brand" activeProps={{ className: 'resume-brand is-active' }}>
            Jane Smith
          </Link>
          <span className="resume-role">Staff Frontend Engineer</span>
        </div>

        <div className="resume-nav-links">
          <Link to="/" className="resume-link" activeProps={{ className: 'resume-link is-active' }}>
            Resume
          </Link>

          <a className="resume-link" href="mailto:jane@example.com">
            Contact
          </a>

          <a className="resume-link" href="https://github.com/TanStack" target="_blank" rel="noreferrer">
            GitHub
          </a>

          <a className="resume-link" href="https://x.com/tan_stack" target="_blank" rel="noreferrer">
            X
          </a>
        </div>

        {demoLinks.length > 0 ? (
          <details className="resume-demos">
            <summary className="resume-link resume-demos-summary">Demos</summary>
            <div className="resume-demos-popover">
              {demoLinks.map((demo) => (
                <Link
                  key={demo.to}
                  to={demo.to}
                  className="resume-demo-link"
                  activeProps={{ className: 'resume-demo-link is-active' }}
                >
                  {demo.label}
                </Link>
              ))}
            </div>
          </details>
        ) : null}
      </nav>
    </header>
  )
}
