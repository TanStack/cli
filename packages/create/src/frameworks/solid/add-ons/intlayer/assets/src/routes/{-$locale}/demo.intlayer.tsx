import { createFileRoute } from '@tanstack/solid-router'
import { useIntlayer, useLocale } from 'solid-intlayer'

import IntlayerLocaleSwitcher from '../../components/IntlayerLocaleSwitcher'

export const Route = createFileRoute('/{-$locale}/demo/intlayer')({
  component: IntlayerDemo,
})

function IntlayerDemo() {
  const content = useIntlayer('intlayer-demo')
  const { locale } = useLocale()

  return (
    <main class="flex min-h-[60vh] items-center justify-center p-8 text-center">
      <section class="flex w-full max-w-2xl flex-col items-center gap-4">
        <h1 class="text-2xl font-bold">{content.title}</h1>
        <p class="text-lg opacity-80">{content.description}</p>
        <p>
          {content.currentLocale} <strong>{locale()}</strong>
        </p>
        <IntlayerLocaleSwitcher />
        <a
          href="https://intlayer.org/doc/environment/tanstack-start/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          {content.learnMore}
        </a>
      </section>
    </main>
  )
}
