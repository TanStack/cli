import { Link, type LinkProps } from '@tanstack/solid-router'
import { getPrefix } from 'intlayer'
import { useLocale } from 'solid-intlayer'
import type { JSX } from 'solid-js'

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

export type RemoveLocaleParam<TVal> = TVal extends string
  ? RemoveLocaleFromString<TVal>
  : TVal

export type To = RemoveLocaleParam<LinkProps['to']>

type CollapseDoubleSlashes<TString extends string> =
  TString extends `${infer THead}//${infer TTail}`
    ? CollapseDoubleSlashes<`${THead}/${TTail}`>
    : TString

export type LocalizedLinkProps = Omit<LinkProps, 'to'> & {
  to?: To
} & JSX.AnchorHTMLAttributes<HTMLAnchorElement>

type RemoveAll<
  TString extends string,
  TSub extends string,
> = TString extends `${infer THead}${TSub}${infer TTail}`
  ? RemoveAll<`${THead}${TTail}`, TSub>
  : TString

type RemoveLocaleFromString<TString extends string> = CollapseDoubleSlashes<
  RemoveAll<TString, typeof LOCALE_ROUTE>
>

export const LocalizedLink = (props: LocalizedLinkProps) => {
  const { locale } = useLocale()

  return (
    <Link
      {...props}
      params={
        localizeParams(
          getPrefix(locale()).localePrefix,
          props.params,
        ) as LinkProps['params']
      }
      to={localizeTo(props.to) as LinkProps['to']}
    />
  )
}
