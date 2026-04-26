'use client'

import { usePreferences } from '@/components/providers/PreferencesProvider'
import { getT } from '@/lib/i18n'
import type { TKey } from '@/lib/i18n'

export function useTranslation() {
  const { prefs } = usePreferences()
  return getT(prefs.language)
}

export type { TKey }
