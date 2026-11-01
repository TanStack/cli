import { describe, expect, it } from 'vitest'

import { orderAddOnsForPartnerPlacement } from '../src/partner-placement'

import type { AddOn } from '@tanstack/create'

function addOn(
  id: string,
  partner?: {
    id: string
    tier: 'gold' | 'silver' | 'bronze'
    placementWeight?: number
  },
) {
  return { id, name: id, partner } as AddOn
}

describe('partner placement', () => {
  it('orders partners by tier ahead of non-partners', () => {
    const ordered = orderAddOnsForPartnerPlacement(
      [
        addOn('other'),
        addOn('bronze', { id: 'bronze', tier: 'bronze' }),
        addOn('gold', { id: 'gold', tier: 'gold' }),
        addOn('silver', { id: 'silver', tier: 'silver' }),
      ],
      'add-ons',
      'test',
    )

    expect(ordered.map((item) => item.id)).toEqual([
      'gold',
      'silver',
      'bronze',
      'other',
    ])
  })

  it('rotates partners within a tier from the CLI session seed', () => {
    const partners = [
      addOn('clerk', { id: 'clerk', tier: 'silver' }),
      addOn('workos', { id: 'workos', tier: 'silver' }),
    ]

    expect(
      orderAddOnsForPartnerPlacement(partners, 'add-ons', '0').map(
        (item) => item.id,
      ),
    ).toEqual(['clerk', 'workos'])
    expect(
      orderAddOnsForPartnerPlacement(partners, 'add-ons', '4').map(
        (item) => item.id,
      ),
    ).toEqual(['workos', 'clerk'])
  })

  it('reserves Cloudflare as the first deployment partner', () => {
    const ordered = orderAddOnsForPartnerPlacement(
      [
        addOn('netlify', { id: 'netlify', tier: 'gold' }),
        addOn('cloudflare', { id: 'cloudflare', tier: 'gold' }),
        addOn('railway', { id: 'railway', tier: 'gold' }),
        addOn('render', { id: 'render', tier: 'gold' }),
        addOn('vercel', { id: 'vercel', tier: 'gold' }),
      ],
      'deployment',
      'test',
    )

    expect(ordered[0]?.id).toBe('cloudflare')
    expect(
      ordered
        .slice(1)
        .map((item) => item.id)
        .sort(),
    ).toEqual(['netlify', 'railway', 'render', 'vercel'])
  })
})
