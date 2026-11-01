import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/demo/sentry/bad-event-handler')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main class="demo-page demo-center">
      <section class="demo-panel w-full max-w-md text-center">
        <p class="island-kicker mb-2">Sentry</p>
        <h1 class="demo-title mb-6">Error Handler Demo</h1>
        <button
          type="button"
          onClick={() => {
            throw new Error('Sentry Frontend Error')
          }}
          class="demo-button"
        >
          Throw error
        </button>
      </section>
    </main>
  )
}
