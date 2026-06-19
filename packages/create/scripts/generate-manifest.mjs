import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const frameworksDir = resolve(packageDir, 'src/frameworks')
const outputFile = resolve(packageDir, 'src/generated/create-manifest.ts')

const binaryExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'])
const templateRenderers = new Map()

const frameworkMetadata = {
  react: {
    id: 'react',
    name: 'React',
    description: 'Templates for React',
    version: '0.1.0',
    supportedModes: {
      'file-router': {
        displayName: 'File Router',
        description: 'TanStack Start with file-based routing',
        forceTypescript: true,
      },
    },
  },
  solid: {
    id: 'solid',
    name: 'Solid',
    description: 'Solid templates for Tanstack Router Applications',
    version: '0.1.0',
    supportedModes: {
      'file-router': {
        displayName: 'File Router',
        description: 'TanStack Start with file-based routing',
        forceTypescript: true,
      },
    },
  },
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function readTemplateFile(file) {
  if (binaryExtensions.has(extname(file))) {
    return `base64::${readFileSync(file).toString('base64')}`
  }

  const contents = readFileSync(file, 'utf8').toString()
  if (file.endsWith('.ejs')) {
    registerTemplate(contents)
  }

  return contents
}

function toCleanPath(file, baseDir) {
  return relative(baseDir, file).replace(/\\/g, '/')
}

function findFilesRecursively(baseDir) {
  const files = {}

  if (!existsSync(baseDir)) {
    return files
  }

  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = resolve(dir, entry.name)
      if (entry.isDirectory()) {
        visit(file)
      } else {
        files[toCleanPath(file, baseDir)] = readTemplateFile(file)
      }
    }
  }

  visit(baseDir)

  return files
}

function scanProjectDirectory(frameworkDir) {
  const projectDirectory = join(frameworkDir, 'project')
  const baseDirectory = join(projectDirectory, 'base')
  const basePackagePath = join(baseDirectory, 'package.json')
  const optionalPackagesPath = join(projectDirectory, 'packages.json')

  return {
    base: findFilesRecursively(baseDirectory),
    basePackageJSON: existsSync(basePackagePath) ? readJson(basePackagePath) : {},
    optionalPackages: existsSync(optionalPackagesPath)
      ? readJson(optionalPackagesPath)
      : {},
  }
}

function scanCatalogDirectory(addOnsBase) {
  if (!existsSync(addOnsBase)) {
    return []
  }

  const addOns = []

  for (const entry of readdirSync(addOnsBase, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue
    }

    const addOnDir = join(addOnsBase, entry.name)
    const info = readJson(join(addOnDir, 'info.json'))

    let packageAdditions = {}
    let packageTemplate
    const packageJsonPath = join(addOnDir, 'package.json')
    const packageTemplatePath = join(addOnDir, 'package.json.ejs')
    if (existsSync(packageJsonPath)) {
      packageAdditions = readJson(packageJsonPath)
    } else if (existsSync(packageTemplatePath)) {
      packageTemplate = readFileSync(packageTemplatePath, 'utf8')
      registerTemplate(packageTemplate)
    }

    let readme
    let readmeIsEjs = false
    const readmePath = join(addOnDir, 'README.md')
    const readmeTemplatePath = join(addOnDir, 'README.md.ejs')
    if (existsSync(readmePath)) {
      readme = readFileSync(readmePath, 'utf8')
    } else if (existsSync(readmeTemplatePath)) {
      readme = readFileSync(readmeTemplatePath, 'utf8')
      registerTemplate(readme)
      readmeIsEjs = true
    }

    let smallLogo
    const smallLogoPath = join(addOnDir, 'small-logo.svg')
    if (existsSync(smallLogoPath)) {
      smallLogo = readFileSync(smallLogoPath, 'utf8')
    }

    addOns.push({
      ...info,
      id: entry.name,
      version: info.version ?? '0.0.0',
      packageAdditions,
      packageTemplate,
      readme,
      readmeIsEjs,
      files: findFilesRecursively(join(addOnDir, 'assets')),
      deletedFiles: info.deletedFiles ?? [],
      smallLogo,
    })
  }

  return addOns
}

function createFramework(frameworkId) {
  const frameworkDir = join(frameworksDir, frameworkId)
  const project = scanProjectDirectory(frameworkDir)

  return {
    ...frameworkMetadata[frameworkId],
    ...project,
    addOns: [
      ...scanCatalogDirectory(join(frameworkDir, 'add-ons')),
      ...scanCatalogDirectory(join(frameworkDir, 'toolchains')),
      ...scanCatalogDirectory(join(frameworkDir, 'examples')),
      ...scanCatalogDirectory(join(frameworkDir, 'hosts')),
    ],
  }
}

function getTemplateKey(template) {
  let hash = 0x811c9dc5
  for (let i = 0; i < template.length; i++) {
    hash ^= template.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }

  return `${hash.toString(16).padStart(8, '0')}:${template.length}`
}

function registerTemplate(template) {
  const key = getTemplateKey(template)
  if (!templateRenderers.has(key)) {
    templateRenderers.set(key, compileTemplate(template))
  }
}

function stripSemicolon(code) {
  return code.replace(/;(\s*$)/, '$1')
}

