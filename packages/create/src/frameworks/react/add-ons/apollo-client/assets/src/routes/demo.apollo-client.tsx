import { gql, TypedDocumentNode } from '@apollo/client'
import { useReadQuery } from '@apollo/client/react'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

// Example GraphQL query - replace with your own schema
const EXAMPLE_QUERY: TypedDocumentNode<{
  continents: { __typename: string; code: string; name: string }
}> = gql`
  query ExampleQuery {
    continents {
      code
      name
    }
  }
`

export const Route = createFileRoute('/demo/apollo-client')({
  component: RouteComponent,
  loader: ({ context: { preloadQuery } }) => {
    // Preload the query in the loader for optimal performance
    const queryRef = preloadQuery(EXAMPLE_QUERY, {
      variables: {},
    })
    return {
      queryRef,
    }
  },
})

function RouteComponent() {
  const { queryRef } = Route.useLoaderData()
  const { data } = useReadQuery(queryRef)

  return (
    <main className="demo-page">
      <section className="demo-panel">
        <p className="island-kicker mb-2">GraphQL</p>
        <h1 className="demo-title mb-6">Apollo Client Demo</h1>
        <div className="demo-alert mb-4">
          <p className="font-bold">Apollo Client is configured!</p>
          <p className="text-sm mt-2">
            This demo uses <code>preloadQuery</code> in the loader and{' '}
            <code>useReadQuery</code> in the component for optimal streaming SSR
            performance.
          </p>
        </div>
        <div className="demo-code-block">
          <h3 className="font-bold mb-2">Query Result:</h3>
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
        <div className="demo-muted mt-4 text-sm">
          <p className="font-medium text-[var(--sea-ink)]">Next steps:</p>
          <ul className="list-disc ml-6 mt-2">
            <li>
              Configure your GraphQL endpoint in <code>src/router.tsx</code>
            </li>
            <li>Replace the example query with your actual GraphQL schema</li>
            <li>
              Learn more:{' '}
              <a href="https://www.apollographql.com/docs/react">
                Apollo Client Docs
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  )
}
