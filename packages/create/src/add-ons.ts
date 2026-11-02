import { loadRemoteAddOn } from './custom-add-ons/add-on.js'
import {
  assertAddOnSupportedByBundler,
  isAddOnSupportedByBundler,
  resolveBundler,
} from './build-tools.js'

import type { AddOn, Framework } from './types.js'

export function getAllAddOns(framework: Framework, mode: string, bundlerId?: string): Array<AddOn> {
  const bundler = resolveBundler(framework, bundlerId).id
  return framework
    .getAddOns()
    .filter(
      (addOn) =>
        addOn.modes.includes(mode) && isAddOnSupportedByBundler(addOn, bundler),
    )
    .sort((a, b) => {
      const aPriority = a.priority ?? 0
      const bPriority = b.priority ?? 0
      return bPriority - aPriority // Higher priority first
    })
}

// Turn the list of chosen add-on IDs into a final list of add-ons by resolving dependencies
export async function finalizeAddOns(
  framework: Framework,
  mode: string,
  chosenAddOnIDs: Array<string>,
  bundlerId?: string,
): Promise<Array<AddOn>> {
  const bundler = resolveBundler(framework, bundlerId).id
  const finalAddOnIDs = new Set(chosenAddOnIDs)

  const addOns = framework
    .getAddOns()
    .filter((addOn) => addOn.modes.includes(mode))

  for (const addOnID of finalAddOnIDs) {
    let addOn: AddOn | undefined
    const localAddOn =
      addOns.find((a) => a.id === addOnID) ??
      addOns.find((a) => a.id.toLowerCase() === addOnID.toLowerCase())
    if (localAddOn) {
      addOn = loadAddOn(localAddOn)
      if (localAddOn.id !== addOnID) {
        // Replace the mistyped ID with the canonical one
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

    assertAddOnSupportedByBundler(addOn, bundler)

    for (const dependsOn of addOn.dependsOn || []) {
      const dep = addOns.find((a) => a.id === dependsOn)
      if (!dep) {
        throw new Error(`Dependency ${dependsOn} not found`)
      }
      assertAddOnSupportedByBundler(dep, bundler)
      finalAddOnIDs.add(dep.id)
    }
  }

  const finalAddOns = [...finalAddOnIDs].map(
    (id) => addOns.find((a) => a.id === id)!,
  )

  return finalAddOns
}

function loadAddOn(addOn: AddOn): AddOn {
  return addOn
}

function findClosestAddOn(
  input: string,
  addOns: Array<AddOn>,
): string | undefined {
  const inputLower = input.toLowerCase()
  let bestMatch: string | undefined
  let bestDistance = Infinity

  for (const addOn of addOns) {
    const d = levenshtein(inputLower, addOn.id.toLowerCase())
    if (d < bestDistance) {
      bestDistance = d
      bestMatch = addOn.id
    }
  }

  // Only suggest if the distance is reasonable (less than half the input length)
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

export function populateAddOnOptionsDefaults(
  chosenAddOns: Array<AddOn>,
): Record<string, Record<string, any>> {
  const addOnOptions: Record<string, Record<string, any>> = {}

  for (const addOn of chosenAddOns) {
    if (addOn.options) {
      const defaults: Record<string, any> = {}
      for (const [optionKey, optionDef] of Object.entries(addOn.options)) {
        defaults[optionKey] = optionDef.default
      }
      addOnOptions[addOn.id] = defaults
    }
  }

  return addOnOptions
}
