import type { AddOn, BundlerDefinition, Framework, Options } from './types.js'

export const VITE_BUNDLER: BundlerDefinition = {
  id: 'vite',
  name: 'Vite',
  description: 'Build with Vite',
}

export function getBundlers(framework: Framework): Array<BundlerDefinition> {
  return framework.bundlers?.length ? framework.bundlers : [VITE_BUNDLER]
}

export function getDefaultBundler(framework: Framework): BundlerDefinition {
  const bundlers = getBundlers(framework)
  return (
    bundlers.find((bundler) => bundler.id === framework.defaultBundler) ??
    bundlers.find((bundler) => bundler.id === VITE_BUNDLER.id) ??
    bundlers[0]
  )
}

export function resolveBundler(
  framework: Framework,
  bundlerId?: string,
): BundlerDefinition {
  const bundlers = getBundlers(framework)
  const requested = bundlerId ?? getDefaultBundler(framework).id
  const bundler =
    bundlers.find((item) => item.id === requested) ??
    bundlers.find((item) => item.id.toLowerCase() === requested.toLowerCase())

  if (!bundler) {
    throw new Error(
      `Build tool "${requested}" is not supported by ${framework.name}. Supported build tools: ${bundlers.map((item) => item.id).join(', ')}`,
    )
  }

  return bundler
}

export function isAddOnSupportedByBundler(
  addOn: Pick<AddOn, 'type' | 'integrations'>,
  bundlerId: string,
) {
  return (
    bundlerId !== 'rsbuild' ||
    addOn.type === 'toolchain' ||
    (addOn.type === 'deployment' &&
      addOn.integrations?.some(
        (integration) => integration.type === 'rsbuild-plugin',
      ) === true)
  )
}

export function assertAddOnSupportedByBundler(
  addOn: Pick<AddOn, 'id' | 'name' | 'type' | 'integrations'>,
  bundlerId: string,
) {
  if (!isAddOnSupportedByBundler(addOn, bundlerId)) {
    throw new Error(
      `Rsbuild supports toolchains and deployment adapters with an Rsbuild integration only. "${addOn.id}" (${addOn.name}) is not supported.`,
    )
  }
}

export function normalizeAndValidateBundlerOptions(options: Options): Options {
  const bundler = resolveBundler(options.framework, options.bundler).id

  if (bundler === 'rsbuild' && options.starter) {
    throw new Error('Rsbuild does not currently support templates.')
  }

  for (const addOn of options.chosenAddOns) {
    assertAddOnSupportedByBundler(addOn, bundler)
  }

  if (bundler === 'rsbuild') {
    const deployments = options.chosenAddOns.filter(
      (addOn) => addOn.type === 'deployment',
    )
    if (deployments.length > 1) {
      throw new Error('Only one deployment adapter can be selected.')
    }
    if (options.routerOnly && deployments.length > 0) {
      throw new Error('Rsbuild deployment adapters require TanStack Start.')
    }
  }

  return {
    ...options,
    bundler,
  }
}
