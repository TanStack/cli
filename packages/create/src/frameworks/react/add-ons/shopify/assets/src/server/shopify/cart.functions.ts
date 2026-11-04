import { createServerFn } from '@tanstack/react-start'
import { setResponseHeaders } from '@tanstack/react-start/server'
import * as v from 'valibot'

import { clearCartId, getCartId, setCartId } from '#/server/shopify/cookies'
import { shopifyServerFetch } from '#/server/shopify/storefront-client'
import {
  CART_CREATE_MUTATION,
  CART_DISCOUNT_CODES_UPDATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
  type CartCreateResult,
  type CartDetail,
  type CartDiscountCodesUpdateResult,
  type CartLinesAddResult,
  type CartLinesRemoveResult,
  type CartLinesUpdateResult,
  type CartQueryResult,
  type CartUserError,
} from '#/lib/shopify/queries'

export class CartUserErrorsError extends Error {
  constructor(public readonly userErrors: Array<CartUserError>) {
    super(userErrors.map((e) => e.message).join('\n'))
    this.name = 'CartUserErrorsError'
  }
}

function throwIfUserErrors(errs: Array<CartUserError>) {
  if (errs.length > 0) throw new CartUserErrorsError(errs)
}

function setCartResponseHeaders() {
  // Cart is per-user; do not edge-cache.
  setResponseHeaders(
    new Headers({ 'Cache-Control': 'private, no-store, must-revalidate' }),
  )
}

async function fetchCartById(cartId: string): Promise<CartDetail | null> {
  const result = await shopifyServerFetch<CartQueryResult, { cartId: string }>({
    query: CART_QUERY,
    variables: { cartId },
  })
  return result.cart
}

export const getCart = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CartDetail | null> => {
    setCartResponseHeaders()
    const cartId = getCartId()
    if (!cartId) return null

    const cart = await fetchCartById(cartId)
    // If Shopify pruned the cart (expired/abandoned), clear the stale cookie.
    if (!cart) clearCartId()
    return cart
  },
)

export const addToCart = createServerFn({ method: 'POST' })
  .inputValidator(
    v.object({
      variantId: v.string(),
      quantity: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
    }),
  )
  .handler(async ({ data }): Promise<CartDetail> => {
    setCartResponseHeaders()
    const existingCartId = getCartId()

    if (!existingCartId) {
      const result = await shopifyServerFetch<CartCreateResult>({
        query: CART_CREATE_MUTATION,
        variables: {
          input: {
            lines: [
              { merchandiseId: data.variantId, quantity: data.quantity },
            ],
          },
        },
      })
      throwIfUserErrors(result.cartCreate.userErrors)
      const cart = result.cartCreate.cart
      if (!cart) throw new Error('Shopify returned no cart after create.')
      setCartId(cart.id)
      return cart
    }

    const result = await shopifyServerFetch<CartLinesAddResult>({
      query: CART_LINES_ADD_MUTATION,
      variables: {
        cartId: existingCartId,
        lines: [{ merchandiseId: data.variantId, quantity: data.quantity }],
      },
    })
    throwIfUserErrors(result.cartLinesAdd.userErrors)
    const cart = result.cartLinesAdd.cart
    // Existing cart was pruned between requests — recover by creating fresh.
    if (!cart) {
      clearCartId()
      const createResult = await shopifyServerFetch<CartCreateResult>({
        query: CART_CREATE_MUTATION,
        variables: {
          input: {
            lines: [{ merchandiseId: data.variantId, quantity: data.quantity }],
          },
        },
      })
      throwIfUserErrors(createResult.cartCreate.userErrors)
      const newCart = createResult.cartCreate.cart
      if (!newCart)
        throw new Error('Shopify returned no cart after recovery create.')
      setCartId(newCart.id)
      return newCart
    }
    return cart
  })

export const updateCartLine = createServerFn({ method: 'POST' })
  .inputValidator(
    v.object({
      lineId: v.string(),
      quantity: v.pipe(v.number(), v.integer(), v.minValue(0)),
    }),
  )
  .handler(async ({ data }): Promise<CartDetail> => {
    setCartResponseHeaders()
    const cartId = getCartId()
    if (!cartId) throw new Error('No cart exists to update.')

    const result = await shopifyServerFetch<CartLinesUpdateResult>({
      query: CART_LINES_UPDATE_MUTATION,
      variables: {
        cartId,
        lines: [{ id: data.lineId, quantity: data.quantity }],
      },
    })
    throwIfUserErrors(result.cartLinesUpdate.userErrors)
    const cart = result.cartLinesUpdate.cart
    if (!cart) throw new Error('Shopify returned no cart after update.')
    return cart
  })

export const removeCartLine = createServerFn({ method: 'POST' })
  .inputValidator(v.object({ lineId: v.string() }))
  .handler(async ({ data }): Promise<CartDetail> => {
    setCartResponseHeaders()
    const cartId = getCartId()
    if (!cartId) throw new Error('No cart exists to remove from.')

    const result = await shopifyServerFetch<CartLinesRemoveResult>({
      query: CART_LINES_REMOVE_MUTATION,
      variables: { cartId, lineIds: [data.lineId] },
    })
    throwIfUserErrors(result.cartLinesRemove.userErrors)
    const cart = result.cartLinesRemove.cart
    if (!cart) throw new Error('Shopify returned no cart after remove.')
    return cart
  })

export const applyDiscountCode = createServerFn({ method: 'POST' })
  .inputValidator(v.object({ code: v.pipe(v.string(), v.minLength(1)) }))
  .handler(async ({ data }): Promise<CartDetail> => {
    setCartResponseHeaders()
    const cartId = getCartId()
    if (!cartId) throw new Error('No cart exists to apply a discount to.')
    const result = await shopifyServerFetch<CartDiscountCodesUpdateResult>({
      query: CART_DISCOUNT_CODES_UPDATE_MUTATION,
      variables: { cartId, discountCodes: [data.code] },
    })
    throwIfUserErrors(result.cartDiscountCodesUpdate.userErrors)
    const cart = result.cartDiscountCodesUpdate.cart
    if (!cart)
      throw new Error('Shopify returned no cart after discount update.')
    // Shopify silently drops invalid codes — surface that to the UI.
    const applied = cart.discountCodes.find(
      (c) => c.code.toLowerCase() === data.code.toLowerCase(),
    )
    if (!applied || !applied.applicable) {
      throw new CartUserErrorsError([
        {
          field: null,
          message: `Discount code "${data.code}" is not valid or not applicable to this cart.`,
        },
      ])
    }
    return cart
  })

export const removeDiscountCode = createServerFn({ method: 'POST' }).handler(
  async (): Promise<CartDetail> => {
    setCartResponseHeaders()
    const cartId = getCartId()
    if (!cartId) throw new Error('No cart exists.')
    const result = await shopifyServerFetch<CartDiscountCodesUpdateResult>({
      query: CART_DISCOUNT_CODES_UPDATE_MUTATION,
      variables: { cartId, discountCodes: [] },
    })
    throwIfUserErrors(result.cartDiscountCodesUpdate.userErrors)
    const cart = result.cartDiscountCodesUpdate.cart
    if (!cart) throw new Error('Shopify returned no cart after discount clear.')
    return cart
  },
)
