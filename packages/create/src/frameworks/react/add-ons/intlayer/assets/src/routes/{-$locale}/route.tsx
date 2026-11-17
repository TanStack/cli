import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { defaultLocale, validatePrefix } from 'intlayer'
import { IntlayerProvider } from 'react-intlayer'

// Routes nested under {-$locale} are localized: /demo/intlayer, /fr/demo/intlayer…
export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: ({ params }) => {
    // Unknown locale prefixes (e.g. /xx/demo/intlayer) are not found
    if (!validatePrefix(params.locale).isValid) throw notFound()
  },
  component: LocaleLayout,
})

function LocaleLayout() {
  const { locale = defaultLocale } = Route.useParams()

  return (
    <IntlayerProvider locale={locale}>
      <Outlet />
    </IntlayerProvider>
  )
}
