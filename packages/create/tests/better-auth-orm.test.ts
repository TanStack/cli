import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import ejs from 'ejs'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(
  new URL('../src/frameworks/react/add-ons/', import.meta.url),
)
const render = (file: string, data: Record<string, unknown>) =>
  ejs.render(readFileSync(`${root}${file}`, 'utf8'), data)

// Better Auth's default database contract needs all four tables, including
// account.password for email sign-in and unique session.token for lookups.
describe('Better Auth database templates', () => {
  for (const orm of ['drizzle', 'prisma']) {
    for (const database of orm === 'drizzle'
      ? ['postgresql', 'mysql', 'sqlite']
      : ['postgres', 'mysql', 'sqlite']) {
      it(`provides the auth contract for ${orm} ${database}`, () => {
        const data = {
          addOnEnabled: { 'better-auth': true, [orm]: true },
          addOnOption: { [orm]: { database } },
        }
        const schema = render(
          orm === 'drizzle'
            ? 'drizzle/assets/src/db/schema.ts.ejs'
            : 'prisma/assets/prisma/schema.prisma.ejs',
          data,
        )
        for (const table of ['user', 'session', 'account', 'verification']) {
          expect(schema).toContain(
            orm === 'drizzle' ? `export const ${table} =` : `model ${table} {`,
          )
        }
        expect(schema).toContain('password')
        if (database === 'mysql') {
          expect(schema).toContain(
            orm === 'drizzle'
              ? "image: text('image')"
              : 'image String? @db.Text',
          )
          expect(schema).toContain(
            orm === 'drizzle'
              ? "value: text('value')"
              : 'value String @db.Text',
          )
        }
        expect(schema).toContain(orm === 'drizzle' ? '.unique()' : '@unique')
        expect(schema).toContain(
          orm === 'drizzle' ? "onDelete: 'cascade'" : 'onDelete: Cascade',
        )
        const pkg = JSON.parse(render('better-auth/package.json.ejs', data))
        expect(pkg.dependencies[`@better-auth/${orm}-adapter`]).toBeDefined()
        const auth = render('better-auth/assets/src/lib/auth.ts.ejs', data)
        expect(auth).toContain(`${orm}Adapter(`)
        const provider =
          orm === 'drizzle' && database === 'postgresql'
            ? 'pg'
            : database === 'postgres'
              ? 'postgresql'
              : database
        expect(auth).toContain(`provider: '${provider}'`)
        const withoutAuth = {
          ...data,
          addOnEnabled: { [orm]: true, 'better-auth': false },
        }
        const plainSchema = render(
          orm === 'drizzle'
            ? 'drizzle/assets/src/db/schema.ts.ejs'
            : 'prisma/assets/prisma/schema.prisma.ejs',
          withoutAuth,
        )
        expect(plainSchema).not.toContain(
          orm === 'drizzle' ? 'export const user =' : 'model user {',
        )
        expect(plainSchema).toContain(
          orm === 'drizzle' ? 'export const todos =' : 'model Todo {',
        )
      })
    }
  }

  it('keeps standalone Better Auth stateless without adding an adapter', () => {
    const data = { addOnEnabled: { 'better-auth': true }, addOnOption: {} }
    expect(
      render('better-auth/assets/src/lib/auth.ts.ejs', data),
    ).not.toContain('database:')
    expect(
      Object.keys(
        JSON.parse(render('better-auth/package.json.ejs', data)).dependencies,
      ),
    ).toEqual(['better-auth'])
  })
})
