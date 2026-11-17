import { useLocation } from '@tanstack/react-router'
import {
  getHTMLTextDir,
  getLocaleName,
  getPathWithoutLocale,
  getPrefix,
  Locales,
} from 'intlayer'
import { useLocale } from 'react-intlayer'

import { LocalizedLink, type To } from './localized-link'

export default function IntlayerLocaleSwitcher() {
  const { pathname } = useLocation()

  const { availableLocales, locale, setLocale } = useLocale()

  const pathWithoutLocale = getPathWithoutLocale(pathname)

  return (
    <div>
      <button type="button" popoverTarget="localePopover">
        {getLocaleName(locale)}
      </button>
      <div id="localePopover" popover="auto">
        {availableLocales.map((localeItem) => (
          <LocalizedLink
            key={localeItem}
            aria-current={locale === localeItem ? 'page' : undefined}
            onClick={(event) => {
              // Ctrl/Cmd/Shift/Alt-click opens the link elsewhere: keep this page's locale
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return
              setLocale(localeItem)
            }}
            params={{ locale: getPrefix(localeItem).localePrefix }}
            to={pathWithoutLocale as To}
            replace // Will ensure that the "go back" browser button will redirect to the previous page
          >
            <span>
              {/* Locale - e.g. FR */}
              {localeItem}
            </span>
            <span>
              {/* Language in its own Locale - e.g. Français */}
              {getLocaleName(localeItem, locale)}
            </span>
            <span dir={getHTMLTextDir(localeItem)} lang={localeItem}>
              {/* Language in current Locale - e.g. Francés with current locale set to Locales.SPANISH */}
              {getLocaleName(localeItem)}
            </span>
            <span dir="ltr" lang={Locales.ENGLISH}>
              {/* Language in English - e.g. French */}
              {getLocaleName(localeItem, Locales.ENGLISH)}
            </span>
          </LocalizedLink>
        ))}
      </div>
    </div>
  )
}
