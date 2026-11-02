import { randomUUID } from 'node:crypto'

import type { AddOn } from '@tanstack/create'

type PartnerTier = NonNullable<AddOn['partner']>['tier']

const partnerTierOrder = {
  gold: 0,
  silver: 1,
  bronze: 2,
} satisfies Record<PartnerTier, number>

const cliSessionSeed = randomUUID()

function hashString(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function compareIdentity(left: AddOn, right: AddOn) {
  const nameComparison = left.name.localeCompare(right.name)
  return nameComparison || left.id.localeCompare(right.id)
}

function compareSeededPartnerOrder(left: AddOn, right: AddOn, seed: string) {
  const leftWeight = left.partner!.placementWeight ?? 1
  const rightWeight = right.partner!.placementWeight ?? 1
  const leftRandom =
    (hashString(`${seed}:${left.partner!.id}`) + 1) / 4294967297
  const rightRandom =
    (hashString(`${seed}:${right.partner!.id}`) + 1) / 4294967297
  const seededComparison =
    -Math.log(leftRandom) / leftWeight + Math.log(rightRandom) / rightWeight

  return seededComparison || compareIdentity(left, right)
}

export function orderAddOnsForPartnerPlacement(
  addOns: Array<AddOn>,
  surface: string,
  sessionSeed = cliSessionSeed,
) {
  const rotationSeed = `${surface}:${sessionSeed}`
  const partners = addOns
    .filter((addOn) => addOn.partner)
    .sort((left, right) => {
      const tierComparison =
        partnerTierOrder[left.partner!.tier] -
        partnerTierOrder[right.partner!.tier]

      if (tierComparison !== 0) {
        return tierComparison
      }

      if (surface === 'deployment' && left.partner!.id === 'cloudflare') {
        return -1
      }

      if (surface === 'deployment' && right.partner!.id === 'cloudflare') {
        return 1
      }

      return compareSeededPartnerOrder(left, right, rotationSeed)
    })
  const nonPartners = addOns.filter((addOn) => !addOn.partner)

  return [...partners, ...nonPartners]
}
