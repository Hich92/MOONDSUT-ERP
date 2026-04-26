'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  UserPreferences, DEFAULT_PREFS,
  loadPrefs, savePrefs, resolveColorMode,
} from '@/lib/preferences'

interface PrefsCtx {
  prefs:    UserPreferences
  setPrefs: (p: Partial<UserPreferences>) => void
}

const Ctx = createContext<PrefsCtx>({ prefs: DEFAULT_PREFS, setPrefs: () => {} })

function syncLangCookie(lang: string) {
  document.cookie = `lang=${lang};path=/;max-age=31536000;SameSite=Lax`
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<UserPreferences>(DEFAULT_PREFS)

  const applyToDOM = useCallback((p: UserPreferences) => {
    const html = document.documentElement
    const resolved = resolveColorMode(p.colorMode)
    html.classList.toggle('dark', resolved === 'dark')
    html.dataset.accent = p.accentColor === 'yellow' ? '' : p.accentColor
  }, [])

  useEffect(() => {
    const loaded = loadPrefs()
    setPrefsState(loaded)
    applyToDOM(loaded)
    syncLangCookie(loaded.language)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const current = loadPrefs()
      if (current.colorMode === 'system') applyToDOM(current)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [applyToDOM])

  const setPrefs = useCallback((patch: Partial<UserPreferences>) => {
    setPrefsState(prev => {
      const next = { ...prev, ...patch }
      savePrefs(next)
      applyToDOM(next)
      if (patch.language !== undefined) {
        syncLangCookie(next.language)
      }
      return next
    })
  }, [applyToDOM])

  return <Ctx.Provider value={{ prefs, setPrefs }}>{children}</Ctx.Provider>
}

export function usePreferences() {
  return useContext(Ctx)
}
