import { useNavigate } from '@tanstack/react-router'
import { getPrefix } from 'intlayer'
import { useLocale } from 'react-intlayer'
import {
  localizeParams,
  localizeTo,
  type StripLocalePrefix,
} from '@/components/localized-link'
import type { FileRouteTypes } from '@/routeTree.gen'

type NavigateFn = ReturnType<typeof useNavigate>
type BaseNavigateOptions = Parameters<NavigateFn>[0]

type LocalizedTo = StripLocalePrefix<FileRouteTypes['to']>

export type LocalizedNavigateOptions = Omit<
  BaseNavigateOptions,
  'to' | 'params'
> & {
  to: LocalizedTo
  params?: Omit<NonNullable<BaseNavigateOptions['params']>, 'locale'>
}

type LocalizedNavigate = (
  options: LocalizedNavigateOptions,
) => ReturnType<NavigateFn>

export const useLocalizedNavigate = () => {
  const navigate = useNavigate()

  const { locale } = useLocale()

  const localizedNavigate: LocalizedNavigate = (args: any) => {
    const { localePrefix } = getPrefix(locale)
    const { to, params, ...rest } =
      typeof args === 'string' ? { to: args } : args

    return navigate({
      ...rest,
      to: localizeTo(to),
      params: localizeParams(localePrefix, params),
    } as any)
  }

  return localizedNavigate
}
