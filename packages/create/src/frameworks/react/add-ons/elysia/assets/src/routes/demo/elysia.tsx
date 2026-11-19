import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { treaty } from '@elysiajs/eden'
import type { App } from '#/lib/elysia.server'
import '#/styles/elysia.css'

export const Route = createFileRoute('/demo/elysia')({ component: ElysiaDemo })

function ElysiaDemo() {
  const nameId = useId()
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => setReady(true), [])

  async function greet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const name = new FormData(event.currentTarget).get('name')
    if (typeof name !== 'string' || !name.trim()) {
      setError('Enter a name.')
      return
    }
    setPending(true)
    setMessage('')
    setError('')
    try {
      const client = treaty<App>(window.location.origin)
      const response = await client.api.demo.elysia.greet.post({
        name: name.trim(),
      })
      if (response.error) {
        setError('Could not get a greeting. Try again.')
      } else {
        setMessage(response.data.message)
      }
    } catch {
      setError('Could not get a greeting. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="elysia-demo">
      <h1>Elysia greeting</h1>
      <form onSubmit={(event) => void greet(event)}>
        <label htmlFor={nameId}>Name</label>
        <input
          id={nameId}
          name="name"
          required
          maxLength={80}
          autoComplete="given-name"
        />
        <button type="submit" disabled={pending || !ready}>
          {pending ? 'Greeting…' : 'Greet'}
        </button>
      </form>
      {message && <output aria-live="polite">{message}</output>}
      {error && <p role="alert">{error}</p>}
    </main>
  )
}
