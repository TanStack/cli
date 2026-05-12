import { useAddToCart } from '#/hooks/use-cart'
import type { ProductDetail, ProductDetailVariant } from '#/lib/shopify/queries'

type AddToCartButtonProps = {
  product: ProductDetail
  variant: ProductDetailVariant | undefined
  quantity?: number
}

export function AddToCartButton({
  product,
  variant,
  quantity = 1,
}: AddToCartButtonProps) {
  const { mutate, isPending } = useAddToCart()
  const disabled = !variant || !variant.availableForSale || isPending

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!variant) return
        mutate({
          variantId: variant.id,
          quantity,
          line: {
            productTitle: product.title,
            productHandle: product.handle,
            variantTitle: variant.title,
            price: variant.price,
            image: variant.image ?? product.images.nodes[0] ?? null,
            selectedOptions: variant.selectedOptions,
          },
        })
      }}
      className="w-full rounded-full bg-[var(--storefront-accent)] px-6 py-3.5 text-sm font-medium text-[var(--storefront-accent-fg)] transition disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
    >
      {!variant
        ? 'Select options'
        : !variant.availableForSale
          ? 'Sold out'
          : isPending
            ? 'Adding…'
            : 'Add to cart'}
    </button>
  )
}
