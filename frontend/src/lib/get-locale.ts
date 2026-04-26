import { cookies } from 'next/headers'
import type { Locale } from './i18n'

export function getLocale(): Locale {
  const lang = cookies().get('lang')?.value
  return lang === 'fr' ? 'fr' : 'en'
}
