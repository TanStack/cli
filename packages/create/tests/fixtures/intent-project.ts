const app = JSON.stringify({
  name: 'app',
  dependencies: { '@tanstack/react-router': 'latest' },
})
const root = (workspaces?: unknown, skills?: unknown) =>
  JSON.stringify({
    name: 'root',
    workspaces,
    intent: skills === undefined ? undefined : { skills },
  })

export const intentProjectCases = [
  {
    name: 'standalone nested package ignores unrelated parent policy',
    files: {
      '/repo/package.json': root(undefined, []),
      '/repo/app/package.json': app,
    },
    expected: ['app'],
  },
  {
    name: 'standalone nested package ignores unrelated malformed skills',
    files: {
      '/repo/package.json': root(undefined, 'bad'),
      '/repo/app/package.json': app,
    },
    expected: ['app'],
  },
  {
    name: 'workspace inherits explicit deny at its inclusive root',
    files: {
      '/repo/package.json': root(['packages/*'], []),
      '/repo/packages/app/package.json': app,
    },
    expected: ['app', '', 'root'],
  },
  {
    name: 'workspace membership does not limit discovery',
    files: {
      '/repo/package.json': root(['elsewhere/*'], ['allowed']),
      '/repo/app/package.json': app,
    },
    expected: ['app', 'root'],
  },
  {
    name: 'empty workspace patterns still declare a root',
    files: {
      '/repo/package.json': root([], []),
      '/repo/app/package.json': app,
    },
    expected: ['app', 'root'],
  },
  {
    name: 'object workspace patterns declare a root',
    files: {
      '/repo/package.json': root({ packages: ['apps/*'] }, []),
      '/repo/app/package.json': app,
    },
    expected: ['app', 'root'],
  },
  {
    name: 'intermediate package policy belongs to workspace config dirs',
    files: {
      '/repo/package.json': root(['**'], ['allowed']),
      '/repo/packages/package.json': JSON.stringify({
        name: 'middle',
        intent: { skills: [] },
      }),
      '/repo/packages/app/package.json': app,
    },
    expected: ['app', 'middle', 'root'],
  },
  {
    name: 'nearest workspace bounds policy and malformed JSON reads',
    files: {
      '/repo/package.json': '{bad',
      '/repo/nested/package.json': root([], []),
      '/repo/nested/app/package.json': app,
    },
    expected: ['app', 'root'],
  },
  {
    name: 'own workspace root excludes malformed ancestors',
    files: {
      '/repo/package.json': '{bad',
      '/repo/app/package.json': JSON.stringify({
        name: 'app',
        workspaces: [],
        dependencies: { '@tanstack/react-router': 'latest' },
      }),
    },
    expected: ['app'],
  },
  {
    name: 'git file bounds discovery before malformed ancestor',
    files: {
      '/repo/package.json': '{bad',
      '/repo/app/.git': 'gitdir: elsewhere',
      '/repo/app/package.json': app,
    },
    expected: ['app'],
  },
  {
    name: 'git directory bounds discovery before malformed ancestor',
    files: {
      '/repo/package.json': '{bad',
      '/repo/app/.git/config': '',
      '/repo/app/package.json': app,
    },
    expected: ['app'],
  },
  {
    name: 'git boundary at an enclosing standalone checkout excludes upper policy',
    files: {
      '/repo/package.json': '{bad',
      '/repo/checkout/.git': 'gitdir: elsewhere',
      '/repo/checkout/package.json': root(undefined, []),
      '/repo/checkout/app/package.json': app,
    },
    expected: ['app'],
  },
  {
    name: 'workspace at git boundary is included before stopping',
    files: {
      '/repo/package.json': '{bad',
      '/repo/work/.git': 'gitdir: elsewhere',
      '/repo/work/package.json': root([], []),
      '/repo/work/app/package.json': app,
    },
    expected: ['app', 'root'],
  },
  {
    name: 'pnpm workspace root takes precedence over malformed workspace field',
    files: {
      '/repo/pnpm-workspace.yaml': 'packages: []\n',
      '/repo/package.json': root('invalid', []),
      '/repo/app/package.json': app,
    },
    expected: ['app', 'root'],
  },
  {
    name: 'pnpm workspace without package manifest still bounds ancestry',
    files: {
      '/repo/package.json': '{bad',
      '/repo/work/pnpm-workspace.yaml': 'packages: [apps/*]\n',
      '/repo/work/app/package.json': app,
    },
    expected: ['app', ''],
  },
  {
    name: 'deno workspace array declares root',
    files: {
      '/repo/deno.json': '{"workspace":["apps/*"]}',
      '/repo/package.json': root(undefined, []),
      '/repo/app/package.json': app,
    },
    expected: ['app', 'root'],
  },
  {
    name: 'deno workspace members declare root',
    files: {
      '/repo/deno.json': '{"workspace":{"members":[]}}',
      '/repo/package.json': root(undefined, []),
      '/repo/app/package.json': app,
    },
    expected: ['app', 'root'],
  },
  {
    name: 'deno JSONC comments and trailing comma declare root',
    files: {
      '/repo/deno.jsonc': '{ // comment\n"workspace":["apps/*",],}',
      '/repo/package.json': root(undefined, []),
      '/repo/app/package.json': app,
    },
    expected: ['app', 'root'],
  },
  {
    name: 'invalid pnpm format falls through to package workspace',
    files: {
      '/repo/pnpm-workspace.yaml': 'packages: invalid\n',
      '/repo/package.json': root([], []),
      '/repo/app/package.json': app,
    },
    expected: ['app', 'root'],
  },
  {
    name: 'invalid workspace field does not turn policy into a workspace',
    files: {
      '/repo/package.json': root('invalid', []),
      '/repo/app/package.json': app,
    },
    expected: ['app'],
  },
  {
    name: 'malformed ancestor manifest inside discovery fails closed',
    files: { '/repo/package.json': '{bad', '/repo/app/package.json': app },
    expected: 'reject',
  },
  {
    name: 'malformed manifest fails even when child has its own policy',
    files: {
      '/repo/package.json': '{bad',
      '/repo/app/package.json': JSON.stringify({
        name: 'app',
        intent: { skills: [] },
      }),
    },
    expected: 'reject',
  },
  {
    name: 'non-object ancestor manifest fails closed',
    files: { '/repo/package.json': '[]', '/repo/app/package.json': app },
    expected: 'reject',
  },
  {
    name: 'pnpm root malformed policy manifest still fails closed',
    files: {
      '/repo/pnpm-workspace.yaml': 'packages: []\n',
      '/repo/package.json': '{bad',
      '/repo/app/package.json': app,
    },
    expected: 'reject',
  },
] satisfies Array<{
  name: string
  files: Record<string, string>
  expected: Array<string> | 'reject'
}>
