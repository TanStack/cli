import { useLocation } from '@tanstack/solid-router'
import {
  getHTMLTextDir,
  getLocaleName,
  getPathWithoutLocale,
  getPrefix,
  Locales,
} from 'intlayer'
import { For } from 'solid-js'
import { useLocale } from 'solid-intlayer'

import { LocalizedLink, type To } from './LocalizedLink'

export default function IntlayerLocaleSwitcher() {
  const location = useLocation()

  const { availableLocales, locale, setLocale } = useLocale()

  const pathWithoutLocale = () => getPathWithoutLocale(location().pathname)

  return (
    <div>
      <button type="button" popovertarget="localePopover">
        {getLocaleName(locale())}
      </button>
      <div id="localePopover" popover="auto">
        <For each={availableLocales}>
          {(localeItem) => (
            <LocalizedLink
              aria-current={locale() === localeItem ? 'page' : undefined}
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
              to={pathWithoutLocale() as To}
              replace // Will ensure that the "go back" browser button will redirect to the previous page
            >
              <span>
                {/* Locale - e.g. FR */}
                {localeItem}
              </span>
              <span>
                {/* Language in its own Locale - e.g. Français */}
                {getLocaleName(localeItem, locale())}
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
          )}
        </For>
      </div>
    </div>
  )
}
