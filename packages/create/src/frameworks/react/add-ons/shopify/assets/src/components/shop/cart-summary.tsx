import { useState } from 'react'

import { Money } from '#/components/shop/money'
import {
  useApplyDiscountCode,
  useRemoveDiscountCode,
} from '#/hooks/use-cart'
import type { CartDetail } from '#/lib/shopify/queries'

type CartSummaryProps = {
  cart: CartDetail
}

export function CartSummary({ cart }: CartSummaryProps) {
  const [code, setCode] = useState('')
  const apply = useApplyDiscountCode()
  const remove = useRemoveDiscountCode()
  const appliedCode = cart.discountCodes.find((c) => c.applicable)

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-[var(--storefront-line)] p-6">
      <h2 className="text-lg font-medium">Order summary</h2>

      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <Money
          amount={cart.cost.subtotalAmount.amount}
          currencyCode={cart.cost.subtotalAmount.currencyCode}
        />
      </div>
      {cart.cost.totalTaxAmount && Number(cart.cost.totalTaxAmount.amount) > 0 && (
        <div className="flex justify-between text-sm text-[var(--storefront-fg-muted)]">
          <span>Estimated tax</span>
          <Money
            amount={cart.cost.totalTaxAmount.amount}
            currencyCode={cart.cost.totalTaxAmount.currencyCode}
          />
        </div>
      )}
      <p className="text-sm text-[var(--storefront-fg-muted)]">
        Shipping calculated at checkout.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim()) {
            apply.mutate(
              { code: code.trim() },
              { onSuccess: () => setCode('') },
            )
          }
        }}
        className="flex flex-col gap-2"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Discount code"
            className="min-w-0 flex-1 rounded-full border border-[var(--storefront-line)] bg-transparent px-4 py-2 text-sm focus:border-[var(--storefront-accent)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={apply.isPending || !code.trim()}
            className="rounded-full border border-[var(--storefront-line)] px-4 py-2 text-sm font-medium hover:border-[var(--storefront-accent)] disabled:opacity-40"
          >
            Apply
          </button>
        </div>
        {apply.error && (
          <p className="text-xs text-red-600">{(apply.error as Error).message}</p>
        )}
        {appliedCode && (
          <div className="flex items-center justify-between rounded-full bg-[var(--storefront-line)]/40 px-4 py-2 text-xs">
            <span>
              Applied: <strong>{appliedCode.code}</strong>
            </span>
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              className="underline underline-offset-2 disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        )}
      </form>

      <div className="flex justify-between border-t border-[var(--storefront-line)] pt-4 text-base font-medium">
        <span>Total</span>
        <Money
          amount={cart.cost.totalAmount.amount}
          currencyCode={cart.cost.totalAmount.currencyCode}
        />
      </div>

      <a
        href={cart.checkoutUrl}
        className="block w-full rounded-full bg-[var(--storefront-accent)] px-6 py-3.5 text-center text-sm font-medium text-[var(--storefront-accent-fg)] no-underline transition hover:opacity-90"
      >
        Checkout
      </a>
      <p className="text-center text-xs text-[var(--storefront-fg-muted)]">
        Secure checkout powered by Shopify
      </p>
    </aside>
  )
}
