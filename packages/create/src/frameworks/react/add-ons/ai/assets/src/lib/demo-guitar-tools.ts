import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import guitars from '#/data/demo-guitars'

// Tool definition for getting guitars
export const getGuitarsToolDef = toolDefinition({
  name: 'getGuitars',
  description: 'Get all products from the database',
  inputSchema: z.object({}),
  outputSchema: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      image: z.string(),
      description: z.string(),
      shortDescription: z.string(),
      price: z.number(),
    }),
  ),
})

// Server implementation
export const getGuitars = getGuitarsToolDef.server(() => guitars)

// Tool definition for guitar recommendation
export const recommendGuitarToolDef = toolDefinition({
  name: 'recommendGuitar',
  description:
    'REQUIRED tool to display a guitar recommendation to the user. This tool MUST be used whenever recommending a guitar - do NOT write recommendations yourself. This displays the guitar in a special appealing format with a buy button.',
  inputSchema: z.object({
    id: z
      .union([z.string(), z.number()])
      .describe(
        'The ID of the guitar to recommend (from the getGuitars results)',
      ),
  }),
  outputSchema: z.object({
    id: z.number(),
  }),
})
