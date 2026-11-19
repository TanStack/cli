import { type Dictionary, t } from 'intlayer'

const intlayerDemoContent = {
  key: 'intlayer-demo',
  content: {
    title: t({
      en: 'Hello from Intlayer',
      fr: 'Bonjour depuis Intlayer',
      es: 'Hola desde Intlayer',
    }),
    description: t({
      en: 'Localized routes live under src/routes/{-$locale}: /demo/intlayer, /fr/demo/intlayer…',
      fr: 'Les routes localisées sont dans src/routes/{-$locale} : /demo/intlayer, /fr/demo/intlayer…',
      es: 'Las rutas localizadas están en src/routes/{-$locale}: /demo/intlayer, /fr/demo/intlayer…',
    }),
    currentLocale: t({
      en: 'Current locale:',
      fr: 'Langue actuelle :',
      es: 'Idioma actual:',
    }),
    learnMore: t({
      en: 'Learn how Intlayer works with TanStack Start',
      fr: 'Découvrir Intlayer avec TanStack Start',
      es: 'Descubre Intlayer con TanStack Start',
    }),
  },
} satisfies Dictionary

export default intlayerDemoContent
