#!/usr/bin/env node
const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < 20) {
  process.stderr.write(
    `TanStack CLI requires Node.js 20 or higher.\n` +
      `You are using Node.js ${process.versions.node}.\n` +
      `Please upgrade Node.js: https://nodejs.org/en/download\n`,
  )
  process.exit(1)
}

const { cli } = await import('./cli.js')
const { createReactFrameworkDefinition, createSolidFrameworkDefinition } =
  await import('@tanstack/create')

cli({
  name: 'tanstack',
  appName: 'TanStack',
  frameworkDefinitionInitializers: [
    createReactFrameworkDefinition,
    createSolidFrameworkDefinition,
  ],
})
