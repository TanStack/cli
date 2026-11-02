import type { ProductDetail, ProductDetailVariant } from '#/lib/shopify/queries'

type VariantSelectorProps = {
  product: ProductDetail
  selectedOptions: Record<string, string>
  onChange: (next: Record<string, string>) => void
}

export function VariantSelector({
  product,
  selectedOptions,
  onChange,
}: VariantSelectorProps) {
  if (product.options.length === 1 && product.options[0]?.values.length === 1) {
    return null
  }

  return (
    <div className="space-y-5">
      {product.options.map((option) => (
        <div key={option.id}>
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-sm font-medium">{option.name}</h3>
            <span className="text-sm text-[var(--storefront-fg-muted)]">
              {selectedOptions[option.name]}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const selected = selectedOptions[option.name] === value
              const wouldBe = { ...selectedOptions, [option.name]: value }
              const matchingVariant = findVariant(product.variants.nodes, wouldBe)
              const available = matchingVariant?.availableForSale ?? false
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange(wouldBe)}
                  disabled={!available && !selected}
                  className={[
                    'min-w-[3rem] rounded-full border px-4 py-2 text-sm transition',
                    selected
                      ? 'border-[var(--storefront-accent)] bg-[var(--storefront-accent)] text-[var(--storefront-accent-fg)]'
                      : 'border-[var(--storefront-line)] hover:border-[var(--storefront-accent)]',
                    !available && !selected
                      ? 'cursor-not-allowed opacity-40 line-through'
                      : '',
                  ].join(' ')}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function findVariant(
  variants: ReadonlyArray<ProductDetailVariant>,
  selected: Record<string, string>,
): ProductDetailVariant | undefined {
  return variants.find((variant) =>
    variant.selectedOptions.every(
      (opt) => selected[opt.name] === opt.value,
    ),
  )
}

export function defaultSelectedOptions(
  product: ProductDetail,
): Record<string, string> {
  const firstAvailable = product.variants.nodes.find((v) => v.availableForSale)
  const source = firstAvailable ?? product.variants.nodes[0]
  if (!source) return {}
  return Object.fromEntries(source.selectedOptions.map((o) => [o.name, o.value]))
}
