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
  addOn: Pick<AddOn, 'type'>,
  bundlerId: string,
) {
  return bundlerId !== 'rsbuild' || addOn.type === 'toolchain'
}

export function assertAddOnSupportedByBundler(
  addOn: Pick<AddOn, 'id' | 'name' | 'type'>,
  bundlerId: string,
) {
  if (!isAddOnSupportedByBundler(addOn, bundlerId)) {
    throw new Error(
      `Rsbuild currently supports toolchain add-ons only. "${addOn.id}" (${addOn.name}) is a ${addOn.type} add-on.`,
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

  return {
    ...options,
    bundler,
  }
}
