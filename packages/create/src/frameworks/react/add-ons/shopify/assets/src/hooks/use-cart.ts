import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Image as StorefrontImage,
  MoneyV2,
} from '@shopify/hydrogen-react/storefront-api-types'

import {
  addToCart,
  applyDiscountCode,
  getCart,
  removeCartLine,
  removeDiscountCode,
  updateCartLine,
} from '#/server/shopify/cart.functions'
import type { CartDetail, CartLineDetail } from '#/lib/shopify/queries'

/**
 * Shared React Query key for the current user's cart.
 *
 * The cart ID lives in an httpOnly cookie on the server, so the client never
 * needs to know it — a single cache key is enough. Route loaders can prefetch
 * into this key so the first render already has the data.
 */
export const CART_QUERY_KEY = ['shopify', 'cart'] as const

const CART_MUTATION_KEY = ['shopify', 'cart', 'mutate'] as const

/**
 * Explicit in-flight counter. We don't rely on `queryClient.isMutating()`
 * because its semantics at `onSettled` time vary across React Query versions.
 * A module-level counter is unambiguous: increment in onMutate, decrement in
 * onSettled, invalidate when the count hits zero.
 *
 * @see https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query
 */
let cartMutationsInFlight = 0

function trackMutationStart() {
  cartMutationsInFlight++
}

function settleWhenIdle(qc: ReturnType<typeof useQueryClient>) {
  cartMutationsInFlight = Math.max(0, cartMutationsInFlight - 1)
  if (cartMutationsInFlight === 0) {
    return qc.invalidateQueries({ queryKey: CART_QUERY_KEY })
  }
}

export function useCart() {
  const query = useQuery<CartDetail | null>({
    queryKey: CART_QUERY_KEY,
    queryFn: () => getCart(),
    staleTime: 30_000,
  })

  return {
    cart: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    totalQuantity: query.data?.totalQuantity ?? 0,
  }
}

type AddToCartLineSnapshot = {
  productTitle: string
  productHandle: string
  variantTitle: string
  price: Pick<MoneyV2, 'amount' | 'currencyCode'>
  image: Pick<StorefrontImage, 'url' | 'altText' | 'width' | 'height'> | null
  selectedOptions: Array<{ name: string; value: string }>
}

type AddToCartInput = {
  variantId: string
  quantity?: number
  /** Product snapshot for optimistic line rendering. */
  line?: AddToCartLineSnapshot
}

export function useAddToCart() {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: (input: AddToCartInput) =>
      addToCart({
        data: { variantId: input.variantId, quantity: input.quantity ?? 1 },
      }),

    onMutate: async (input) => {
      trackMutationStart()
      const quantity = input.quantity ?? 1
      await qc.cancelQueries({ queryKey: CART_QUERY_KEY })
      const previous = qc.getQueryData<CartDetail | null>(CART_QUERY_KEY)

      if (previous && input.line) {
        const snap = input.line
        const existingIdx = previous.lines.nodes.findIndex(
          (l) => l.merchandise.id === input.variantId,
        )

        let nextLines: CartDetail['lines']['nodes']
        if (existingIdx >= 0) {
          nextLines = previous.lines.nodes.map((l, i) =>
            i === existingIdx ? { ...l, quantity: l.quantity + quantity } : l,
          )
        } else {
          const lineTotal = String(Number(snap.price.amount) * quantity)
          nextLines = [
            {
              id: `optimistic-${Date.now()}`,
              quantity,
              merchandise: {
                id: input.variantId,
                title: snap.variantTitle,
                availableForSale: true,
                selectedOptions: snap.selectedOptions,
                price: snap.price,
                image: snap.image,
                product: {
                  handle: snap.productHandle,
                  title: snap.productTitle,
                },
              },
              cost: {
                totalAmount: {
                  amount: lineTotal,
                  currencyCode: snap.price.currencyCode,
                },
              },
            } satisfies CartLineDetail,
            ...previous.lines.nodes,
          ]
        }

        qc.setQueryData<CartDetail | null>(CART_QUERY_KEY, {
          ...previous,
          totalQuantity: nextLines.reduce((s, l) => s + l.quantity, 0),
          lines: { ...previous.lines, nodes: nextLines },
        })
      } else if (previous) {
        qc.setQueryData<CartDetail | null>(CART_QUERY_KEY, {
          ...previous,
          totalQuantity: (previous.totalQuantity ?? 0) + quantity,
        })
      }

      return { previous }
    },

    onError: (_err, _input, ctx) => {
      if (ctx?.previous !== undefined)
        qc.setQueryData(CART_QUERY_KEY, ctx.previous)
    },

    onSuccess: (cart) => {
      qc.setQueryData(CART_QUERY_KEY, cart)
    },

    onSettled: () => settleWhenIdle(qc),
  })
}

