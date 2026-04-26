import type { Locale } from './i18n'

export type { Locale }
export type AccentColor = 'yellow' | 'emerald' | 'teal' | 'blue' | 'violet' | 'rose'
export type ColorMode  = 'light' | 'dark' | 'system'

export interface UserPreferences {
  colorMode:   ColorMode
  accentColor: AccentColor
  language:    Locale
}

export const DEFAULT_PREFS: UserPreferences = {
  colorMode:   'light',
  accentColor: 'yellow',
  language:    'en',
}

const KEY = 'erp_prefs'

export function loadPrefs(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs: UserPreferences) {
  localStorage.setItem(KEY, JSON.stringify(prefs))
}

export function resolveColorMode(mode: ColorMode): 'light' | 'dark' {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return mode
}
