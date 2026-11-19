import { Elysia, t } from 'elysia'

export const app = new Elysia({ prefix: '/api/demo/elysia' }).post(
  '/greet',
  ({ body }) => ({ message: `Hello ${body.name}` }),
  { body: t.Object({ name: t.String({ minLength: 1, maxLength: 80 }) }) },
)

export type App = typeof app
