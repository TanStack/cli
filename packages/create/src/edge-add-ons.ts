import { AddOnCompiledSchema } from './types.js'

import type { AddOn, Framework } from './types.js'

export function getAllAddOns(framework: Framework, mode: string): Array<AddOn> {
  return framework
    .getAddOns()
    .filter((a) => a.modes.includes(mode))
    .sort((a, b) => {
      const aPriority = a.priority ?? 0
      const bPriority = b.priority ?? 0
      return bPriority - aPriority
    })
}

export async function finalizeAddOns(
  framework: Framework,
  mode: string,
  chosenAddOnIDs: Array<string>,
): Promise<Array<AddOn>> {
  const finalAddOnIDs = new Set(chosenAddOnIDs)
  const addOns = getAllAddOns(framework, mode)

  for (const addOnID of finalAddOnIDs) {
    let addOn: AddOn | undefined
    const localAddOn =
      addOns.find((a) => a.id === addOnID) ??
      addOns.find((a) => a.id.toLowerCase() === addOnID.toLowerCase())

    if (localAddOn) {
      addOn = localAddOn
      if (localAddOn.id !== addOnID) {
        finalAddOnIDs.delete(addOnID)
        finalAddOnIDs.add(localAddOn.id)
      }
    } else if (addOnID.startsWith('http')) {
      addOn = await loadRemoteAddOn(addOnID)
      addOns.push(addOn)
    } else {
      const suggestion = findClosestAddOn(addOnID, addOns)
      throw new Error(
        `Add-on ${addOnID} not found${suggestion ? `. Did you mean "${suggestion}"?` : ''}`,
      )
    }

    for (const dependsOn of addOn.dependsOn || []) {
      const dep = addOns.find((a) => a.id === dependsOn)
      if (!dep) {
        throw new Error(`Dependency ${dependsOn} not found`)
      }
      finalAddOnIDs.add(dep.id)
    }
  }

  return [...finalAddOnIDs].map((id) => addOns.find((a) => a.id === id)!)
}

export function populateAddOnOptionsDefaults(
  chosenAddOns: Array<AddOn>,
): Record<string, Record<string, unknown>> {
  const addOnOptions: Record<string, Record<string, unknown>> = {}

  for (const addOn of chosenAddOns) {
    if (addOn.options) {
      const defaults: Record<string, unknown> = {}
      for (const [optionKey, optionDef] of Object.entries(addOn.options)) {
        defaults[optionKey] = optionDef.default
      }
      addOnOptions[addOn.id] = defaults
    }
  }

  return addOnOptions
}

export async function loadRemoteAddOn(url: string): Promise<AddOn> {
  const response = await fetch(url)
  const jsonContent = await response.json()
  const checked = AddOnCompiledSchema.safeParse(jsonContent)

  if (!checked.success) {
    throw new Error(`Invalid add-on: ${url}`)
  }

  const addOn = {
    ...checked.data,
    id: url,
  }

  return {
    ...addOn,
    getFiles: () => Promise.resolve(Object.keys(addOn.files)),
    getFileContents: (path: string) => Promise.resolve(addOn.files[path]),
    getDeletedFiles: () => Promise.resolve(addOn.deletedFiles),
  }
}

function findClosestAddOn(
  input: string,
  addOns: Array<AddOn>,
): string | undefined {
  const inputLower = input.toLowerCase()
  let bestMatch: string | undefined
  let bestDistance = Infinity

  for (const addOn of addOns) {
    const distance = levenshtein(inputLower, addOn.id.toLowerCase())
    if (distance < bestDistance) {
      bestDistance = distance
      bestMatch = addOn.id
    }
  }

  if (bestMatch && bestDistance <= Math.max(Math.floor(input.length / 2), 2)) {
    return bestMatch
  }

  return undefined
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  let prev = Array.from({ length: n + 1 }, (_, j) => j)

  for (let i = 1; i <= m; i++) {
    const curr = [i]
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1])
    }
    prev = curr
  }

  return prev[n]
}
