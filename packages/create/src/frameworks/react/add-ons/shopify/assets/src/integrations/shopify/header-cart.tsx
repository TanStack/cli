import { Link } from '@tanstack/react-router'

import { useCart } from '#/hooks/use-cart'

export default function ShopifyHeaderCart() {
  const { totalQuantity } = useCart()
  return (
    <Link
      to="/shop/cart"
      className="relative inline-flex items-center justify-center rounded-xl p-2 transition hover:bg-[var(--storefront-line)]/40"
      aria-label={`Cart, ${totalQuantity} item${totalQuantity === 1 ? '' : 's'}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 4h2.5l1.5 12.5a1.5 1.5 0 0 0 1.5 1.3h9.4a1.5 1.5 0 0 0 1.5-1.2L21 7H6"
        />
        <circle cx="9" cy="20.5" r="1.2" />
        <circle cx="18" cy="20.5" r="1.2" />
      </svg>
      {totalQuantity > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-[var(--storefront-accent,#0a0a0a)] px-1 text-[10px] font-semibold leading-[1.1rem] text-[var(--storefront-accent-fg,#fff)]">
          {totalQuantity}
        </span>
      )}
    </Link>
  )
}
