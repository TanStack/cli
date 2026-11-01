import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import Header from '@/components/Header'

import appCss from '@/styles.css?url'

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
        title: 'TanStack Storefront',
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
      <body>
        <Header />
        {wrappedChildren}
        <Scripts />
      </body>
    </html>
  )
}
