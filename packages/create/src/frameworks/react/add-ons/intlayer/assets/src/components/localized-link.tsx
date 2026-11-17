import type { FC } from 'react'

import { Link, type LinkComponentProps } from '@tanstack/react-router'
import { useLocale } from 'react-intlayer'
import { getPrefix } from 'intlayer'

export const LOCALE_ROUTE = '{-$locale}' as const

/**
 * Adds the locale segment to absolute paths. An omitted `to` goes to the locale
 * root, and relative paths ('.', '..') are kept as is.
 */
export const localizeTo = (to?: string) =>
  to === undefined || to.startsWith('/') ? `/${LOCALE_ROUTE}${to ?? ''}` : to

/** Adds the locale param, keeping the function form of `params`. */
export const localizeParams = (locale: string | undefined, params?: unknown) =>
  typeof params === 'function'
    ? (prev: Record<string, unknown>) => ({ locale, ...params(prev) })
    : { locale, ...(typeof params === 'object' ? params : {}) }

export type To = StripLocalePrefix<LinkComponentProps['to']>

export type StripLocalePrefix<T extends string | undefined> = T extends
  | `/${typeof LOCALE_ROUTE}/`
  | `/${typeof LOCALE_ROUTE}`
  ? '/'
  : T extends `/${typeof LOCALE_ROUTE}/${infer Rest}`
    ? `/${Rest}`
    : T

type LocalizedLinkProps = {
  to?: To
} & Omit<LinkComponentProps, 'to'>

export const LocalizedLink: FC<LocalizedLinkProps> = (props) => {
  const { locale } = useLocale()
  const { localePrefix } = getPrefix(locale)

  return (
    <Link
      {...props}
      params={
        localizeParams(
          localePrefix,
          props.params,
        ) as LinkComponentProps['params']
      }
      to={localizeTo(props.to) as LinkComponentProps['to']}
    />
  )
}