export function useUpdateCartLine() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: (input: { lineId: string; quantity: number }) =>
      updateCartLine({ data: input }),

    onMutate: async (input) => {
      trackMutationStart()
      await qc.cancelQueries({ queryKey: CART_QUERY_KEY })
      const previous = qc.getQueryData<CartDetail | null>(CART_QUERY_KEY)
      if (previous) {
        const nextLines = previous.lines.nodes.map((line) =>
          line.id === input.lineId
            ? { ...line, quantity: input.quantity }
            : line,
        )
        const nextQty = nextLines.reduce((sum, line) => sum + line.quantity, 0)
        qc.setQueryData<CartDetail | null>(CART_QUERY_KEY, {
          ...previous,
          totalQuantity: nextQty,
          lines: { ...previous.lines, nodes: nextLines },
        })
      }
      return { previous }
    },

    onError: (_err, _input, ctx) => {
      if (ctx?.previous !== undefined)
        qc.setQueryData(CART_QUERY_KEY, ctx.previous)
    },

    onSettled: () => settleWhenIdle(qc),
  })
}

export function useRemoveCartLine() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: (input: { lineId: string }) => removeCartLine({ data: input }),

    onMutate: async (input) => {
      trackMutationStart()
      await qc.cancelQueries({ queryKey: CART_QUERY_KEY })
      const previous = qc.getQueryData<CartDetail | null>(CART_QUERY_KEY)
      if (previous) {
        const nextLines = previous.lines.nodes.filter(
          (line) => line.id !== input.lineId,
        )
        const nextQty = nextLines.reduce((sum, line) => sum + line.quantity, 0)
        qc.setQueryData<CartDetail | null>(CART_QUERY_KEY, {
          ...previous,
          totalQuantity: nextQty,
          lines: { ...previous.lines, nodes: nextLines },
        })
      }
      return { previous }
    },

    onError: (_err, _input, ctx) => {
      if (ctx?.previous !== undefined)
        qc.setQueryData(CART_QUERY_KEY, ctx.previous)
    },

    onSettled: () => settleWhenIdle(qc),
  })
}

export function useApplyDiscountCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: (input: { code: string }) =>
      applyDiscountCode({ data: { code: input.code } }),
    onMutate: async () => {
      trackMutationStart()
      await qc.cancelQueries({ queryKey: CART_QUERY_KEY })
    },
    onSuccess: (cart) => {
      qc.setQueryData(CART_QUERY_KEY, cart)
    },
    onSettled: () => settleWhenIdle(qc),
  })
}

export function useRemoveDiscountCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: () => removeDiscountCode(),
    onMutate: async () => {
      trackMutationStart()
      await qc.cancelQueries({ queryKey: CART_QUERY_KEY })
      const previous = qc.getQueryData<CartDetail | null>(CART_QUERY_KEY)
      if (previous) {
        qc.setQueryData<CartDetail | null>(CART_QUERY_KEY, {
          ...previous,
          discountCodes: [],
        })
      }
      return { previous }
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous !== undefined)
        qc.setQueryData(CART_QUERY_KEY, ctx.previous)
    },
    onSettled: () => settleWhenIdle(qc),
  })
}
