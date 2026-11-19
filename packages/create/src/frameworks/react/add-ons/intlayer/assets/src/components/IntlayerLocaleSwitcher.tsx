import { useLocation } from '@tanstack/react-router'
import {
  getHTMLTextDir,
  getLocaleName,
  getPathWithoutLocale,
  getPrefix,
} from 'intlayer'
import { useLocale } from 'react-intlayer'

import { LocalizedLink, type To } from './localized-link'

export default function IntlayerLocaleSwitcher() {
  const { pathname } = useLocation()

  const { availableLocales, locale, setLocale } = useLocale()

  const pathWithoutLocale = getPathWithoutLocale(pathname)

  return (
    <div>
      <button
        type="button"
        className="demo-button"
        popoverTarget="localePopover"
      >
        {getLocaleName(locale)}
      </button>
      <div id="localePopover" popover="auto" className="demo-card m-auto p-2">
        <ul className="flex flex-col gap-1">
          {availableLocales.map((localeItem) => (
            <li key={localeItem}>
              <LocalizedLink
                className="demo-button w-full justify-start"
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
                  event.currentTarget
                    .closest<HTMLElement>('[popover]')
                    ?.hidePopover()
                }}
                params={{ locale: getPrefix(localeItem).localePrefix }}
                to={pathWithoutLocale as To}
                replace // Will ensure that the "go back" browser button will redirect to the previous page
              >
                <span dir={getHTMLTextDir(localeItem)} lang={localeItem}>
                  {getLocaleName(localeItem, localeItem)}
                </span>
              </LocalizedLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