function compileTemplate(template) {
  const regex = /<%([=_#-]?|_)?([\s\S]*?)([-_]?%>)/g
  let cursor = 0
  let trimLeadingWhitespace = false
  const lines = []

  function appendText(value) {
    if (!value) {
      return
    }
    lines.push(`  __append(${JSON.stringify(value)})`)
  }

  for (const match of template.matchAll(regex)) {
    let text = template.slice(cursor, match.index)
    if (trimLeadingWhitespace) {
      text = text.replace(/^\s*\r?\n?/, '')
      trimLeadingWhitespace = false
    }
    if (match[1] === '_') {
      text = text.replace(/\s*$/, '')
    }
    appendText(text)

    const marker = match[1] || ''
    const code = match[2]
    const close = match[3]

    if (marker === '=') {
      lines.push(`  __append(__escapeXML(${stripSemicolon(code.trim())}))`)
    } else if (marker === '-') {
      lines.push(`  __append(${stripSemicolon(code.trim())})`)
    } else if (marker !== '#') {
      lines.push(code)
    }

    trimLeadingWhitespace = close.startsWith('-') || close.startsWith('_')
    cursor = match.index + match[0].length
  }

  let tail = template.slice(cursor)
  if (trimLeadingWhitespace) {
    tail = tail.replace(/^\s*\r?\n?/, '')
  }
  appendText(tail)

  return lines.join('\n')
}

function createTemplateRendererSource() {
  const entries = Array.from(templateRenderers.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  )

  const functions = entries
    .map(([key, body]) => {
      const functionName = `__render_${key.replace(/[^a-zA-Z0-9_$]/g, '_')}`
      return `function ${functionName}(context: TemplateRenderContext) {
  const {
    packageManager,
    projectName,
    typescript,
    tailwind,
    js,
    jsx,
    fileRouter,
    codeRouter,
    routerOnly,
    includeExamples,
    addOnEnabled,
    addOnOption,
    addOns,
    integrations,
    routes,
    getPackageManagerAddScript,
    getPackageManagerRunScript,
    getPackageManagerExecuteScript,
    relativePath,
    integrationImportContent,
    integrationImportCode,
    renderTemplate,
    ignoreFile,
  } = context
  let __output = ''
  const __append = (value: unknown) => {
    if (value !== undefined && value !== null) {
      __output += String(value)
    }
  }
${body}
  return __output
}`
    })
    .join('\n\n')

  const mapEntries = entries
    .map(([key]) => {
      const functionName = `__render_${key.replace(/[^a-zA-Z0-9_$]/g, '_')}`
      return `  ${JSON.stringify(key)}: ${functionName},`
    })
    .join('\n')

  return `type TemplateRecord = Record<string, any>
type TemplateAddOn = TemplateRecord & {
  integrations?: Array<TemplateRecord>
  routes?: Array<TemplateRecord>
}

type TemplateRenderContext = {
  [key: string]: any
  packageManager: any
  projectName: any
  typescript: any
  tailwind: any
  js: any
  jsx: any
  fileRouter: any
  codeRouter: any
  routerOnly: any
  includeExamples: any
  addOnEnabled: Record<string, any>
  addOnOption: Record<string, any>
  addOns: Array<TemplateAddOn>
  integrations: Array<TemplateRecord>
  routes: Array<TemplateRecord>
  getPackageManagerAddScript: (...args: Array<any>) => string
  getPackageManagerRunScript: (...args: Array<any>) => string
  getPackageManagerExecuteScript: (...args: Array<any>) => string
  relativePath: (...args: Array<any>) => string
  integrationImportContent: (...args: Array<any>) => string
  integrationImportCode: (...args: Array<any>) => string
  renderTemplate: (content: string) => string
  ignoreFile: () => never
}

type TemplateRenderer = (context: TemplateRenderContext) => string | undefined

function __escapeXML(value: unknown) {
  if (value === undefined || value === null) {
    return ''
  }
  return String(value).replace(/[&<>'"]/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&#34;'
      case "'":
        return '&#39;'
      default:
        return character
    }
  })
}

export function getManifestTemplateKey(template: string) {
  let hash = 0x811c9dc5
  for (let i = 0; i < template.length; i++) {
    hash ^= template.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }

  return \`\${hash.toString(16).padStart(8, '0')}:\${template.length}\`
}

${functions}

const templateRenderers: Record<string, TemplateRenderer> = {
${mapEntries}
}

export function renderManifestTemplate(
  template: string,
  context: TemplateRenderContext,
) {
  const key = getManifestTemplateKey(template)
  const renderer = templateRenderers[key]
  if (!renderer) {
    throw new Error(\`Template \${key} was not precompiled into the manifest\`)
  }
  return renderer(context) ?? ''
}
`
}

const manifest = [createFramework('react'), createFramework('solid')]

mkdirSync(dirname(outputFile), { recursive: true })
writeFileSync(
  outputFile,
  `// Generated by scripts/generate-manifest.mjs. Do not edit by hand.\n` +
    `import type { ManifestFrameworkDefinition } from '../manifest-types.js'\n\n` +
    createTemplateRendererSource() +
    '\n' +
    `export const createManifestFrameworks = (): Array<ManifestFrameworkDefinition> => ${JSON.stringify(
      manifest,
      null,
      2,
    )}\n`,
)
