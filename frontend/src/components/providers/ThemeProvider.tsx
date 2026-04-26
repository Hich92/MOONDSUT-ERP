'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type AccentColor = 'yellow' | 'emerald' | 'teal' | 'blue' | 'violet' | 'rose'
export type ThemeMode   = 'light' | 'dark'

interface ThemeContextValue {
  mode:      ThemeMode
  accent:    AccentColor
  setMode:   (m: ThemeMode)   => void
  setAccent: (a: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light', accent: 'yellow',
  setMode: () => {}, setAccent: () => {},
})

export function useTheme() { return useContext(ThemeContext) }

function applyTheme(mode: ThemeMode, accent: AccentColor) {
  const html = document.documentElement
  html.classList.toggle('dark', mode === 'dark')
  if (accent === 'yellow') {
    html.removeAttribute('data-accent')
  } else {
    html.setAttribute('data-accent', accent)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode,   setModeState]   = useState<ThemeMode>('light')
  const [accent, setAccentState] = useState<AccentColor>('yellow')

  useEffect(() => {
    const m = (localStorage.getItem('erp-theme-mode')   as ThemeMode)   || 'light'
    const a = (localStorage.getItem('erp-theme-accent') as AccentColor) || 'yellow'
    setModeState(m)
    setAccentState(a)
    applyTheme(m, a)
  }, [])

  const setMode = (m: ThemeMode) => {
    setModeState(m)
    localStorage.setItem('erp-theme-mode', m)
    applyTheme(m, accent)
  }

  const setAccent = (a: AccentColor) => {
    setAccentState(a)
    localStorage.setItem('erp-theme-accent', a)
    applyTheme(mode, a)
  }

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}
