import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { inngest } from '../../inngest/client'
import { helloWorld } from '../../inngest/functions'

const sendHelloEvent = createServerFn({ method: 'POST' })
  .inputValidator((name: string) => name)
  .handler(async ({ data: name }) => {
    const { ids } = await inngest.send(helloWorld.create({ name }))
    return { eventId: ids[0] }
  })

export const Route = createFileRoute('/demo/inngest')({
  component: RouteComponent,
})

function RouteComponent() {
  const [name, setName] = useState('world')
  const [result, setResult] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSend = async () => {
    setSending(true)
    setError(null)
    setResult(null)
    try {
      const { eventId } = await sendHelloEvent({ data: name })
      setResult(eventId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-12 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.32),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <p className="island-kicker mb-3">Inngest Demo</p>
        <h1 className="display-title mb-4 text-4xl leading-[1.05] font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Send an event, trigger a durable function.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          This page dispatches the <code>demo/hello.world</code> event. The
          Inngest Dev Server picks it up and runs <code>helloWorld</code>,
          which sleeps briefly and returns a greeting.
        </p>

        <div className="max-w-xl space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-[var(--sea-ink-soft)]">
              Name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon-deep)]"
            />
          </label>

          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            className="w-full rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] transition hover:-translate-y-0.5 hover:bg-[rgba(79,184,178,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send demo/hello.world'}
          </button>

          {result && (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <p className="island-kicker mb-1">Event sent</p>
              <code className="break-all text-sm text-[var(--sea-ink)]">
                {result}
              </code>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[rgba(200,70,70,0.3)] bg-[rgba(200,70,70,0.08)] p-4 text-sm text-[#c04646]">
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="island-shell mt-8 rounded-2xl p-6">
        <p className="island-kicker mb-2">Quick Start</p>
        <ul className="m-0 list-disc space-y-2 pl-5 text-sm text-[var(--sea-ink-soft)]">
          <li>
            Uncomment <code>INNGEST_DEV=1</code> in <code>.env.local</code>{' '}
            during development — without it, the SDK defaults to cloud mode and
            will try to authenticate against Inngest Cloud.You can also use `INNGEST_DEV=1 pnpm dev` to start the application.
          </li>
          <li>
            Run the Dev Server in a second terminal:{' '}
            <code>npx inngest-cli@latest dev</code>.
          </li>
          <li>
            View traces and runs at{' '}
            <a
              href="http://localhost:8288"
              target="_blank"
              rel="noopener noreferrer"
            >
              localhost:8288
            </a>
            .
          </li>
        </ul>
      </section>
    </main>
  )
}
