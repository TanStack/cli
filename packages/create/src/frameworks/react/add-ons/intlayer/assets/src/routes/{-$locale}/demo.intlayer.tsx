import { createFileRoute } from '@tanstack/react-router'
import { useIntlayer, useLocale } from 'react-intlayer'

import IntlayerLocaleSwitcher from '@/components/IntlayerLocaleSwitcher'

export const Route = createFileRoute('/{-$locale}/demo/intlayer')({
  component: IntlayerDemo,
})

function IntlayerDemo() {
  const content = useIntlayer('intlayer-demo')
  const { locale } = useLocale()

  return (
    <main className="demo-page demo-center text-center">
      <section className="demo-panel flex w-full max-w-2xl flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <p className="demo-muted text-lg">{content.description}</p>
        <p>
          {content.currentLocale} <strong>{locale}</strong>
        </p>
        <IntlayerLocaleSwitcher />
        <a
          href="https://intlayer.org/doc/environment/tanstack-start"
          target="_blank"
          rel="noopener noreferrer"
        >
          {content.learnMore}
        </a>
      </section>
    </main>
  )
}
