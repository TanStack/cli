import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'

export const CART_COOKIE_NAME = 'tanstack_cart_id'

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

const cartCookieOptions = () => ({
  path: '/' as const,
  maxAge: ONE_YEAR_SECONDS,
  sameSite: 'lax' as const,
  httpOnly: true,
  secure: import.meta.env.PROD,
})

export function getCartId() {
  return getCookie(CART_COOKIE_NAME)
}

export function setCartId(id: string) {
  setCookie(CART_COOKIE_NAME, id, cartCookieOptions())
}

export function clearCartId() {
  deleteCookie(CART_COOKIE_NAME, { path: '/' })
}
