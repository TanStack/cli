import { z } from 'zod'
import { loadRemoteAddOn } from './custom-add-ons/add-on.js'
import { loadStarter } from './custom-add-ons/starter.js'
import { handleSpecialURL } from './utils.js'

import type { AddOn, Starter } from './types.js'

const registrySchema = z.object({
  templates: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        url: z.string(),
        banner: z.string().optional(),
        mode: z.string(),
        framework: z.string(),
      }),
    )
    .optional(),
  starters: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        url: z.string(),
        banner: z.string().optional(),
        mode: z.string(),
        framework: z.string(),
      }),
    )
    .optional(),
  'add-ons': z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        url: z.string(),
        modes: z.array(z.string()),
        framework: z.string(),
      }),
    )
    .optional(),
})

export type Registry = z.infer<typeof registrySchema>

function absolutizeUrl(originalUrl: string, relativeUrl: string) {
  if (relativeUrl.startsWith('http') || relativeUrl.startsWith('https')) {
    return relativeUrl
  }
  const baseUrl = originalUrl.replace(/registry.json$/, '')
  return `${baseUrl}${relativeUrl.replace(/^\.\//, '')}`
}

export async function getRawRegistry(
  registryUrl?: string,
): Promise<Registry | undefined> {
  const regUrl = registryUrl || process.env.CTA_REGISTRY
  if (regUrl) {
    const url = handleSpecialURL(regUrl)
    const registry = (await fetch(url).then((res) => res.json())) as Registry
    const parsedRegistry = registrySchema.parse(registry)

    if (!parsedRegistry.starters && parsedRegistry.templates) {
      parsedRegistry.starters = parsedRegistry.templates
    }

    if (!parsedRegistry.templates && parsedRegistry.starters) {
      parsedRegistry.templates = parsedRegistry.starters
    }

    for (const addOn of parsedRegistry['add-ons'] || []) {
      addOn.url = absolutizeUrl(url, addOn.url)
    }
    for (const template of parsedRegistry.templates || []) {
      template.url = absolutizeUrl(url, template.url)
      if (template.banner) {
        template.banner = absolutizeUrl(url, template.banner)
      }
    }

    parsedRegistry.starters = parsedRegistry.templates

    return parsedRegistry
  }
}

async function getAddOns(registry: Registry): Promise<Array<AddOn>> {
  const addOns: Array<AddOn> = []
  for (const addOnInfo of registry['add-ons'] || []) {
    const addOn = await loadRemoteAddOn(addOnInfo.url)
    addOns.push(addOn)
  }
  return addOns
}

export async function getRegistryAddOns(
  registryUrl?: string,
): Promise<Array<AddOn>> {
  const registry = await getRawRegistry(registryUrl)
  return registry ? await getAddOns(registry) : []
}

async function getStarters(registry: Registry): Promise<Array<Starter>> {
  const starters: Array<Starter> = []
  for (const starterInfo of registry.starters || []) {
    const starter = await loadStarter(starterInfo.url)
    starters.push(starter)
  }
  return starters
}

export async function getRegistryStarters(
  registryUrl?: string,
): Promise<Array<Starter>> {
  const registry = await getRawRegistry(registryUrl)
  return registry ? await getStarters(registry) : []
}

export async function getRegistry(registryUrl?: string): Promise<{
  addOns: Array<AddOn>
  starters: Array<Starter>
}> {
  const registry = await getRawRegistry(registryUrl)
  return {
    addOns: registry ? await getAddOns(registry) : [],
    starters: registry ? await getStarters(registry) : [],
  }
}
