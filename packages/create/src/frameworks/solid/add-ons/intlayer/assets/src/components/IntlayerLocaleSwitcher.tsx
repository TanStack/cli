import { useLocation } from '@tanstack/solid-router'
import {
  getHTMLTextDir,
  getLocaleName,
  getPathWithoutLocale,
  getPrefix,
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
      <button type="button" class="demo-button" popovertarget="localePopover">
        {getLocaleName(locale())}
      </button>
      <div id="localePopover" popover="auto" class="demo-card m-auto p-2">
        <ul class="flex flex-col gap-1">
          <For each={availableLocales}>
            {(localeItem) => (
              <li>
                <LocalizedLink
                  class="demo-button w-full justify-start"
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
                    event.currentTarget
                      .closest<HTMLElement>('[popover]')
                      ?.hidePopover()
                  }}
                  params={{ locale: getPrefix(localeItem).localePrefix }}
                  to={pathWithoutLocale() as To}
                  replace // Will ensure that the "go back" browser button will redirect to the previous page
                >
                  <span dir={getHTMLTextDir(localeItem)} lang={localeItem}>
                    {getLocaleName(localeItem, localeItem)}
                  </span>
                </LocalizedLink>
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  )
}
